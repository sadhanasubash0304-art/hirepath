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
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  SkeletonBlock,
  ErrorBanner,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, handleFirestoreError, OperationType, tsMillis } from '../../lib/firebase';
import { apiFetch } from '../../lib/api';
import { QuizSummary, QuizAttemptRecord } from '../../types/hirepath';

interface QuizDetailQuestion {
  id: string;
  prompt: string;
  options: string[];
  skillTag: string;
}

interface QuizDetail {
  id: string;
  title: string;
  careerId: string;
  description: string;
  difficulty: string;
  timeLimitSeconds: number;
  questions: QuizDetailQuestion[];
}

interface GradedResponse {
  quizId: string;
  quizTitle: string;
  careerId: string;
  difficulty: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  skillBoosts: Record<string, number>;
  results: Array<{
    questionId: string;
    prompt: string;
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    explanation: string;
    skillTag: string;
  }>;
}

export function QuizzesPage() {
  const { user, publicProfile, updateProfiles, pushNotification } = useAuth();
  const { showToast } = useToast();

  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [graded, setGraded] = useState<GradedResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiFetch<{ quizzes: QuizSummary[] }>('/api/v1/quizzes'),
      getDocs(
        query(
          collection(db, 'quizAttempts'),
          where('uid', '==', user.uid)
        )
      ).catch((err) => handleFirestoreError(err, OperationType.LIST, 'quizAttempts')),
    ])
      .then(([quizRes, attemptSnap]) => {
        setQuizzes(quizRes.quizzes);
        setAttempts(
          attemptSnap.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<QuizAttemptRecord, 'id'>),
            }))
            .sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt))
        );
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load quizzes.')
      )
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!activeQuiz || graded) return;
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, graded, secondsLeft]);

  const startQuiz = async (quizId: string) => {
    setError(null);
    setGraded(null);
    setAnswers({});
    try {
      const res = await apiFetch<{ quiz: QuizDetail }>(`/api/v1/quizzes/${quizId}`);
      setActiveQuiz(res.quiz);
      setSecondsLeft(res.quiz.timeLimitSeconds);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load quiz.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuiz || !user || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await apiFetch<GradedResponse>(
        `/api/v1/quizzes/${activeQuiz.id}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ answers }),
        }
      );

      setGraded(result);
      const durationSeconds = Math.max(10, activeQuiz.timeLimitSeconds - secondsLeft);
      const attemptId = `qa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      await setDoc(doc(db, 'quizAttempts', attemptId), {
        uid: user.uid,
        quizId: result.quizId,
        quizTitle: result.quizTitle,
        careerId: result.careerId,
        difficulty: result.difficulty,
        score: result.score,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions,
        durationSeconds,
        createdAt: serverTimestamp(),
      });

      // Update skill levels based on verified server boosts
      const currentSkills = { ...(publicProfile?.skillLevels || {}) };
      Object.entries(result.skillBoosts).forEach(([skill, boost]) => {
        currentSkills[skill] = Math.min(100, (currentSkills[skill] || 20) + boost);
      });
      const updatedNames = Array.from(
        new Set([...(publicProfile?.skillNames || []), ...Object.keys(currentSkills)])
      ).slice(0, 30);

      await updateProfiles({
        skillLevels: currentSkills,
        skillNames: updatedNames,
        learningHours: Number(((publicProfile?.learningHours || 0) + 0.5).toFixed(1)),
      });

      setAttempts((prev) => [
        {
          id: attemptId,
          uid: user.uid,
          quizId: result.quizId,
          quizTitle: result.quizTitle,
          careerId: result.careerId,
          difficulty: result.difficulty,
          score: result.score,
          correctCount: result.correctCount,
          totalQuestions: result.totalQuestions,
          durationSeconds,
        },
        ...prev,
      ]);

      await pushNotification(user.uid, {
        type: 'quiz',
        title: `Quiz Graded: ${result.score}%`,
        message: `Completed ${result.quizTitle} (${result.correctCount}/${result.totalQuestions} correct).`,
        link: '/quizzes',
      });

      showToast(`Assessment graded: ${result.score}%`, 'success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Quiz submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Quizzes & Skill Assessments"
          subtitle="Timed assessments verified server-side with detailed answer explanations and automatic skill profile updates."
        />

        {error && <ErrorBanner message={error} />}

        {activeQuiz ? (
          <SurfaceCard className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <p className="text-xs text-cyan-400">
                  {activeQuiz.difficulty} · {activeQuiz.questions.length} questions
                </p>
                <h2 className="text-xl font-semibold text-slate-100 mt-1">
                  {activeQuiz.title}
                </h2>
              </div>
              <div className="flex items-center gap-4">
                {!graded && (
                  <span className="font-mono text-sm text-slate-200 tabular-nums inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400" />
                    {Math.floor(secondsLeft / 60)}:
                    {String(secondsLeft % 60).padStart(2, '0')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveQuiz(null);
                    setGraded(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Back to Quizzes
                </button>
              </div>
            </div>

            {graded ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-[#070B14] p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Verified Assessment Score</p>
                    <p className="text-3xl font-mono font-bold text-cyan-400 tabular-nums mt-1">
                      {graded.score}%
                    </p>
                  </div>
                  <p className="text-sm text-slate-300 tabular-nums">
                    {graded.correctCount} of {graded.totalQuestions} questions answered correctly
                  </p>
                </div>

                <div className="space-y-4">
                  {graded.results.map((item, idx) => (
                    <div
                      key={item.questionId}
                      className="rounded-xl border border-slate-800 bg-[#070B14] p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-100">
                          {idx + 1}. {item.prompt}
                        </p>
                        {item.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Skill: {item.skillTag} ·{' '}
                        <span className={item.isCorrect ? 'text-emerald-400' : 'text-rose-400'}>
                          {item.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        Explanation: {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {activeQuiz.questions.map((q, idx) => (
                  <div key={q.id} className="space-y-3 pb-5 border-b border-slate-800/80 last:border-b-0">
                    <p className="text-sm font-medium text-slate-100">
                      {idx + 1}. {q.prompt}{' '}
                      <span className="text-xs text-slate-500">({q.skillTag})</span>
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const checked = answers[q.id] === optIdx;
                        return (
                          <label
                            key={optIdx}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer text-sm transition-colors ${
                              checked
                                ? 'border-blue-500 bg-blue-600/15 text-slate-100'
                                : 'border-slate-800 bg-[#070B14] text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={checked}
                              onChange={() =>
                                setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                              }
                              className="mt-1 accent-blue-500"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold"
                  >
                    {submitting ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                </div>
              </form>
            )}
          </SurfaceCard>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SkeletonBlock className="h-44" />
            <SkeletonBlock className="h-44" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {quizzes.map((q) => (
                <SurfaceCard key={q.id} className="flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-cyan-400 font-medium">
                      {q.difficulty} · {q.questionCount} questions ·{' '}
                      {Math.round(q.timeLimitSeconds / 60)} min
                    </p>
                    <h2 className="text-lg font-semibold text-slate-100 mt-1.5">
                      {q.title}
                    </h2>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      {q.description}
                    </p>
                  </div>
                  <div className="pt-4 mt-5 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Server-graded attempt</span>
                    <button
                      type="button"
                      onClick={() => startQuiz(q.id)}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      Start Assessment
                    </button>
                  </div>
                </SurfaceCard>
              ))}
            </div>

            {attempts.length > 0 && (
              <SurfaceCard>
                <h2 className="text-base font-semibold text-slate-100 mb-3">
                  Your Attempt History
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs text-slate-400">
                        <th className="py-2 pr-4 font-medium">Assessment</th>
                        <th className="py-2 px-4 font-medium">Difficulty</th>
                        <th className="py-2 px-4 font-medium">Correct</th>
                        <th className="py-2 pl-4 font-medium text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {attempts.map((a) => (
                        <tr key={a.id}>
                          <td className="py-2.5 pr-4 text-slate-200 font-medium">
                            {a.quizTitle}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-slate-400">
                            {a.difficulty || 'Standard'}
                          </td>
                          <td className="py-2.5 px-4 text-xs font-mono text-slate-300 tabular-nums">
                            {a.correctCount}/{a.totalQuestions}
                          </td>
                          <td className="py-2.5 pl-4 text-right font-mono text-sm font-semibold text-cyan-400 tabular-nums">
                            {a.score}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SurfaceCard>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
