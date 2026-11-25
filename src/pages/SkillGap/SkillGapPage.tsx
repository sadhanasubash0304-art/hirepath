import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Sparkles, Save } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  FormattedProse,
  ErrorBanner,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../lib/firebase';
import { apiFetch } from '../../lib/api';
import { CareerTrack, JobListing } from '../../types/hirepath';

export function SkillGapPage() {
  const { publicProfile, updateProfiles } = useAuth();
  const { showToast } = useToast();

  const [careers, setCareers] = useState<CareerTrack[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [compareMode, setCompareMode] = useState<'career' | 'job'>('career');
  const [selectedCareerId, setSelectedCareerId] = useState(
    publicProfile?.targetCareerId || 'fullstack-dev'
  );
  const [selectedJobId, setSelectedJobId] = useState('');

  const [localSkills, setLocalSkills] = useState<Record<string, number>>(
    publicProfile?.skillLevels || {}
  );
  const [savingSkills, setSavingSkills] = useState(false);

  const [aiPlan, setAiPlan] = useState('');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (publicProfile?.skillLevels) {
      setLocalSkills(publicProfile.skillLevels);
    }
    if (publicProfile?.targetCareerId) {
      setSelectedCareerId(publicProfile.targetCareerId);
    }
  }, [publicProfile]);

  useEffect(() => {
    apiFetch<{ careers: CareerTrack[] }>('/api/v1/careers')
      .then((res) => setCareers(res.careers))
      .catch(() => {});

    getDocs(query(collection(db, 'jobs'), where('status', '==', 'open')))
      .then((snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<JobListing, 'id'>),
        }));
        setJobs(list);
        if (list.length > 0) setSelectedJobId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const selectedCareer =
    careers.find((c) => c.id === selectedCareerId) || careers[0];
  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  const targetComparison = useMemo(() => {
    if (compareMode === 'job' && selectedJob) {
      return {
        targetName: `${selectedJob.title} at ${selectedJob.company}`,
        requirements: selectedJob.requiredSkills.map((name) => ({
          name,
          targetLevel: 75,
          priority: 'Core' as const,
        })),
      };
    }
    if (selectedCareer) {
      return {
        targetName: selectedCareer.title,
        requirements: selectedCareer.requiredTechnicalSkills,
      };
    }
    return { targetName: 'Career Track', requirements: [] };
  }, [compareMode, selectedCareer, selectedJob]);

  const chartData = useMemo(() => {
    return targetComparison.requirements.map((req) => {
      const current = localSkills[req.name] || 0;
      const gap = Math.max(0, req.targetLevel - current);
      const status =
        current === 0
          ? 'Missing'
          : current < 45
          ? 'Beginner'
          : current < req.targetLevel * 0.85
          ? 'Intermediate'
          : 'Ready';
      return {
        skill: req.name,
        current,
        target: req.targetLevel,
        gap,
        priority: req.priority,
        status,
      };
    });
  }, [targetComparison, localSkills]);

  const handleSaveSkills = async () => {
    setSavingSkills(true);
    try {
      const skillNames = Object.keys(localSkills)
        .filter((k) => localSkills[k] > 0)
        .slice(0, 30);
      await updateProfiles({
        skillLevels: localSkills,
        skillNames,
      });
      showToast('Skill proficiency profile saved', 'success');
    } catch (err: unknown) {
      showToast(
        'Failed to save skills',
        'error',
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setSavingSkills(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    setError(null);
    try {
      const res = await apiFetch<{ plan: string }>('/api/v1/ai/skill-gap', {
        method: 'POST',
        body: JSON.stringify({
          targetName: targetComparison.targetName,
          userSkills: localSkills,
          requiredSkills: targetComparison.requirements,
        }),
      });
      setAiPlan(res.plan);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to generate improvement plan.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Skill Gap Analysis"
          subtitle="Compare your current skill proficiency against industry career benchmarks or active job requirements."
          action={
            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={generatingPlan || chartData.length === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {generatingPlan ? 'Analyzing with Gemini...' : 'Generate AI Improvement Plan'}
              </span>
            </button>
          }
        />

        {error && <ErrorBanner message={error} />}

        {/* Benchmark Selector */}
        <SurfaceCard className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#070B14] border border-slate-800 w-fit">
            <button
              type="button"
              onClick={() => setCompareMode('career')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                compareMode === 'career'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Compare vs Career Track
            </button>
            <button
              type="button"
              onClick={() => setCompareMode('job')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                compareMode === 'job'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Compare vs Job Listing
            </button>
          </div>

          <div className="flex-1 max-w-md">
            {compareMode === 'career' ? (
              <select
                value={selectedCareerId}
                onChange={(e) => setSelectedCareerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
              >
                {careers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            ) : jobs.length > 0 ? (
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.company}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-400">
                No recruiter jobs published yet. Switch to Career Track or visit the Jobs Board.
              </p>
            )}
          </div>
        </SurfaceCard>

        {/* Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SurfaceCard>
            <h2 className="text-base font-semibold text-slate-100 mb-4">
              Proficiency Radar ({targetComparison.targetName})
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={chartData}>
                  <PolarGrid stroke="#1E293B" />
                  <PolarAngleAxis dataKey="skill" stroke="#94A3B8" fontSize={11} />
                  <Radar
                    name="Your Level"
                    dataKey="current"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.35}
                  />
                  <Radar
                    name="Target"
                    dataKey="target"
                    stroke="#06B6D4"
                    fill="#06B6D4"
                    fillOpacity={0.12}
                  />
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <h2 className="text-base font-semibold text-slate-100 mb-4">
              Skill Gap Delta Breakdown
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#64748B" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="skill"
                    stroke="#94A3B8"
                    fontSize={11}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="current" name="Current" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="gap" name="Gap to Target" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SurfaceCard>
        </div>

        {/* Interactive Skill Calibration Table */}
        <SurfaceCard>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Calibrate Your Current Skill Proficiency
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust sliders to match your real hands-on confidence, then save to update readiness &amp; job match scores.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveSkills}
              disabled={savingSkills}
              className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-medium text-slate-100 inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Save className="w-4 h-4 text-blue-400" />
              <span>{savingSkills ? 'Saving...' : 'Save Skill Levels'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400">
                  <th className="py-2.5 pr-4 font-medium">Skill</th>
                  <th className="py-2.5 px-4 font-medium">Priority</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium w-56">Your Rating</th>
                  <th className="py-2.5 pl-4 font-medium text-right">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {chartData.map((row) => (
                  <tr key={row.skill} className="hover:bg-slate-800/20">
                    <td className="py-3 pr-4 font-medium text-slate-100">{row.skill}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">{row.priority}</td>
                    <td className="py-3 px-4 text-xs">
                      <span
                        className={
                          row.status === 'Ready'
                            ? 'text-emerald-400'
                            : row.status === 'Intermediate'
                            ? 'text-blue-400'
                            : row.status === 'Beginner'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={row.current}
                          onChange={(e) =>
                            setLocalSkills((prev) => ({
                              ...prev,
                              [row.skill]: Number(e.target.value),
                            }))
                          }
                          className="w-full accent-blue-500"
                        />
                        <span className="font-mono text-xs text-slate-200 tabular-nums w-9 text-right">
                          {row.current}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 pl-4 font-mono text-xs text-slate-400 tabular-nums text-right">
                      {row.target}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Note: Skill assessments guide study priorities and do not guarantee employment.</span>
            <Link to="/projects" className="text-blue-400 hover:text-blue-300">
              Find Projects to Close Gaps
            </Link>
          </div>
        </SurfaceCard>

        {aiPlan && (
          <SurfaceCard>
            <h2 className="text-base font-semibold text-slate-100 mb-3">
              Personalized Improvement Plan (HirePath AI)
            </h2>
            <FormattedProse text={aiPlan} />
          </SurfaceCard>
        )}
      </div>
    </AppShell>
  );
}
