import React, { useEffect, useState, useRef } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Bot, Plus, Send, Trash2, Cpu, Zap } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  FormattedProse,
  ErrorBanner,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, handleFirestoreError, OperationType, tsMillis } from '../../lib/firebase';
import { apiFetch } from '../../lib/api';
import { AIConversationRecord, AIMessageRecord } from '../../types/hirepath';

const SUGGESTED_PROMPTS = [
  'Analyze my current skills and recommend the fastest path to become job-ready in 8 weeks.',
  'Design a realistic full-stack portfolio project that proves PostgreSQL and REST API mastery.',
  'Give me 5 tough system design and behavioral interview questions for an entry-level developer.',
  'How should I structure my resume projects section if I have academic projects but no internship yet?',
];

export function AIChatPage() {
  const { user, publicProfile, privateProfile } = useAuth();
  const { showToast, confirmAction } = useToast();

  const [conversations, setConversations] = useState<AIConversationRecord[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessageRecord[]>([]);
  const [mode, setMode] = useState<'deep' | 'fast'>('deep');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getDocs(
      query(
        collection(db, 'aiConversations'),
        where('uid', '==', user.uid)
      )
    )
      .then((snap) => {
        const list = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AIConversationRecord, 'id'>),
          }))
          .sort((a, b) => tsMillis(b.updatedAt) - tsMillis(a.updatedAt));
        setConversations(list);
        if (list.length > 0 && !activeConvId) {
          setActiveConvId(list[0].id);
        }
      })
      .catch((err) => handleFirestoreError(err, OperationType.LIST, 'aiConversations'));
  }, [user]);

  useEffect(() => {
    if (!user || !activeConvId) {
      setMessages([]);
      return;
    }
    getDocs(
      query(
        collection(db, 'aiConversations', activeConvId, 'messages'),
        where('uid', '==', user.uid)
      )
    )
      .then((snap) => {
        setMessages(
          snap.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<AIMessageRecord, 'id'>),
            }))
            .sort((a, b) => tsMillis(a.createdAt) - tsMillis(b.createdAt))
        );
      })
      .catch((err) =>
        handleFirestoreError(err, OperationType.LIST, `aiConversations/${activeConvId}/messages`)
      );
  }, [user, activeConvId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const startNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setError(null);
  };

  const handleDeleteConversation = async (id: string) => {
    const ok = await confirmAction({
      title: 'Clear this conversation?',
      message: 'This deletes the thread from your history.',
      confirmLabel: 'Clear Thread',
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteDoc(doc(db, 'aiConversations', id));
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        setActiveConvId(remaining[0]?.id || null);
      }
      showToast('Conversation deleted', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `aiConversations/${id}`);
    }
  };

  const sendMessage = async (textOverride?: string) => {
    const prompt = (textOverride ?? input).trim();
    if (!prompt || !user || sending) return;

    setInput('');
    setSending(true);
    setError(null);

    try {
      let convId = activeConvId;
      if (!convId) {
        convId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const title = prompt.slice(0, 60);
        await setDoc(doc(db, 'aiConversations', convId), {
          uid: user.uid,
          title,
          mode,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setConversations((prev) => [
          { id: convId!, uid: user.uid, title, mode },
          ...prev,
        ]);
        setActiveConvId(convId);
      } else {
        await updateDoc(doc(db, 'aiConversations', convId), {
          mode,
          updatedAt: serverTimestamp(),
        });
      }

      const userMsgId = `msg_${Date.now()}_u`;
      const userMsg: AIMessageRecord = {
        id: userMsgId,
        uid: user.uid,
        role: 'user',
        content: prompt,
      };
      setMessages((prev) => [...prev, userMsg]);

      await setDoc(doc(db, 'aiConversations', convId, 'messages', userMsgId), {
        uid: user.uid,
        role: 'user',
        content: prompt,
        createdAt: serverTimestamp(),
      });

      const historyPayload = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const skillsArray = Object.entries(publicProfile?.skillLevels || {}).map(
        ([name, level]) => ({ name, level })
      );

      const res = await apiFetch<{ reply: string; modelUsed: string }>('/api/v1/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: prompt,
          history: historyPayload,
          mode,
          userContext: {
            displayName: publicProfile?.displayName,
            targetCareerTitle: publicProfile?.targetCareerId,
            experienceLevel: privateProfile?.experienceLevel,
            skills: skillsArray,
          },
        }),
      });

      const aiMsgId = `msg_${Date.now()}_a`;
      const aiMsg: AIMessageRecord = {
        id: aiMsgId,
        uid: user.uid,
        role: 'assistant',
        content: res.reply,
        modelUsed: res.modelUsed,
      };
      setMessages((prev) => [...prev, aiMsg]);

      await setDoc(doc(db, 'aiConversations', convId, 'messages', aiMsgId), {
        uid: user.uid,
        role: 'assistant',
        content: res.reply,
        modelUsed: res.modelUsed,
        createdAt: serverTimestamp(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to reach HirePath AI.';
      setError(msg);
      showToast('AI request failed', 'error', msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="HirePath AI Career Assistant"
          subtitle="Context-aware mentorship for roadmaps, skill gaps, resume review, project architecture, and interview coaching."
          action={
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0D1424] border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('deep')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 ${
                  mode === 'deep'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                Deep Thinking
              </button>
              <button
                type="button"
                onClick={() => setMode('fast')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 ${
                  mode === 'fast'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Fast Q&amp;A
              </button>
            </div>
          }
        />

        {error && <ErrorBanner message={error} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Conversation History Sidebar */}
          <div className="lg:col-span-3 rounded-xl border border-slate-800/80 bg-[#0D1424] p-4 flex flex-col justify-between max-h-[650px]">
            <div className="space-y-3 overflow-y-auto">
              <button
                type="button"
                onClick={startNewConversation}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New Conversation
              </button>

              <div className="space-y-1 pt-2">
                <p className="text-xs font-medium text-slate-500 px-2 pb-1">
                  Saved History
                </p>
                {conversations.length === 0 ? (
                  <p className="text-xs text-slate-500 px-2">
                    Your conversations will be saved automatically.
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        activeConvId === conv.id
                          ? 'bg-blue-600/15 text-blue-300 border border-blue-500/25'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveConvId(conv.id)}
                        className="flex-1 text-left truncate"
                      >
                        {conv.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConversation(conv.id)}
                        className="text-slate-500 hover:text-rose-400 p-0.5"
                        aria-label="Delete thread"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Active Chat Thread */}
          <div className="lg:col-span-9 rounded-xl border border-slate-800/80 bg-[#0D1424] flex flex-col h-[650px]">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100">
                      Ask HirePath AI Anything About Your Career
                    </h2>
                    <p className="text-sm text-slate-400 mt-1.5">
                      Deep Thinking mode uses Gemini 4 Hydrogen with high reasoning depth for complex career planning and technical architecture reviews.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                    {SUGGESTED_PROMPTS.map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => sendMessage(sp)}
                        className="p-3 rounded-lg border border-slate-800 bg-[#070B14] hover:border-blue-500/40 text-xs text-slate-300 leading-relaxed transition-colors"
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-4 ${
                        m.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#070B14] border border-slate-800 text-slate-200'
                      }`}
                    >
                      {m.role === 'user' ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      ) : (
                        <>
                          <FormattedProse text={m.content} />
                          {m.modelUsed && (
                            <p className="text-[11px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-800/70">
                              Model: {m.modelUsed}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-xl border border-slate-800 bg-[#070B14] px-4 py-3 text-xs text-slate-400">
                    {mode === 'deep'
                      ? 'HirePath AI is reasoning through your career context...'
                      : 'Generating response...'}
                  </div>
                </div>
              )}
              <div ref={threadEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="p-4 border-t border-slate-800 flex items-center gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about skill gaps, project ideas, interview answers, or learning plans..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
