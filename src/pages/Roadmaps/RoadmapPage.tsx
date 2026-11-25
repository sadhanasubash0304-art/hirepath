import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  EmptyState,
  SkeletonBlock,
  ErrorBanner,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, handleFirestoreError, OperationType, tsMillis } from '../../lib/firebase';
import { apiFetch } from '../../lib/api';
import { CareerTrack, RoadmapDocument, RoadmapStage } from '../../types/hirepath';

export function RoadmapPage() {
  const { user, publicProfile, privateProfile, pushNotification } = useAuth();
  const { showToast, confirmAction } = useToast();

  const [careers, setCareers] = useState<CareerTrack[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapDocument[]>([]);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generator controls
  const [careerId, setCareerId] = useState(publicProfile?.targetCareerId || 'fullstack-dev');
  const [experienceLevel, setExperienceLevel] = useState(
    privateProfile?.experienceLevel || 'beginner'
  );
  const [weeklyHours, setWeeklyHours] = useState(
    privateProfile?.weeklyHoursAvailable || 10
  );
  const [learningGoal, setLearningGoal] = useState('');

  useEffect(() => {
    if (publicProfile?.targetCareerId) {
      setCareerId(publicProfile.targetCareerId);
    }
  }, [publicProfile?.targetCareerId]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [careersRes, roadmapSnap] = await Promise.all([
          apiFetch<{ careers: CareerTrack[] }>('/api/v1/careers'),
          getDocs(
            query(
              collection(db, 'roadmaps'),
              where('uid', '==', user!.uid)
            )
          ).catch((err) => handleFirestoreError(err, OperationType.LIST, 'roadmaps')),
        ]);

        if (!active) return;
        setCareers(careersRes.careers);
        const list = roadmapSnap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<RoadmapDocument, 'id'>),
          }))
          .sort((a, b) => tsMillis(b.updatedAt) - tsMillis(a.updatedAt));
        setRoadmaps(list);
        if (list.length > 0 && !selectedRoadmapId) {
          setSelectedRoadmapId(list[0].id);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load roadmaps.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  const activeRoadmap =
    roadmaps.find((r) => r.id === selectedRoadmapId) || roadmaps[0] || null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setGenerating(true);
    setError(null);
    try {
      const currentSkills = publicProfile?.skillNames || [];
      const generated = await apiFetch<{
        careerId: string;
        careerTitle: string;
        stages: RoadmapStage[];
      }>('/api/v1/ai/roadmap', {
        method: 'POST',
        body: JSON.stringify({
          careerId,
          experienceLevel,
          weeklyHours: Number(weeklyHours),
          currentSkills,
          learningGoal,
        }),
      });

      const roadmapId = `rm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const normalizedStages: RoadmapStage[] = (generated.stages || []).slice(0, 12).map((st, idx) => ({
        stageNumber: st.stageNumber || idx + 1,
        title: st.title || `Stage ${idx + 1}`,
        objective: st.objective || '',
        estimatedHours: Number(st.estimatedHours) || 12,
        topics: Array.isArray(st.topics) ? st.topics.slice(0, 8) : [],
        lessons: Array.isArray(st.lessons)
          ? st.lessons.map((l, lIdx) => ({
              id: l.id || `s${idx + 1}_l${lIdx + 1}`,
              title: l.title || `Lesson ${lIdx + 1}`,
              durationMinutes: Number(l.durationMinutes) || 45,
              practicalTask: l.practicalTask || 'Complete hands-on exercise',
            }))
          : [],
        recommendedResourceTitle: st.recommendedResourceTitle || '',
      }));

      const newDoc = {
        uid: user.uid,
        careerId: generated.careerId,
        careerTitle: generated.careerTitle,
        experienceLevel,
        weeklyHours: Number(weeklyHours),
        stages: normalizedStages,
        completedLessonIds: [] as string[],
        progressPercent: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'roadmaps', roadmapId), newDoc).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `roadmaps/${roadmapId}`)
      );

      const localRoadmap: RoadmapDocument = { id: roadmapId, ...newDoc };
      setRoadmaps((prev) => [localRoadmap, ...prev]);
      setSelectedRoadmapId(roadmapId);
      setExpandedStage(1);
      showToast('Personalized AI roadmap created', 'success');
      await pushNotification(user.uid, {
        type: 'roadmap',
        title: 'Roadmap Generated',
        message: `Your ${generated.careerTitle} roadmap (${normalizedStages.length} stages) is ready.`,
        link: '/roadmap',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate roadmap.';
      setError(msg);
      showToast('Roadmap generation failed', 'error', msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleLesson = async (lessonId: string) => {
    if (!activeRoadmap || !user) return;
    const currentCompleted = new Set(activeRoadmap.completedLessonIds || []);
    if (currentCompleted.has(lessonId)) {
      currentCompleted.delete(lessonId);
    } else {
      currentCompleted.add(lessonId);
    }

    const totalLessons = activeRoadmap.stages.reduce(
      (acc, st) => acc + (st.lessons?.length || 0),
      0
    );
    const updatedCompleted = Array.from(currentCompleted);
    const progressPercent =
      totalLessons > 0
        ? Math.min(100, Math.round((updatedCompleted.length / totalLessons) * 100))
        : 0;

    setRoadmaps((prev) =>
      prev.map((r) =>
        r.id === activeRoadmap.id
          ? { ...r, completedLessonIds: updatedCompleted, progressPercent }
          : r
      )
    );

    try {
      await updateDoc(doc(db, 'roadmaps', activeRoadmap.id), {
        completedLessonIds: updatedCompleted,
        progressPercent,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `roadmaps/${activeRoadmap.id}`);
    }
  };

  const handleDeleteRoadmap = async (id: string) => {
    const confirmed = await confirmAction({
      title: 'Delete learning roadmap?',
      message: 'This permanently removes the roadmap and its lesson completion progress.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'roadmaps', id));
      const remaining = roadmaps.filter((r) => r.id !== id);
      setRoadmaps(remaining);
      setSelectedRoadmapId(remaining[0]?.id || null);
      showToast('Roadmap deleted', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `roadmaps/${id}`);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="AI Personalized Learning Roadmap"
          subtitle="Generate customized multi-stage curricula with Gemini high-thinking reasoning and track lesson completion in real time."
        />

        {error && <ErrorBanner message={error} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Roadmap Generator Form */}
          <SurfaceCard className="lg:col-span-4 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">
              Generate New Roadmap
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Career Track
                </label>
                <select
                  value={careerId}
                  onChange={(e) => setCareerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {careers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Experience
                  </label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Hours / Week
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Learning Goal (optional)
                </label>
                <textarea
                  rows={2}
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="e.g. Prepare for backend internships in 10 weeks"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {generating ? 'Designing Roadmap with Gemini...' : 'Generate AI Roadmap'}
                </span>
              </button>
            </form>

            {roadmaps.length > 1 && (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <p className="text-xs font-medium text-slate-400">Saved Roadmaps</p>
                {roadmaps.map((rm) => (
                  <div
                    key={rm.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs ${
                      rm.id === activeRoadmap?.id
                        ? 'border-blue-500/40 bg-blue-950/20 text-slate-100'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedRoadmapId(rm.id)}
                      className="text-left flex-1 truncate font-medium"
                    >
                      {rm.careerTitle} · {rm.progressPercent}%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoadmap(rm.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      aria-label="Delete roadmap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>

          {/* Active Roadmap Stages */}
          <div className="lg:col-span-8 space-y-4">
            {loading ? (
              <SkeletonBlock className="h-72" />
            ) : !activeRoadmap ? (
              <EmptyState
                title="No saved learning roadmap yet"
                description="Choose your target career track and weekly study availability on the left to generate a personalized multi-stage roadmap."
              />
            ) : (
              <>
                <SurfaceCard>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-cyan-400">
                        {activeRoadmap.experienceLevel || 'Personalized'} ·{' '}
                        {activeRoadmap.weeklyHours || 10} hrs/week
                      </p>
                      <h2 className="text-xl font-semibold text-slate-100 mt-1">
                        {activeRoadmap.careerTitle} Roadmap
                      </h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-2xl font-mono font-semibold text-slate-100 tabular-nums">
                          {activeRoadmap.progressPercent}%
                        </span>
                        <p className="text-xs text-slate-400">Completed</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoadmap(activeRoadmap.id)}
                        className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40"
                        aria-label="Delete active roadmap"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 mt-4 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300"
                      style={{ width: `${activeRoadmap.progressPercent}%` }}
                    />
                  </div>
                </SurfaceCard>

                <div className="space-y-3">
                  {activeRoadmap.stages.map((stage) => {
                    const isOpen = expandedStage === stage.stageNumber;
                    const stageLessons = stage.lessons || [];
                    const completedInStage = stageLessons.filter((l) =>
                      activeRoadmap.completedLessonIds.includes(l.id)
                    ).length;

                    return (
                      <div
                        key={stage.stageNumber}
                        className="rounded-xl border border-slate-800/80 bg-[#0D1424] overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedStage(isOpen ? -1 : stage.stageNumber)
                          }
                          className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400 tabular-nums">
                              Stage {stage.stageNumber} · ~{stage.estimatedHours}h ·{' '}
                              {completedInStage}/{stageLessons.length} lessons
                            </p>
                            <h3 className="text-base font-semibold text-slate-100 mt-0.5 truncate">
                              {stage.title}
                            </h3>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 pt-2 border-t border-slate-800/70 space-y-4">
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {stage.objective}
                            </p>
                            {stage.topics?.length > 0 && (
                              <p className="text-xs text-slate-400">
                                Topics: {stage.topics.join(' · ')}
                              </p>
                            )}

                            <div className="divide-y divide-slate-800/70">
                              {stageLessons.map((lesson) => {
                                const done = activeRoadmap.completedLessonIds.includes(
                                  lesson.id
                                );
                                return (
                                  <div
                                    key={lesson.id}
                                    className="py-3 flex items-start justify-between gap-4"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleToggleLesson(lesson.id)}
                                      className="flex items-start gap-3 text-left flex-1 group"
                                    >
                                      {done ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                      ) : (
                                        <Circle className="w-5 h-5 text-slate-500 group-hover:text-blue-400 shrink-0 mt-0.5" />
                                      )}
                                      <div>
                                        <p
                                          className={`text-sm font-medium ${
                                            done
                                              ? 'text-slate-400 line-through'
                                              : 'text-slate-100'
                                          }`}
                                        >
                                          {lesson.title}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                          Task: {lesson.practicalTask}
                                        </p>
                                      </div>
                                    </button>
                                    <span className="text-xs font-mono text-slate-500 tabular-nums shrink-0">
                                      {lesson.durationMinutes}m
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                              <span className="text-slate-400">
                                {stage.recommendedResourceTitle
                                  ? `Suggested resource: ${stage.recommendedResourceTitle}`
                                  : ''}
                              </span>
                              <div className="flex items-center gap-4">
                                <Link
                                  to="/resources"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  Open Resource Library
                                </Link>
                                <Link
                                  to="/quizzes"
                                  className="text-cyan-400 hover:text-cyan-300"
                                >
                                  Take Stage Quiz
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
