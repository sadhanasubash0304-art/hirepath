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
import { Briefcase, CheckCircle2, Search, Send } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  EmptyState,
  SkeletonBlock,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { JobListing, JobApplicationRecord } from '../../types/hirepath';

export function JobsPage() {
  const { user, publicProfile, pushNotification } = useAuth();
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [applyingJob, setApplyingJob] = useState<JobListing | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getDocs(query(collection(db, 'jobs'), where('status', '==', 'open'))).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'jobs')
      ),
      getDocs(
        query(collection(db, 'applications'), where('applicantUid', '==', user.uid))
      ).catch((err) => handleFirestoreError(err, OperationType.LIST, 'applications')),
    ])
      .then(([jobsSnap, appsSnap]) => {
        setJobs(
          jobsSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<JobListing, 'id'>),
          }))
        );
        setApplications(
          appsSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<JobApplicationRecord, 'id'>),
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [user]);

  const computeMatch = (requiredSkills: string[]) => {
    if (!requiredSkills || requiredSkills.length === 0) return 100;
    const mySkills = new Set(
      (publicProfile?.skillNames || []).map((s) => s.toLowerCase())
    );
    const matched = requiredSkills.filter((r) => mySkills.has(r.toLowerCase())).length;
    return Math.round((matched / requiredSkills.length) * 100);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !applyingJob || !publicProfile) return;
    setSubmitting(true);

    const appId = `app_${applyingJob.id}_${user.uid}`;
    const matchScore = computeMatch(applyingJob.requiredSkills);

    try {
      await setDoc(doc(db, 'applications', appId), {
        jobId: applyingJob.id,
        jobTitle: applyingJob.title,
        company: applyingJob.company,
        recruiterUid: applyingJob.recruiterUid,
        applicantUid: user.uid,
        applicantName: publicProfile.displayName,
        applicantHeadline: publicProfile.headline || '',
        applicantSkills: (publicProfile.skillNames || []).slice(0, 30),
        matchScore,
        coverNote: coverNote.trim().slice(0, 2000),
        status: 'submitted',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setApplications((prev) => [
        {
          id: appId,
          jobId: applyingJob.id,
          jobTitle: applyingJob.title,
          company: applyingJob.company,
          recruiterUid: applyingJob.recruiterUid,
          applicantUid: user.uid,
          applicantName: publicProfile.displayName,
          matchScore,
          coverNote: coverNote.trim(),
          status: 'submitted',
        },
        ...prev,
      ]);

      await pushNotification(applyingJob.recruiterUid, {
        type: 'application',
        title: `New Application: ${applyingJob.title}`,
        message: `${publicProfile.displayName} applied (${matchScore}% skill match).`,
        link: '/recruiter',
      });

      setApplyingJob(null);
      setCoverNote('');
      showToast('Application submitted successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `applications/${appId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="space-y-8">
        <PageHeader
          title="Jobs & Opportunities"
          subtitle="Explore verified recruiter openings, inspect your transparent skill-match percentage, and track live application statuses."
        />

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by role, company, or skill..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-800 bg-[#0D1424] text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            {loading ? (
              <SkeletonBlock className="h-48" />
            ) : filteredJobs.length === 0 ? (
              <EmptyState
                title="No open job listings found"
                description="Recruiters publish new opportunities in the Recruiter Portal. Check back soon or switch to a Recruiter profile to post roles."
              />
            ) : (
              filteredJobs.map((job) => {
                const match = computeMatch(job.requiredSkills);
                const existingApp = applications.find((a) => a.jobId === job.id);

                return (
                  <SurfaceCard key={job.id} className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-cyan-400 font-medium">
                          {job.company} · {job.location || 'Remote'} ·{' '}
                          {job.employmentType || 'Full-time'}
                        </p>
                        <h2 className="text-lg font-semibold text-slate-100 mt-1">
                          {job.title}
                        </h2>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-base font-semibold text-blue-400 tabular-nums">
                          {match}% match
                        </span>
                        <p className="text-[11px] text-slate-500">Skill overlap</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">{job.description}</p>
                    <p className="text-xs text-slate-400">
                      Required Skills: {job.requiredSkills.join(' · ')}
                      {job.salaryRange ? ` · ${job.salaryRange}` : ''}
                    </p>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Level: {job.experienceLevel || 'Entry / Junior'}
                      </span>
                      {existingApp ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 capitalize">
                          <CheckCircle2 className="w-4 h-4" />
                          Status: {existingApp.status}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setApplyingJob(job)}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  </SurfaceCard>
                );
              })
            )}
          </div>

          <SurfaceCard className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">Your Applications</h2>
              <Briefcase className="w-4 h-4 text-slate-400" />
            </div>
            {applications.length === 0 ? (
              <p className="text-xs text-slate-400 leading-relaxed">
                You have not applied to any positions yet. Select a listing on the left to submit your skill profile.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {applications.map((app) => (
                  <div key={app.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {app.jobTitle}
                      </p>
                      <span className="text-xs font-medium text-cyan-400 capitalize shrink-0">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {app.company} · <span className="font-mono">{app.matchScore}%</span> match
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>
        </div>

        {/* Application Modal */}
        {applyingJob && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-[#0D1424] p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-100">
                Apply to {applyingJob.title}
              </h3>
              <p className="text-xs text-slate-400">
                {applyingJob.company} · Your public skill profile and headline will be shared with the hiring recruiter.
              </p>
              <form onSubmit={handleApply} className="space-y-4">
                <textarea
                  rows={4}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Write a concise note highlighting relevant projects or skills..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyingJob(null)}
                    className="px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
