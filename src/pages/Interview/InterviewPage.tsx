import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Clock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  EmptyState,
  ErrorBanner,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, handleFirestoreError, OperationType, tsMillis } from '../../lib/firebase';
import { apiFetch } from '../../lib/api';
import {
  CareerTrack,
  InterviewQuestion,
  InterviewSessionRecord,
} from '../../types/hirepath';

export function InterviewPage() {
  const { user, publicProfile } = useAuth();
  const { showToast } = useToast();

  const [careers, setCareers] = useState<CareerTrack[]>([]);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [history, setHistory] = useState<InterviewSessionRecord[]>([]);

  const [careerFilter, setCareerFilter] = useState(
    publicProfile?.targetCareerId || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion | null>(null);
  const [showSample, setShowSample] = useState(false);
  const [answer, setAnswer] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    strengths: string[];
    improvements: string[];
    refinedExample: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ careers: CareerTrack[] }>('/api/v1/careers')
      .then((res) => setCareers(res.careers))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({
      careerId: careerFilter,
      category: categoryFilter,
      difficulty: difficultyFilter,
    });
    apiFetch<{ questions: InterviewQuestion[] }>(
      `/api/v1/interview/questions?${params.toString()}`
    )
      .then((res) => {
        setQuestions(res.questions);
        if (res.questions.length > 0) {
          setSelectedQuestion(res.questions[0]);
          setShowSample(false);
          setEvaluationResult(null);
        } else {
          setSelectedQuestion(null);
        }
      })
      .catch(() => {});
  }, [careerFilter, categoryFilter, difficultyFilter]);

  useEffect(() => {
    if (!user) return;
    getDocs(
      query(
        collection(db, 'interviewSessions'),
        where('uid', '==', user.uid)
      )
    )
      .then((snap) => {
        setHistory(
          snap.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<InterviewSessionRecord, 'id'>),
            }))
            .sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt))
        );
      })
      .catch((err) => handleFirestoreError(err, OperationType.LIST, 'interviewSessions'));
  }, [user]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !user) return;
    if (answer.trim().length < 15) {
      showToast('Please write a more detailed response before submitting', 'error');
      return;
    }

    setEvaluating(true);
    setTimerRunning(false);
    setError(null);
    try {
      const careerTitle =
        careers.find((c) => c.id === selectedQuestion.careerId)?.title || 'Software Role';

      const feedback = await apiFetch<{
        score: number;
        strengths: string[];
        improvements: string[];
        refinedExample: string;
      }>('/api/v1/ai/interview-feedback', {
        method: 'POST',
        body: JSON.stringify({
          careerTitle,
          question: selectedQuestion.question,
          userAnswer: answer,
        }),
      });

      setEvaluationResult(feedback);

      const sessionId = `iv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const summaryFeedback = [
        `Score: ${feedback.score}/100`,
        feedback.strengths.length ? `Strengths: ${feedback.strengths.join('; ')}` : '',
        feedback.improvements.length ? `Improvements: ${feedback.improvements.join('; ')}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      await setDoc(doc(db, 'interviewSessions', sessionId), {
        uid: user.uid,
        careerId: selectedQuestion.careerId,
        question: selectedQuestion.question,
        category: selectedQuestion.category,
        difficulty: selectedQuestion.difficulty,
        userAnswer: answer.slice(0, 6000),
        aiFeedback: summaryFeedback.slice(0, 6000),
        score: feedback.score,
        durationSeconds: elapsedSeconds,
        createdAt: serverTimestamp(),
      });

      setHistory((prev) => [
        {
          id: sessionId,
          uid: user.uid,
          careerId: selectedQuestion.careerId,
          question: selectedQuestion.question,
          category: selectedQuestion.category,
          difficulty: selectedQuestion.difficulty,
          userAnswer: answer,
          aiFeedback: summaryFeedback,
          score: feedback.score,
          durationSeconds: elapsedSeconds,
        },
        ...prev,
      ]);
      showToast(`Interview answer scored: ${feedback.score}/100`, 'success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Interview Preparation Studio"
          subtitle="Practice role-specific technical and HR interview questions with timed mode and structured Gemini rubric evaluation."
        />

        {error && <ErrorBanner message={error} />}

        <SurfaceCard className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={careerFilter}
            onChange={(e) => setCareerFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
          >
            <option value="all">All Career Tracks</option>
            {careers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
          >
            <option value="all">All Categories</option>
            <option value="Technical">Technical</option>
            <option value="Role-Specific">Role-Specific</option>
            <option value="HR">HR &amp; Behavioral</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
          >
            <option value="all">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </SurfaceCard>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Question List */}
          <SurfaceCard className="lg:col-span-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-100 pb-2 border-b border-slate-800">
              Question Bank ({questions.length})
            </h2>
            {questions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">
                No questions match the selected filters.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {questions.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setSelectedQuestion(q);
                      setShowSample(false);
                      setEvaluationResult(null);
                      setAnswer('');
                      setElapsedSeconds(0);
                      setTimerRunning(false);
                    }}
                    className={`w-full text-left py-3 px-2 rounded-lg transition-colors ${
                      selectedQuestion?.id === q.id
                        ? 'bg-blue-600/15 text-blue-300'
                        : 'text-slate-300 hover:bg-slate-800/30'
                    }`}
                  >
                    <p className="text-[11px] text-slate-400">
                      {q.category} · {q.difficulty}
                    </p>
                    <p className="text-xs font-medium mt-1 line-clamp-2">{q.question}</p>
                  </button>
                ))}
              </div>
            )}
          </SurfaceCard>

          {/* Active Practice Workspace */}
          <div className="lg:col-span-8 space-y-5">
            {!selectedQuestion ? (
              <EmptyState
                title="Select a question to practice"
                description="Filter by career track or category on the left to load interview questions."
              />
            ) : (
              <SurfaceCard className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-cyan-400 font-medium">
                    {selectedQuestion.category} · {selectedQuestion.difficulty}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-300 tabular-nums inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {Math.floor(elapsedSeconds / 60)}:
                      {String(elapsedSeconds % 60).padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTimerRunning((prev) => !prev)}
                      className="px-2.5 py-1 rounded border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      {timerRunning ? 'Pause Timer' : 'Start Timed Mode'}
                    </button>
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-slate-100 leading-snug">
                  {selectedQuestion.question}
                </h2>

                <form onSubmit={handleEvaluate} className="space-y-3">
                  <textarea
                    rows={6}
                    value={answer}
                    onChange={(e) => {
                      if (!timerRunning && elapsedSeconds === 0 && e.target.value.length === 1) {
                        setTimerRunning(true);
                      }
                      setAnswer(e.target.value);
                    }}
                    placeholder="Structure your answer clearly (concept, tradeoffs, and concrete example)..."
                    className="w-full px-4 py-3 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSample((prev) => !prev)}
                      className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5"
                    >
                      {showSample ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showSample ? 'Hide Sample Answer' : 'Reveal Sample Answer'}
                    </button>

                    <button
                      type="submit"
                      disabled={evaluating}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {evaluating ? 'Evaluating with Gemini...' : 'Submit for AI Feedback'}
                    </button>
                  </div>
                </form>

                {showSample && (
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <p className="text-xs font-semibold text-slate-300">
                      Reference Answer &amp; Key Signals
                    </p>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {selectedQuestion.sampleAnswer}
                    </p>
                    <p className="text-xs text-slate-400">
                      Interviewers look for: {selectedQuestion.keySignals.join(' · ')}
                    </p>
                  </div>
                )}

                {evaluationResult && (
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-100">
                        Gemini Interview Evaluation
                      </h3>
                      <span className="font-mono text-lg font-semibold text-cyan-400 tabular-nums">
                        {evaluationResult.score}/100
                      </span>
                    </div>
                    {evaluationResult.strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-400">Strengths</p>
                        <ul className="text-xs text-slate-300 mt-1 space-y-1">
                          {evaluationResult.strengths.map((s) => (
                            <li key={s}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {evaluationResult.improvements.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-400">Areas to Strengthen</p>
                        <ul className="text-xs text-slate-300 mt-1 space-y-1">
                          {evaluationResult.improvements.map((s) => (
                            <li key={s}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {evaluationResult.refinedExample && (
                      <div>
                        <p className="text-xs font-semibold text-blue-400">Refined Framing</p>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {evaluationResult.refinedExample}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </SurfaceCard>
            )}

            {history.length > 0 && (
              <SurfaceCard>
                <h2 className="text-base font-semibold text-slate-100 mb-3">
                  Recent Practice History
                </h2>
                <div className="divide-y divide-slate-800/70">
                  {history.slice(0, 5).map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {item.question}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.category} · {item.durationSeconds || 0}s elapsed
                        </p>
                      </div>
                      <span className="font-mono text-sm font-semibold text-cyan-400 tabular-nums shrink-0">
                        {item.score}/100
                      </span>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
