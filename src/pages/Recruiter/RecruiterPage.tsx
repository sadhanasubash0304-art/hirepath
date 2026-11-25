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
import { Plus, Trash2 } from 'lucide-react';
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
  JobListing,
  JobApplicationRecord,
  UserPublicProfile,
} from '../../types/hirepath';

export function RecruiterPage() {
  const { user, publicProfile, pushNotification, socket } = useAuth();
  const { showToast, confirmAction } = useToast();

  const [myJobs, setMyJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [candidates, setCandidates] = useState<UserPublicProfile[]>([]);
  const [selectedJobForCompare, setSelectedJobForCompare] = useState<string>('');

  // Create job form
  const [company, setCompany] = useState(publicProfile?.company || '');
  const [title, setTitle] = useState('');
  const [careerId, setCareerId] = useState('fullstack-dev');
  const [location, setLocation] = useState('Remote / Hybrid');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [experienceLevel, setExperienceLevel] = useState('Entry-level (0–2 yrs)');
  const [salaryRange, setSalaryRange] = useState('');
  const [skillsText, setSkillsText] = useState('TypeScript, React, Node.js, PostgreSQL');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const isAuthorized =
    publicProfile?.role === 'recruiter' || publicProfile?.role === 'admin';

  useEffect(() => {
    if (!user || !isAuthorized) return;
    Promise.all([
      getDocs(query(collection(db, 'jobs'), where('recruiterUid', '==', user.uid))).catch(
        (err) => handleFirestoreError(err, OperationType.LIST, 'jobs')
      ),
      getDocs(
        query(collection(db, 'applications'), where('recruiterUid', '==', user.uid))
      ).catch((err) => handleFirestoreError(err, OperationType.LIST, 'applications')),
      getDocs(query(collection(db, 'users_public'), where('role', '==', 'student'))).catch(
        (err) => handleFirestoreError(err, OperationType.LIST, 'users_public')
      ),
    ]).then(([jobsSnap, appsSnap, candSnap]) => {
      const jobsList = jobsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<JobListing, 'id'>),
      }));
      setMyJobs(jobsList);
      if (jobsList.length > 0) setSelectedJobForCompare(jobsList[0].id);

      setApplications(
        appsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<JobApplicationRecord, 'id'>),
        }))
      );
      setCandidates(candSnap.docs.map((d) => d.data() as UserPublicProfile));
    });
  }, [user, isAuthorized]);

  if (!isAuthorized) {
    return (
      <AppShell>
        <EmptyState
          title="Recruiter Portal Restricted"
          description="Switch your account role to Recruiter in Profile & Skills to publish job listings and review candidate skill matches."
        />
      </AppShell>
    );
  }

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!company.trim() || !title.trim() || !description.trim()) {
      showToast('Company, job title, and description are required', 'error');
      return;
    }

    setCreating(true);
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const requiredSkills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20);

    try {
      await setDoc(doc(db, 'jobs', jobId), {
        recruiterUid: user.uid,
        company: company.trim().slice(0, 120),
        title: title.trim().slice(0, 140),
        careerId,
        location: location.trim().slice(0, 120),
        employmentType,
        experienceLevel,
        salaryRange: salaryRange.trim().slice(0, 80),
        description: description.trim().slice(0, 4000),
        requiredSkills,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const created: JobListing = {
        id: jobId,
        recruiterUid: user.uid,
        company: company.trim(),
        title: title.trim(),
        careerId,
        location: location.trim(),
        employmentType,
        experienceLevel,
        salaryRange: salaryRange.trim(),
        description: description.trim(),
        requiredSkills,
        status: 'open',
      };
      setMyJobs((prev) => [created, ...prev]);
      setSelectedJobForCompare(jobId);
      setTitle('');
      setDescription('');
      showToast('Job listing published', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `jobs/${jobId}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const ok = await confirmAction({
      title: 'Delete job listing?',
      message: 'This permanently removes the job posting from the Jobs Board.',
      confirmLabel: 'Delete Job',
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setMyJobs((prev) => prev.filter((j) => j.id !== jobId));
      showToast('Job listing deleted', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jobs/${jobId}`);
    }
  };

  const handleUpdateApplicationStatus = async (
    app: JobApplicationRecord,
    newStatus: 'shortlisted' | 'interview' | 'rejected' | 'accepted'
  ) => {
    try {
      await updateDoc(doc(db, 'applications', app.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: newStatus } : a))
      );

      await pushNotification(app.applicantUid, {
        type: 'application',
        title: `Application Update: ${app.jobTitle}`,
        message: `${app.company} moved your application status to "${newStatus}".`,
        link: '/jobs',
      });
      socket?.emit('application:status_changed', {
        applicantUid: app.applicantUid,
        jobTitle: app.jobTitle,
        status: newStatus,
      });

      showToast(`Candidate marked as ${newStatus}`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${app.id}`);
    }
  };

  const activeJob = myJobs.find((j) => j.id === selectedJobForCompare);

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Recruiter Portal"
          subtitle="Publish job openings, compare candidate skill coverage against role requirements, and manage applications."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Publish Job Form */}
          <SurfaceCard className="lg:col-span-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">
              Publish New Job Opportunity
            </h2>
            <form onSubmit={handleCreateJob} className="space-y-3">
              <input
                type="text"
                placeholder="Company Name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                required
              />
              <input
                type="text"
                placeholder="Role Title (e.g. Junior Full-Stack Engineer)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={careerId}
                  onChange={(e) => setCareerId(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                >
                  <option value="fullstack-dev">Full-Stack</option>
                  <option value="frontend-dev">Frontend</option>
                  <option value="backend-dev">Backend</option>
                  <option value="ai-engineering">AI Engineering</option>
                  <option value="data-science">Data Science</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="cloud-computing">Cloud &amp; DevOps</option>
                </select>
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Experience Level"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Compensation Range (optional)"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Required Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                />
              </div>
              <textarea
                rows={4}
                placeholder="Role responsibilities and engineering expectations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                required
              />
              <button
                type="submit"
                disabled={creating}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {creating ? 'Publishing...' : 'Publish Job Listing'}
              </button>
            </form>
          </SurfaceCard>

          {/* Published Jobs & Applications */}
          <div className="lg:col-span-7 space-y-6">
            <SurfaceCard className="space-y-4">
              <h2 className="text-base font-semibold text-slate-100">
                Your Published Listings ({myJobs.length})
              </h2>
              {myJobs.length === 0 ? (
                <p className="text-xs text-slate-400">No job postings published yet.</p>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {myJobs.map((job) => (
                    <div key={job.id} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{job.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {job.company} · {job.requiredSkills.join(' · ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                        aria-label="Delete job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>

            <SurfaceCard className="space-y-4">
              <h2 className="text-base font-semibold text-slate-100">
                Incoming Candidate Applications ({applications.length})
              </h2>
              {applications.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Applications from learners will appear here with skill match calculations.
                </p>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-lg border border-slate-800 bg-[#070B14] p-4 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">
                            {app.applicantName} ·{' '}
                            <span className="text-blue-400 font-mono">{app.matchScore}% match</span>
                          </p>
                          <p className="text-xs text-slate-400">
                            Applied to {app.jobTitle} · Status:{' '}
                            <span className="capitalize text-cyan-400">{app.status}</span>
                          </p>
                        </div>
                        {app.status !== 'accepted' && app.status !== 'rejected' && (
                          <div className="flex flex-wrap gap-1.5">
                            {(['shortlisted', 'interview', 'accepted', 'rejected'] as const).map(
                              (st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleUpdateApplicationStatus(app, st)}
                                  className="px-2.5 py-1 rounded border border-slate-700 hover:border-blue-500 text-xs text-slate-300 capitalize"
                                >
                                  {st}
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                      {app.applicantSkills && app.applicantSkills.length > 0 && (
                        <p className="text-xs text-slate-400">
                          Candidate Skills: {app.applicantSkills.join(' · ')}
                        </p>
                      )}
                      {app.coverNote && (
                        <p className="text-xs text-slate-300 leading-relaxed">{app.coverNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SurfaceCard>
          </div>
        </div>

        {/* Candidate Skill Discovery */}
        <SurfaceCard className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Candidate Skill Comparison
              </h2>
              <p className="text-xs text-slate-400">
                Compare public learner skill profiles against your selected job opening (private PII remains protected).
              </p>
            </div>
            {myJobs.length > 0 && (
              <select
                value={selectedJobForCompare}
                onChange={(e) => setSelectedJobForCompare(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
              >
                {myJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    Compare vs: {j.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {candidates.length === 0 ? (
            <p className="text-xs text-slate-400">No learner profiles available yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="py-2 pr-4 font-medium">Candidate</th>
                    <th className="py-2 px-4 font-medium">Headline</th>
                    <th className="py-2 px-4 font-medium">Public Skills</th>
                    <th className="py-2 pl-4 font-medium text-right">Role Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {candidates.map((cand) => {
                    const reqs = activeJob?.requiredSkills || [];
                    const candSet = new Set(
                      (cand.skillNames || []).map((s) => s.toLowerCase())
                    );
                    const matchPct =
                      reqs.length > 0
                        ? Math.round(
                            (reqs.filter((r) => candSet.has(r.toLowerCase())).length /
                              reqs.length) *
                              100
                          )
                        : cand.readinessScore || 0;
                    return (
                      <tr key={cand.uid}>
                        <td className="py-3 pr-4 font-medium text-slate-100">
                          {cand.displayName}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400">
                          {cand.headline || 'Learner'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300">
                          {(cand.skillNames || []).slice(0, 6).join(' · ') || 'None listed'}
                        </td>
                        <td className="py-3 pl-4 text-right font-mono text-xs text-cyan-400 tabular-nums">
                          {matchPct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
