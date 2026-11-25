import React, { useEffect, useState } from 'react';
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
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  EmptyState,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import {
  UserPublicProfile,
  JobListing,
  LearningResource,
} from '../../types/hirepath';

interface ReportDoc {
  id: string;
  reporterUid: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
}

export function AdminPage() {
  const { user, publicProfile } = useAuth();
  const { showToast, confirmAction } = useToast();

  const [users, setUsers] = useState<UserPublicProfile[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [customResources, setCustomResources] = useState<LearningResource[]>([]);
  const [reports, setReports] = useState<ReportDoc[]>([]);

  // New resource form
  const [resTitle, setResTitle] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resCategory, setResCategory] = useState('Web Development');
  const [resDifficulty, setResDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [resUrl, setResUrl] = useState('');
  const [resMinutes, setResMinutes] = useState(60);

  const isAdmin = publicProfile?.role === 'admin';

  useEffect(() => {
    if (!user || !isAdmin) return;
    Promise.all([
      getDocs(
        query(collection(db, 'users_public'), where('role', 'in', ['student', 'recruiter', 'admin']))
      ).catch((err) => handleFirestoreError(err, OperationType.LIST, 'users_public')),
      getDocs(
        query(collection(db, 'jobs'), where('status', 'in', ['open', 'closed']))
      ).catch((err) => handleFirestoreError(err, OperationType.LIST, 'jobs')),
      getDocs(
        query(
          collection(db, 'resources'),
          where('difficulty', 'in', ['Beginner', 'Intermediate', 'Advanced'])
        )
      ).catch(() => null),
      getDocs(
        query(
          collection(db, 'reports'),
          where('status', 'in', ['open', 'resolved', 'dismissed'])
        )
      ).catch(() => null),
    ]).then(([uSnap, jSnap, rSnap, repSnap]) => {
      setUsers(uSnap.docs.map((d) => d.data() as UserPublicProfile));
      setJobs(jSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<JobListing, 'id'>) })));
      if (rSnap) {
        setCustomResources(
          rSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LearningResource, 'id'>) }))
        );
      }
      if (repSnap) {
        setReports(
          repSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReportDoc, 'id'>) }))
        );
      }
    });
  }, [user, isAdmin]);

  if (!isAdmin) {
    return (
      <AppShell>
        <EmptyState
          title="Administrator Access Required"
          description="This portal is restricted to verified HirePath platform administrators."
        />
      </AppShell>
    );
  }

  const studentCount = users.filter((u) => u.role === 'student').length;
  const recruiterCount = users.filter((u) => u.role === 'recruiter').length;
  const openReportsCount = reports.filter((r) => r.status === 'open').length;

  const analyticsData = [
    { metric: 'Students', count: studentCount },
    { metric: 'Recruiters', count: recruiterCount },
    { metric: 'Jobs', count: jobs.length },
    { metric: 'Custom Resources', count: customResources.length },
    { metric: 'Open Reports', count: openReportsCount },
  ];

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !resTitle.trim() || !resUrl.trim()) return;
    const resId = `cres_${Date.now()}`;
    try {
      await setDoc(doc(db, 'resources', resId), {
        title: resTitle.trim().slice(0, 160),
        description: resDesc.trim().slice(0, 1000) || 'Curated industry learning guide.',
        category: resCategory,
        skillTags: [resCategory],
        resourceType: 'Guide',
        difficulty: resDifficulty,
        url: resUrl.trim().slice(0, 500),
        estimatedMinutes: Math.max(5, Number(resMinutes) || 60),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setCustomResources((prev) => [
        {
          id: resId,
          title: resTitle.trim(),
          description: resDesc.trim(),
          category: resCategory,
          skillTags: [resCategory],
          resourceType: 'Guide',
          difficulty: resDifficulty,
          url: resUrl.trim(),
          estimatedMinutes: Number(resMinutes) || 60,
        },
        ...prev,
      ]);
      setResTitle('');
      setResDesc('');
      setResUrl('');
      showToast('Resource added to library', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `resources/${resId}`);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const ok = await confirmAction({
      title: 'Remove job listing?',
      message: 'This deletes the selected job listing from the platform.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      showToast('Job listing removed', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jobs/${jobId}`);
    }
  };

  const handleResolveReport = async (
    reportId: string,
    status: 'resolved' | 'dismissed'
  ) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status,
        updatedAt: serverTimestamp(),
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      showToast(`Report marked ${status}`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${reportId}`);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Admin Console"
          subtitle="Monitor platform activity, manage user roles, curate verified resources, moderate jobs, and resolve reports."
        />

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Users', value: users.length },
            { label: 'Active Learners', value: studentCount },
            { label: 'Recruiters', value: recruiterCount },
            { label: 'Job Listings', value: jobs.length },
            { label: 'Open Reports', value: openReportsCount },
          ].map((stat) => (
            <SurfaceCard key={stat.label}>
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className="text-2xl font-mono font-semibold text-slate-100 tabular-nums mt-1.5">
                {stat.value}
              </p>
            </SurfaceCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <SurfaceCard className="lg:col-span-7">
            <h2 className="text-base font-semibold text-slate-100 mb-4">
              Platform Resource &amp; Role Distribution
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData}>
                  <XAxis dataKey="metric" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-5 space-y-3">
            <h2 className="text-base font-semibold text-slate-100">
              Add Verified Learning Resource
            </h2>
            <form onSubmit={handleAddResource} className="space-y-2.5">
              <input
                type="text"
                required
                placeholder="Resource Title"
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
              />
              <input
                type="url"
                required
                placeholder="Official HTTPS URL"
                value={resUrl}
                onChange={(e) => setResUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={resCategory}
                  onChange={(e) => setResCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                />
                <select
                  value={resDifficulty}
                  onChange={(e) =>
                    setResDifficulty(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')
                  }
                  className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <input
                  type="number"
                  min={5}
                  value={resMinutes}
                  onChange={(e) => setResMinutes(Number(e.target.value))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs font-mono text-slate-100"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Short description..."
                value={resDesc}
                onChange={(e) => setResDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Resource
              </button>
            </form>
          </SurfaceCard>
        </div>

        {/* Users + Reports + Jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SurfaceCard className="space-y-3">
            <h2 className="text-base font-semibold text-slate-100">User Directory</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 px-3 font-medium">Role</th>
                    <th className="py-2 pl-3 font-medium text-right">Target Career</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {users.map((u) => (
                    <tr key={u.uid}>
                      <td className="py-2.5 pr-3 text-slate-100 font-medium">{u.displayName}</td>
                      <td className="py-2.5 px-3 capitalize text-cyan-400">{u.role}</td>
                      <td className="py-2.5 pl-3 text-right text-slate-400">
                        {u.targetCareerId || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>

          <SurfaceCard className="space-y-3">
            <h2 className="text-base font-semibold text-slate-100">
              Moderation Reports &amp; Job Management
            </h2>
            {reports.length === 0 && jobs.length === 0 ? (
              <p className="text-xs text-slate-400">No reports or active listings to moderate.</p>
            ) : (
              <div className="space-y-4">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3 rounded-lg border border-slate-800 bg-[#070B14] flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-100">
                        Report ({rep.targetType}) ·{' '}
                        <span className="capitalize text-amber-400">{rep.status}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{rep.reason}</p>
                    </div>
                    {rep.status === 'open' && (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleResolveReport(rep.id, 'resolved')}
                          className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-300 text-[11px] inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolveReport(rep.id, 'dismissed')}
                          className="px-2 py-1 rounded border border-slate-700 text-slate-300 text-[11px]"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-3 rounded-lg border border-slate-800 bg-[#070B14] flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-100">
                        {job.title} — {job.company}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Status: {job.status} · {job.requiredSkills.join(', ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                      aria-label="Delete job"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>
      </div>
    </AppShell>
  );
}
