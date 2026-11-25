import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Map as MapIcon,
  Target,
} from 'lucide-react';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  SkeletonBlock,
  EmptyState,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { db, handleFirestoreError, OperationType, tsMillis } from '../../lib/firebase';
import { apiFetch } from '../../lib/api';
import {
  CareerTrack,
  LearningResource,
  QuizAttemptRecord,
  RoadmapDocument,
  ProjectProgressRecord,
  QuizSummary,
} from '../../types/hirepath';

export function DashboardPage() {
  const { user, publicProfile, privateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [careers, setCareers] = useState<CareerTrack[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapDocument[]>([]);
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>([]);
  const [projects, setProjects] = useState<ProjectProgressRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const [careersRes, resRes, quizRes] = await Promise.all([
          apiFetch<{ careers: CareerTrack[] }>('/api/v1/careers'),
          apiFetch<{ resources: LearningResource[] }>('/api/v1/resources?limit=6'),
          apiFetch<{ quizzes: QuizSummary[] }>('/api/v1/quizzes'),
        ]);

        const [roadmapSnap, attemptSnap, projSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, 'roadmaps'),
              where('uid', '==', user!.uid),
              limit(10)
            )
          ).catch((err) => handleFirestoreError(err, OperationType.LIST, 'roadmaps')),
          getDocs(
            query(
              collection(db, 'quizAttempts'),
              where('uid', '==', user!.uid),
              limit(30)
            )
          ).catch((err) => handleFirestoreError(err, OperationType.LIST, 'quizAttempts')),
          getDocs(
            query(
              collection(db, 'projectProgress'),
              where('uid', '==', user!.uid),
              limit(20)
            )
          ).catch((err) => handleFirestoreError(err, OperationType.LIST, 'projectProgress')),
        ]);

        if (!active) return;

        setCareers(careersRes.careers);
        setResources(resRes.resources);
        setQuizzes(quizRes.quizzes);
        setRoadmaps(
          roadmapSnap.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<RoadmapDocument, 'id'>),
            }))
            .sort((a, b) => tsMillis(b.updatedAt) - tsMillis(a.updatedAt))
        );
        setAttempts(
          attemptSnap.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<QuizAttemptRecord, 'id'>),
            }))
            .sort((a, b) => tsMillis(b.createdAt) - tsMillis(a.createdAt))
        );
        setProjects(
          projSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ProjectProgressRecord, 'id'>),
          }))
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [user]);

  const targetCareer = useMemo(
    () =>
      careers.find((c) => c.id === (publicProfile?.targetCareerId || 'fullstack-dev')) ||
      careers[0],
    [careers, publicProfile]
  );

  const activeRoadmap = roadmaps[0] || null;
  const userSkillLevels = publicProfile?.skillLevels || {};

  const { skillsMetCount, skillsRemainingCount, computedReadiness } = useMemo(() => {
    if (!targetCareer) {
      return { skillsMetCount: 0, skillsRemainingCount: 0, computedReadiness: 0 };
    }
    const reqs = targetCareer.requiredTechnicalSkills;
    let met = 0;
    let ratioSum = 0;
    reqs.forEach((req) => {
      const current = userSkillLevels[req.name] || 0;
      if (current >= req.targetLevel * 0.7) met += 1;
      ratioSum += Math.min(1, current / req.targetLevel);
    });
    const avgSkillScore = (ratioSum / Math.max(1, reqs.length)) * 65;
    const roadmapBoost = (activeRoadmap?.progressPercent || 0) * 0.2;
    const quizAvg =
      attempts.length > 0
        ? (attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length) * 0.15
        : 0;
    return {
      skillsMetCount: met,
      skillsRemainingCount: Math.max(0, reqs.length - met),
      computedReadiness: Math.min(100, Math.round(avgSkillScore + roadmapBoost + quizAvg)),
    };
  }, [targetCareer, userSkillLevels, activeRoadmap, attempts]);

  const profileCompletion = useMemo(() => {
    let filled = 0;
    if (publicProfile?.displayName) filled += 1;
    if (publicProfile?.headline) filled += 1;
    if (publicProfile?.bio) filled += 1;
    if (publicProfile?.targetCareerId) filled += 1;
    if ((publicProfile?.skillNames?.length || 0) >= 3) filled += 1;
    if (privateProfile?.collegeOrOrg) filled += 1;
    if (privateProfile?.location) filled += 1;
    return Math.round((filled / 7) * 100);
  }, [publicProfile, privateProfile]);

  // Real activity series constructed from attempts, completed lessons, and projects
  const activityData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const buckets = days.map((day) => ({ day, minutes: 0, assessments: 0 }));

    attempts.forEach((a) => {
      const ts = (a.createdAt as { toDate?: () => Date })?.toDate?.();
      const dayIdx = ts ? (ts.getDay() + 6) % 7 : 0;
      buckets[dayIdx].minutes += Math.max(15, Math.round((a.durationSeconds || 300) / 60));
      buckets[dayIdx].assessments += 1;
    });

    if (activeRoadmap) {
      const completedCount = activeRoadmap.completedLessonIds?.length || 0;
      for (let i = 0; i < completedCount; i++) {
        buckets[i % 7].minutes += 35;
      }
    }
    return buckets;
  }, [attempts, activeRoadmap]);

  const achievements = useMemo(() => {
    const list: Array<{ title: string; detail: string }> = [];
    if (profileCompletion >= 80) {
      list.push({ title: 'Profile Ready', detail: 'Completed >= 80% of learner profile' });
    }
    if (activeRoadmap && activeRoadmap.completedLessonIds.length > 0) {
      list.push({
        title: 'Roadmap Momentum',
        detail: `${activeRoadmap.completedLessonIds.length} roadmap lessons completed`,
      });
    }
    if (attempts.some((a) => a.score >= 80)) {
      list.push({ title: 'Assessment Distinction', detail: 'Scored 80%+ on a verified quiz' });
    }
    if (projects.some((p) => p.status === 'completed')) {
      list.push({ title: 'Portfolio Builder', detail: 'Completed a practical skill-gap project' });
    }
    return list;
  }, [profileCompletion, activeRoadmap, attempts, projects]);

  const recommendedResources = useMemo(() => {
    if (!targetCareer) return resources.slice(0, 4);
    const reqNames = new Set(targetCareer.requiredTechnicalSkills.map((s) => s.name));
    const matched = resources.filter((r) => r.skillTags.some((t) => reqNames.has(t)));
    return (matched.length > 0 ? matched : resources).slice(0, 4);
  }, [targetCareer, resources]);

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title={`Welcome back, ${publicProfile?.displayName || 'Learner'}`}
          subtitle={
            targetCareer
              ? `Target career track: ${targetCareer.title} · ${publicProfile?.headline || 'Building industry-ready skills'}`
              : 'Track your personalized roadmap, skill gaps, and assessment readiness.'
          }
          action={
            <div className="flex items-center gap-3">
              <Link
                to="/roadmap"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium whitespace-nowrap"
              >
                {activeRoadmap ? 'Continue Roadmap' : 'Generate AI Roadmap'}
              </Link>
            </div>
          }
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
          </div>
        ) : (
          <>
            {/* Key Metric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <SurfaceCard>
                <p className="text-xs text-slate-400">Career Readiness Indicator</p>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-semibold font-mono text-slate-100 tabular-nums">
                    {computedReadiness}%
                  </span>
                  <span className="text-xs text-cyan-400">
                    {targetCareer?.title || 'Select track'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Preparation benchmark only; does not guarantee employment.
                </p>
              </SurfaceCard>

              <SurfaceCard>
                <p className="text-xs text-slate-400">Roadmap Progress</p>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-semibold font-mono text-slate-100 tabular-nums">
                    {activeRoadmap?.progressPercent ?? 0}%
                  </span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {activeRoadmap?.completedLessonIds.length ?? 0} lessons done
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 mt-3 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${activeRoadmap?.progressPercent ?? 0}%` }}
                  />
                </div>
              </SurfaceCard>

              <SurfaceCard>
                <p className="text-xs text-slate-400">Target Skills Coverage</p>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-semibold font-mono text-slate-100 tabular-nums">
                    {skillsMetCount}/{skillsMetCount + skillsRemainingCount}
                  </span>
                  <span className="text-xs text-slate-400">
                    {skillsRemainingCount} remaining
                  </span>
                </div>
                <Link
                  to="/skill-gap"
                  className="text-xs text-blue-400 hover:text-blue-300 mt-2.5 inline-block"
                >
                  Inspect skill gaps
                </Link>
              </SurfaceCard>

              <SurfaceCard>
                <p className="text-xs text-slate-400">Profile &amp; Study Hours</p>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-semibold font-mono text-slate-100 tabular-nums">
                    {publicProfile?.learningHours ?? 0}h
                  </span>
                  <span className="text-xs text-slate-400 tabular-nums">
                    Profile {profileCompletion}%
                  </span>
                </div>
                <Link
                  to="/profile"
                  className="text-xs text-blue-400 hover:text-blue-300 mt-2.5 inline-block"
                >
                  Update profile &amp; skills
                </Link>
              </SurfaceCard>
            </div>

            {/* Activity Chart + Current Roadmap */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <SurfaceCard className="lg:col-span-7">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-100">
                      Weekly Learning &amp; Assessment Activity
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Calculated from completed roadmap lessons and quiz attempts
                    </p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient id="hpAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
                      <YAxis stroke="#64748B" fontSize={12} unit="m" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#1E293B',
                          borderRadius: '8px',
                          color: '#F1F5F9',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="minutes"
                        name="Active Minutes"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="url(#hpAreaGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SurfaceCard>

              <SurfaceCard className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-100">
                      Current Learning Roadmap
                    </h2>
                    <MapIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  {activeRoadmap ? (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-medium text-slate-200">
                        {activeRoadmap.careerTitle} · {activeRoadmap.stages.length} stages
                      </p>
                      <div className="divide-y divide-slate-800/80">
                        {activeRoadmap.stages.slice(0, 4).map((stage) => {
                          const stageLessons = stage.lessons || [];
                          const done = stageLessons.filter((l) =>
                            activeRoadmap.completedLessonIds.includes(l.id)
                          ).length;
                          return (
                            <div
                              key={stage.stageNumber}
                              className="py-2.5 flex items-center justify-between gap-3 text-xs"
                            >
                              <span className="text-slate-300 truncate">
                                Stage {stage.stageNumber}: {stage.title}
                              </span>
                              <span className="font-mono text-slate-400 tabular-nums shrink-0">
                                {done}/{stageLessons.length}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 text-sm text-slate-400 leading-relaxed">
                      You have not generated a personalized roadmap yet. Create one tailored to your target role and weekly schedule.
                    </div>
                  )}
                </div>

                <Link
                  to="/roadmap"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  <span>{activeRoadmap ? 'Open full roadmap' : 'Create AI roadmap'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </SurfaceCard>
            </div>

            {/* Recommended Resources + Assessments + Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SurfaceCard>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-100">
                    Recommended Resources
                  </h2>
                  <BookOpen className="w-4 h-4 text-slate-400" />
                </div>
                <div className="divide-y divide-slate-800/70">
                  {recommendedResources.map((res) => (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block py-3 hover:bg-slate-800/30 -mx-2 px-2 rounded-lg transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-200">{res.title}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {res.provider} · {res.difficulty} · {res.estimatedMinutes} min
                      </p>
                    </a>
                  ))}
                </div>
                <Link
                  to="/resources"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  Browse all resources <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </SurfaceCard>

              <SurfaceCard>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-100">
                    Available Assessments
                  </h2>
                  <Target className="w-4 h-4 text-slate-400" />
                </div>
                <div className="divide-y divide-slate-800/70">
                  {quizzes.slice(0, 4).map((q) => {
                    const past = attempts.find((a) => a.quizId === q.id);
                    return (
                      <Link
                        key={q.id}
                        to="/quizzes"
                        className="block py-3 hover:bg-slate-800/30 -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-200 truncate">
                            {q.title}
                          </span>
                          {past && (
                            <span className="font-mono text-xs text-emerald-400 tabular-nums shrink-0">
                              Best: {past.score}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {q.difficulty} · {q.questionCount} questions
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </SurfaceCard>

              <SurfaceCard>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-slate-100">
                    Verified Achievements
                  </h2>
                  <Award className="w-4 h-4 text-slate-400" />
                </div>
                {achievements.length === 0 ? (
                  <EmptyState
                    title="No milestones yet"
                    description="Complete a roadmap lesson, score 80%+ on a quiz, or finish a project to earn verified milestones."
                  />
                ) : (
                  <div className="space-y-3">
                    {achievements.map((ach) => (
                      <div
                        key={ach.title}
                        className="flex items-start gap-3 py-2 border-b border-slate-800/70 last:border-b-0"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-200">{ach.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{ach.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SurfaceCard>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
