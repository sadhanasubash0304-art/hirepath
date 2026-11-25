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
import { jsPDF } from 'jspdf';
import { Download, Save, Sparkles, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import {
  PageHeader,
  SurfaceCard,
  FormattedProse,
} from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { apiFetch } from '../../lib/api';
import { ResumeDataShape, ResumeDocument } from '../../types/hirepath';

const EMPTY_RESUME: ResumeDataShape = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  links: '',
  summary: '',
  technicalSkills: [],
  softSkills: [],
  education: [{ school: '', degree: '', year: '', gpa: '' }],
  experiences: [],
  projects: [{ name: '', stack: '', description: '' }],
  certifications: [],
  achievements: [],
};

export function ResumePage() {
  const { user, publicProfile, privateProfile } = useAuth();
  const { showToast } = useToast();

  const [resumeId, setResumeId] = useState<string | null>(null);
  const [title, setTitle] = useState('Software Engineering Resume');
  const [template, setTemplate] = useState<'executive' | 'technical' | 'academic'>('technical');
  const [data, setData] = useState<ResumeDataShape>(EMPTY_RESUME);
  const [techSkillInput, setTechSkillInput] = useState('');
  const [softSkillInput, setSoftSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'resumes'), where('uid', '==', user.uid)))
      .then((snap) => {
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const existing = docSnap.data() as Omit<ResumeDocument, 'id'>;
          setResumeId(docSnap.id);
          setTitle(existing.title || 'My Resume');
          setTemplate(existing.template || 'technical');
          setData({ ...EMPTY_RESUME, ...existing.data });
          if (existing.aiSuggestions) setAiReview(existing.aiSuggestions);
        } else {
          setData((prev) => ({
            ...prev,
            fullName: publicProfile?.displayName || '',
            email: privateProfile?.email || user.email || '',
            phone: privateProfile?.phone || '',
            location: privateProfile?.location || '',
            technicalSkills: publicProfile?.skillNames || [],
          }));
        }
      })
      .catch((err) => handleFirestoreError(err, OperationType.LIST, 'resumes'));
  }, [user, publicProfile, privateProfile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const id = resumeId || `res_${user.uid}_primary`;
    try {
      await setDoc(doc(db, 'resumes', id), {
        uid: user.uid,
        title: title.trim() || 'My Resume',
        template,
        data,
        aiSuggestions: aiReview.slice(0, 6000),
        updatedAt: serverTimestamp(),
      });
      setResumeId(id);
      showToast('Resume saved to your profile', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `resumes/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAIAssist = async (action: 'summary' | 'review') => {
    setAiLoading(true);
    try {
      const res = await apiFetch<{ output: string }>('/api/v1/ai/resume-assist', {
        method: 'POST',
        body: JSON.stringify({
          action,
          resumeData: data,
          targetRole: publicProfile?.targetCareerId || 'Software Developer',
        }),
      });
      if (action === 'summary') {
        setData((prev) => ({ ...prev, summary: res.output.trim() }));
        showToast('Professional summary drafted from your real entries', 'success');
      } else {
        setAiReview(res.output);
        showToast('ATS review completed', 'success');
      }
    } catch (err: unknown) {
      showToast('AI assist failed', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportPdf = () => {
    const docPdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 44;
    let y = 50;
    const maxW = 595 - margin * 2;

    const addWrapped = (text: string, fontSize = 10, bold = false, gap = 14) => {
      if (!text.trim()) return;
      docPdf.setFont('helvetica', bold ? 'bold' : 'normal');
      docPdf.setFontSize(fontSize);
      const lines = docPdf.splitTextToSize(text, maxW) as string[];
      lines.forEach((line) => {
        if (y > 780) {
          docPdf.addPage();
          y = 50;
        }
        docPdf.text(line, margin, y);
        y += fontSize + 4;
      });
      y += gap - fontSize;
    };

    addWrapped(data.fullName || 'Candidate Name', 18, true, 18);
    addWrapped(
      [data.email, data.phone, data.location, data.links].filter(Boolean).join('  |  '),
      9.5,
      false,
      16
    );

    if (data.summary) {
      addWrapped('PROFESSIONAL SUMMARY', 11, true, 12);
      addWrapped(data.summary, 10, false, 16);
    }
    if (data.technicalSkills.length > 0 || data.softSkills.length > 0) {
      addWrapped('SKILLS', 11, true, 12);
      if (data.technicalSkills.length > 0) {
        addWrapped(`Technical: ${data.technicalSkills.join(', ')}`, 10, false, 12);
      }
      if (data.softSkills.length > 0) {
        addWrapped(`Soft Skills: ${data.softSkills.join(', ')}`, 10, false, 16);
      }
    }
    if (data.experiences.length > 0) {
      addWrapped('EXPERIENCE & INTERNSHIPS', 11, true, 12);
      data.experiences.forEach((exp) => {
        addWrapped(`${exp.role} — ${exp.company} (${exp.duration})`, 10.5, true, 11);
        addWrapped(exp.highlights, 9.5, false, 14);
      });
    }
    if (data.projects.some((p) => p.name)) {
      addWrapped('PROJECTS', 11, true, 12);
      data.projects
        .filter((p) => p.name)
        .forEach((proj) => {
          addWrapped(`${proj.name} | ${proj.stack}`, 10.5, true, 11);
          addWrapped(proj.description, 9.5, false, 14);
        });
    }
    if (data.education.some((ed) => ed.school)) {
      addWrapped('EDUCATION', 11, true, 12);
      data.education
        .filter((ed) => ed.school)
        .forEach((ed) => {
          addWrapped(
            `${ed.degree} — ${ed.school} (${ed.year})${ed.gpa ? ` · GPA: ${ed.gpa}` : ''}`,
            10,
            false,
            12
          );
        });
    }
    if (data.certifications.length > 0) {
      addWrapped('CERTIFICATIONS', 11, true, 12);
      addWrapped(data.certifications.join(' · '), 10, false, 14);
    }

    docPdf.save(`${(data.fullName || 'HirePath_Resume').replace(/\s+/g, '_')}.pdf`);
    showToast('ATS Resume PDF downloaded', 'success');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="ATS Resume Builder"
          subtitle="Build an ATS-friendly resume with live preview, honest Gemini improvement suggestions, and PDF export."
          action={
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-sm font-medium text-slate-100 inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Save className="w-4 h-4 text-blue-400" />
                <span>{saving ? 'Saving...' : 'Save Resume'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Form Editor */}
          <div className="xl:col-span-6 space-y-5">
            <SurfaceCard className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold text-slate-100">Template &amp; Identity</h2>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#070B14] border border-slate-800">
                  {(['technical', 'executive', 'academic'] as const).map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setTemplate(tpl)}
                      className={`px-2.5 py-1 rounded text-xs font-medium capitalize ${
                        template === tpl ? 'bg-blue-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={data.fullName}
                  onChange={(e) => setData({ ...data, fullName: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
                <input
                  type="text"
                  placeholder="City, Country"
                  value={data.location}
                  onChange={(e) => setData({ ...data, location: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
              </div>
              <input
                type="text"
                placeholder="GitHub / LinkedIn / Portfolio URLs"
                value={data.links}
                onChange={(e) => setData({ ...data, links: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
              />
            </SurfaceCard>

            <SurfaceCard className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-100">Professional Summary</h2>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleAIAssist('summary')}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiLoading ? 'Drafting...' : 'AI Draft Summary'}
                </button>
              </div>
              <textarea
                rows={3}
                value={data.summary}
                onChange={(e) => setData({ ...data, summary: e.target.value })}
                placeholder="Concise summary grounded in your verified projects and coursework..."
                className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
              />
            </SurfaceCard>

            {/* Skills */}
            <SurfaceCard className="space-y-4">
              <h2 className="text-base font-semibold text-slate-100">Skills &amp; Certifications</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={techSkillInput}
                  onChange={(e) => setTechSkillInput(e.target.value)}
                  placeholder="Add technical skill (e.g. TypeScript)"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!techSkillInput.trim()) return;
                    setData({
                      ...data,
                      technicalSkills: Array.from(
                        new Set([...data.technicalSkills, techSkillInput.trim()])
                      ),
                    });
                    setTechSkillInput('');
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Technical: {data.technicalSkills.join(' · ') || 'None added'}
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={softSkillInput}
                  onChange={(e) => setSoftSkillInput(e.target.value)}
                  placeholder="Add soft skill (e.g. Technical communication)"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!softSkillInput.trim()) return;
                    setData({
                      ...data,
                      softSkills: Array.from(
                        new Set([...data.softSkills, softSkillInput.trim()])
                      ),
                    });
                    setSoftSkillInput('');
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Soft Skills: {data.softSkills.join(' · ') || 'None added'}
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={certInput}
                  onChange={(e) => setCertInput(e.target.value)}
                  placeholder="Add certification or achievement"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!certInput.trim()) return;
                    setData({
                      ...data,
                      certifications: [...data.certifications, certInput.trim()],
                    });
                    setCertInput('');
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Certifications: {data.certifications.join(' · ') || 'None added'}
              </p>
            </SurfaceCard>

            {/* Education & Experience & Projects */}
            <SurfaceCard className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">Experience &amp; Internships</h2>
                <button
                  type="button"
                  onClick={() =>
                    setData({
                      ...data,
                      experiences: [
                        ...data.experiences,
                        { company: '', role: '', duration: '', highlights: '' },
                      ],
                    })
                  }
                  className="text-xs text-blue-400 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Role
                </button>
              </div>
              {data.experiences.map((exp, idx) => (
                <div key={idx} className="space-y-2 pb-3 border-b border-slate-800 last:border-b-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => {
                        const next = [...data.experiences];
                        next[idx].company = e.target.value;
                        setData({ ...data, experiences: next });
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                    />
                    <input
                      placeholder="Role Title"
                      value={exp.role}
                      onChange={(e) => {
                        const next = [...data.experiences];
                        next[idx].role = e.target.value;
                        setData({ ...data, experiences: next });
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                    />
                    <div className="flex gap-1">
                      <input
                        placeholder="Duration"
                        value={exp.duration}
                        onChange={(e) => {
                          const next = [...data.experiences];
                          next[idx].duration = e.target.value;
                          setData({ ...data, experiences: next });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setData({
                            ...data,
                            experiences: data.experiences.filter((_, i) => i !== idx),
                          })
                        }
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                        aria-label="Remove experience"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Quantifiable impact & technical contributions..."
                    value={exp.highlights}
                    onChange={(e) => {
                      const next = [...data.experiences];
                      next[idx].highlights = e.target.value;
                      setData({ ...data, experiences: next });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                  />
                </div>
              ))}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">Projects</h2>
                <button
                  type="button"
                  onClick={() =>
                    setData({
                      ...data,
                      projects: [...data.projects, { name: '', stack: '', description: '' }],
                    })
                  }
                  className="text-xs text-blue-400 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>
              {data.projects.map((proj, idx) => (
                <div key={idx} className="space-y-2 pb-3 border-b border-slate-800 last:border-b-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      placeholder="Project Name"
                      value={proj.name}
                      onChange={(e) => {
                        const next = [...data.projects];
                        next[idx].name = e.target.value;
                        setData({ ...data, projects: next });
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                    />
                    <input
                      placeholder="Tech Stack"
                      value={proj.stack}
                      onChange={(e) => {
                        const next = [...data.projects];
                        next[idx].stack = e.target.value;
                        setData({ ...data, projects: next });
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="What did you build and what problem did it solve?"
                    value={proj.description}
                    onChange={(e) => {
                      const next = [...data.projects];
                      next[idx].description = e.target.value;
                      setData({ ...data, projects: next });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                  />
                </div>
              ))}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">Education</h2>
                <button
                  type="button"
                  onClick={() =>
                    setData({
                      ...data,
                      education: [
                        ...data.education,
                        { school: '', degree: '', year: '', gpa: '' },
                      ],
                    })
                  }
                  className="text-xs text-blue-400 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Education
                </button>
              </div>
              {data.education.map((ed, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    placeholder="Institution"
                    value={ed.school}
                    onChange={(e) => {
                      const next = [...data.education];
                      next[idx].school = e.target.value;
                      setData({ ...data, education: next });
                    }}
                    className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                  />
                  <input
                    placeholder="Degree"
                    value={ed.degree}
                    onChange={(e) => {
                      const next = [...data.education];
                      next[idx].degree = e.target.value;
                      setData({ ...data, education: next });
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                  />
                  <input
                    placeholder="Year / GPA"
                    value={ed.year}
                    onChange={(e) => {
                      const next = [...data.education];
                      next[idx].year = e.target.value;
                      setData({ ...data, education: next });
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 bg-[#070B14] text-xs text-slate-100"
                  />
                </div>
              ))}
            </SurfaceCard>

            <SurfaceCard className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-100">
                  AI ATS Resume Critique
                </h2>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleAIAssist('review')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-xs font-medium text-blue-300 hover:bg-blue-600/30 inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiLoading ? 'Reviewing...' : 'Run ATS Review'}
                </button>
              </div>
              {aiReview ? (
                <FormattedProse text={aiReview} />
              ) : (
                <p className="text-xs text-slate-400">
                  Run an ATS review to receive honest structural and keyword suggestions based strictly on your entered details.
                </p>
              )}
            </SurfaceCard>
          </div>

          {/* Live ATS Paper Preview */}
          <div className="xl:col-span-6 sticky top-20">
            <div className="rounded-xl border border-slate-700 bg-white text-slate-900 p-8 shadow-2xl min-h-[760px]">
              <div
                className={`pb-4 border-b ${
                  template === 'executive'
                    ? 'border-slate-900'
                    : template === 'technical'
                    ? 'border-blue-700'
                    : 'border-slate-300 text-center'
                }`}
              >
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  {data.fullName || 'Your Name'}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  {[data.email, data.phone, data.location, data.links]
                    .filter(Boolean)
                    .join('  ·  ') || 'email@domain.com · City, Country · github.com/username'}
                </p>
              </div>

              {data.summary && (
                <div className="mt-5">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-slate-800 border-b border-slate-200 pb-1">
                    Summary
                  </h3>
                  <p className="text-xs text-slate-700 mt-2 leading-relaxed">{data.summary}</p>
                </div>
              )}

              {(data.technicalSkills.length > 0 || data.softSkills.length > 0) && (
                <div className="mt-5">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-slate-800 border-b border-slate-200 pb-1">
                    Skills
                  </h3>
                  {data.technicalSkills.length > 0 && (
                    <p className="text-xs text-slate-700 mt-2">
                      <strong>Technical:</strong> {data.technicalSkills.join(', ')}
                    </p>
                  )}
                  {data.softSkills.length > 0 && (
                    <p className="text-xs text-slate-700 mt-1">
                      <strong>Soft Skills:</strong> {data.softSkills.join(', ')}
                    </p>
                  )}
                </div>
              )}

              {data.experiences.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-slate-800 border-b border-slate-200 pb-1">
                    Experience
                  </h3>
                  <div className="space-y-3 mt-2">
                    {data.experiences.map((exp, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs font-semibold text-slate-900">
                          <span>
                            {exp.role || 'Role'} — {exp.company || 'Company'}
                          </span>
                          <span className="font-normal text-slate-600">{exp.duration}</span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                          {exp.highlights}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.projects.some((p) => p.name) && (
                <div className="mt-5">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-slate-800 border-b border-slate-200 pb-1">
                    Projects
                  </h3>
                  <div className="space-y-2.5 mt-2">
                    {data.projects
                      .filter((p) => p.name)
                      .map((proj, idx) => (
                        <div key={idx}>
                          <p className="text-xs font-semibold text-slate-900">
                            {proj.name}{' '}
                            {proj.stack && (
                              <span className="font-normal text-slate-600">· {proj.stack}</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                            {proj.description}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {data.education.some((e) => e.school) && (
                <div className="mt-5">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-slate-800 border-b border-slate-200 pb-1">
                    Education
                  </h3>
                  <div className="space-y-1.5 mt-2">
                    {data.education
                      .filter((e) => e.school)
                      .map((ed, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-800">
                          <span>
                            <strong>{ed.school}</strong> — {ed.degree}
                          </span>
                          <span className="text-slate-600">{ed.year}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {data.certifications.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-slate-800 border-b border-slate-200 pb-1">
                    Certifications &amp; Achievements
                  </h3>
                  <p className="text-xs text-slate-700 mt-2">
                    {data.certifications.join(' · ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
