import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ExternalLink, Search, Target } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  SkeletonBlock,
  ErrorBanner,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../lib/api';
import {
  CareerTrack,
  ProjectBlueprint,
  LearningResource,
  InterviewQuestion,
} from '../../types/hirepath';

export function CareersPage() {
  const { id } = useParams<{ id?: string }>();
  const { user, publicProfile, updateProfiles } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [careers, setCareers] = useState<CareerTrack[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<{
    career: CareerTrack;
    projects: ProjectBlueprint[];
    resources: LearningResource[];
    interviewQuestions: InterviewQuestion[];
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (id) {
          const res = await apiFetch<{
            career: CareerTrack;
            projects: ProjectBlueprint[];
            resources: LearningResource[];
            interviewQuestions: InterviewQuestion[];
          }>(`/api/v1/careers/${encodeURIComponent(id)}`);
          if (active) setDetail(res);
        } else {
          setDetail(null);
          const params = new URLSearchParams();
          if (selectedCategory !== 'all') params.set('category', selectedCategory);
          if (search.trim()) params.set('search', search.trim());
          const res = await apiFetch<{ careers: CareerTrack[]; categories: string[] }>(
            `/api/v1/careers?${params.toString()}`
          );
          if (active) {
            setCareers(res.careers);
            setCategories(res.categories);
          }
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load careers.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id, selectedCategory, search]);

  const handleSetTargetCareer = async (career: CareerTrack) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      await updateProfiles({ targetCareerId: career.id });
      showToast(`Target career set to ${career.title}`, 'success');
    } catch (err: unknown) {
      showToast('Failed to update career goal', 'error', err instanceof Error ? err.message : undefined);
    }
  };

  const Wrapper = user ? AppShell : PublicLayout;

  if (id) {
    return (
      <Wrapper>
        <div className={user ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6'}>
          <Link
            to="/careers"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100"
          >
            <ArrowLeft className="w-4 h-4" /> All Career Tracks
          </Link>

          {loading ? (
            <SkeletonBlock className="h-64" />
          ) : error || !detail ? (
            <ErrorBanner message={error || 'Career track not found.'} />
          ) : (
            <div className="space-y-6">
              <PageHeader
                title={detail.career.title}
                subtitle={`${detail.career.category} · ${detail.career.shortTagline} · ~${detail.career.avgEntryReadinessHours} study hours`}
                action={
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSetTargetCareer(detail.career)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap ${
                        publicProfile?.targetCareerId === detail.career.id
                          ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-300'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      <Target className="w-4 h-4" />
                      {publicProfile?.targetCareerId === detail.career.id
                        ? 'Active Target Career'
                        : 'Set as Target Career'}
                    </button>
                  </div>
                }
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <SurfaceCard className="lg:col-span-7 space-y-5">
                  <div>
                    <h2 className="text-base font-semibold text-slate-100">Role Overview</h2>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      {detail.career.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Market Outlook: {detail.career.demandOutlook}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-100">
                      Required Technical Skill Benchmarks
                    </h3>
                    {detail.career.requiredTechnicalSkills.map((sk) => (
                      <div key={sk.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-200">
                            {sk.name} · <span className="text-slate-500">{sk.priority}</span>
                          </span>
                          <span className="font-mono text-slate-300 tabular-nums">
                            {sk.targetLevel}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${sk.targetLevel}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>

                <SurfaceCard className="lg:col-span-5 space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">Soft Skills</h3>
                    <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                      {detail.career.requiredSoftSkills.join(' · ')}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-100">Prerequisites</h3>
                    <ul className="mt-2 space-y-1.5 text-sm text-slate-400">
                      {detail.career.prerequisites.map((p) => (
                        <li key={p} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-100">
                      Recommended Stack
                    </h3>
                    <p className="text-sm text-slate-300 mt-1.5">
                      {detail.career.recommendedTechnologies.join(' · ')}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-100">
                      Key Interview Topics
                    </h3>
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                      {detail.career.interviewTopics.join(' · ')}
                    </p>
                  </div>
                </SurfaceCard>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SurfaceCard>
                  <h3 className="text-base font-semibold text-slate-100 mb-3">
                    Suggested Portfolio Projects
                  </h3>
                  <div className="divide-y divide-slate-800/80">
                    {detail.projects.map((p) => (
                      <div key={p.id} className="py-3">
                        <p className="text-sm font-medium text-slate-100">{p.title}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {p.difficulty} · ~{p.estimatedHours}h · {p.techStack.join(', ')}
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>

                <SurfaceCard>
                  <h3 className="text-base font-semibold text-slate-100 mb-3">
                    Verified Learning Resources
                  </h3>
                  <div className="divide-y divide-slate-800/80">
                    {detail.resources.slice(0, 5).map((r) => (
                      <a
                        key={r.id}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block py-3 hover:bg-slate-800/30 -mx-2 px-2 rounded-lg"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-200">{r.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {r.provider} · {r.difficulty} · {r.estimatedMinutes} min
                        </p>
                      </a>
                    ))}
                  </div>
                </SurfaceCard>
              </div>
            </div>
          )}
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className={user ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6'}>
        <PageHeader
          title="Career Explorer"
          subtitle="Compare 12 industry career tracks, required technical skills, prerequisites, and recommended technologies."
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search careers or skills (e.g. React, Python, SQL)..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-800 bg-[#0D1424] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-[#0D1424] border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              All Tracks
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-48" />
            <SkeletonBlock className="h-48" />
          </div>
        ) : error ? (
          <ErrorBanner message={error} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {careers.map((career) => {
              const isTarget = publicProfile?.targetCareerId === career.id;
              return (
                <SurfaceCard key={career.id} className="flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-cyan-400 font-medium">
                      {career.category} · ~{career.avgEntryReadinessHours}h
                    </p>
                    <h2 className="text-lg font-semibold text-slate-100 mt-1.5">
                      {career.title}
                    </h2>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                      {career.shortTagline}
                    </p>
                    <p className="text-xs text-slate-500 mt-3">
                      Core: {career.requiredTechnicalSkills.slice(0, 4).map((s) => s.name).join(' · ')}
                    </p>
                  </div>

                  <div className="pt-4 mt-5 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <Link
                      to={`/careers/${career.id}`}
                      className="text-sm font-medium text-blue-400 hover:text-blue-300"
                    >
                      Inspect Details
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleSetTargetCareer(career)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                        isTarget
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {isTarget ? 'Active Goal' : 'Select Goal'}
                    </button>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        )}
      </div>
    </Wrapper>
  );
}
