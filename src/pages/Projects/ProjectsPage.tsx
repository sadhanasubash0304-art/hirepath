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
import { CheckCircle2, ExternalLink, Save } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  SkeletonBlock,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { apiFetch } from '../../lib/api';
import { ProjectBlueprint, ProjectProgressRecord } from '../../types/hirepath';

export function ProjectsPage() {
  const { user, publicProfile } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<ProjectBlueprint[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ProjectProgressRecord>>({});
  const [careerFilter, setCareerFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusInput, setStatusInput] = useState<'not_started' | 'in_progress' | 'completed'>('in_progress');
  const [githubInput, setGithubInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      apiFetch<{ projects: ProjectBlueprint[] }>('/api/v1/projects'),
      getDocs(query(collection(db, 'projectProgress'), where('uid', '==', user.uid))).catch((err) =>
        handleFirestoreError(err, OperationType.LIST, 'projectProgress')
      ),
    ])
      .then(([projRes, progSnap]) => {
        setProjects(projRes.projects);
        const map: Record<string, ProjectProgressRecord> = {};
        progSnap.docs.forEach((d) => {
          const data = d.data() as Omit<ProjectProgressRecord, 'id'>;
          map[data.projectId] = { id: d.id, ...data };
        });
        setProgressMap(map);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const userSkills = new Set(publicProfile?.skillNames || []);

  const filtered =
    careerFilter === 'all'
      ? projects
      : projects.filter((p) => p.careerId === careerFilter);

  const openEditor = (proj: ProjectBlueprint) => {
    const existing = progressMap[proj.id];
    setEditingId(proj.id);
    setStatusInput(existing?.status || 'in_progress');
    setGithubInput(existing?.githubUrl || '');
    setNotesInput(existing?.notes || '');
  };

  const saveProgress = async (proj: ProjectBlueprint) => {
    if (!user) return;
    const docId = `pp_${user.uid}_${proj.id}`;
    try {
      await setDoc(doc(db, 'projectProgress', docId), {
        uid: user.uid,
        projectId: proj.id,
        title: proj.title.slice(0, 160),
        careerId: proj.careerId,
        status: statusInput,
        githubUrl: githubInput.trim().slice(0, 300),
        notes: notesInput.trim().slice(0, 2000),
        updatedAt: serverTimestamp(),
      });
      setProgressMap((prev) => ({
        ...prev,
        [proj.id]: {
          id: docId,
          uid: user.uid,
          projectId: proj.id,
          title: proj.title,
          careerId: proj.careerId,
          status: statusInput,
          githubUrl: githubInput.trim(),
          notes: notesInput.trim(),
        },
      }));
      setEditingId(null);
      showToast('Project progress saved', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `projectProgress/${docId}`);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Practical Project Recommendations"
          subtitle="Bridge identified skill gaps by building production-style projects and tracking your GitHub deliverables."
          action={
            <select
              value={careerFilter}
              onChange={(e) => setCareerFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-800 bg-[#0D1424] text-sm text-slate-100"
            >
              <option value="all">All Career Tracks</option>
              <option value="fullstack-dev">Full-Stack</option>
              <option value="frontend-dev">Frontend</option>
              <option value="backend-dev">Backend</option>
              <option value="ai-engineering">AI Engineering</option>
              <option value="data-science">Data Science</option>
              <option value="cybersecurity">Cybersecurity</option>
            </select>
          }
        />

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonBlock className="h-60" />
            <SkeletonBlock className="h-60" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((proj) => {
              const prog = progressMap[proj.id];
              const missingSkills = proj.requiredSkills.filter((s) => !userSkills.has(s));
              const isEditing = editingId === proj.id;

              return (
                <SurfaceCard key={proj.id} className="flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs text-cyan-400 font-medium">
                        {proj.difficulty} · ~{proj.estimatedHours}h · {proj.techStack.join(' · ')}
                      </p>
                      <span
                        className={`text-xs font-medium shrink-0 ${
                          prog?.status === 'completed'
                            ? 'text-emerald-400'
                            : prog?.status === 'in_progress'
                            ? 'text-blue-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {prog?.status === 'completed'
                          ? 'Completed'
                          : prog?.status === 'in_progress'
                          ? 'In Progress'
                          : 'Not Started'}
                      </span>
                    </div>

                    <h2 className="text-lg font-semibold text-slate-100">{proj.title}</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">{proj.description}</p>

                    {missingSkills.length > 0 && (
                      <p className="text-xs text-amber-400">
                        Closes missing skills: {missingSkills.join(' · ')}
                      </p>
                    )}

                    <div className="pt-2 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-300">Implementation Steps</p>
                      <ul className="space-y-1 text-xs text-slate-400">
                        {proj.implementationSteps.map((st, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          value={statusInput}
                          onChange={(e) =>
                            setStatusInput(
                              e.target.value as 'not_started' | 'in_progress' | 'completed'
                            )
                          }
                          className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                        >
                          <option value="not_started">Not Started</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                        <input
                          type="url"
                          placeholder="GitHub Repository URL"
                          value={githubInput}
                          onChange={(e) => setGithubInput(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Implementation notes or deployed URL..."
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveProgress(proj)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Progress
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                      {prog?.githubUrl ? (
                        <a
                          href={prog.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 truncate"
                        >
                          View GitHub Submission <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">
                          Outcome: {proj.expectedOutcome}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditor(proj)}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0"
                      >
                        {prog ? 'Update Status' : 'Start Project'}
                      </button>
                    </div>
                  )}
                </SurfaceCard>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
