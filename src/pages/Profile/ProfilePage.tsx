import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { PageHeader, SurfaceCard } from '../../components/common/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiFetch } from '../../lib/api';
import { CareerTrack } from '../../types/hirepath';

export function ProfilePage() {
  const { publicProfile, privateProfile, updateProfiles } = useAuth();
  const { showToast } = useToast();

  const [careers, setCareers] = useState<CareerTrack[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [company, setCompany] = useState('');
  const [targetCareerId, setTargetCareerId] = useState('fullstack-dev');
  const [role, setRole] = useState<'student' | 'recruiter' | 'admin'>('student');

  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [collegeOrOrg, setCollegeOrOrg] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [weeklyHours, setWeeklyHours] = useState(10);

  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ careers: CareerTrack[] }>('/api/v1/careers')
      .then((res) => setCareers(res.careers))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (publicProfile) {
      setDisplayName(publicProfile.displayName || '');
      setHeadline(publicProfile.headline || '');
      setBio(publicProfile.bio || '');
      setCompany(publicProfile.company || '');
      setTargetCareerId(publicProfile.targetCareerId || 'fullstack-dev');
      setRole(publicProfile.role || 'student');
      setSkillLevels(publicProfile.skillLevels || {});
    }
    if (privateProfile) {
      setPhone(privateProfile.phone || '');
      setLocation(privateProfile.location || '');
      setCollegeOrOrg(privateProfile.collegeOrOrg || '');
      setExperienceLevel(privateProfile.experienceLevel || 'beginner');
      setWeeklyHours(privateProfile.weeklyHoursAvailable || 10);
    }
  }, [publicProfile, privateProfile]);

  const handleAddSkill = () => {
    const clean = newSkill.trim();
    if (!clean) return;
    setSkillLevels((prev) => ({ ...prev, [clean]: prev[clean] ?? 50 }));
    setNewSkill('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skillNames = Object.keys(skillLevels).slice(0, 30);
      await updateProfiles(
        {
          displayName: displayName.trim() || 'Learner',
          headline: headline.trim(),
          bio: bio.trim(),
          company: company.trim(),
          targetCareerId,
          role: publicProfile?.role === 'admin' ? 'admin' : role,
          skillNames,
          skillLevels,
        },
        {
          phone: phone.trim(),
          location: location.trim(),
          collegeOrOrg: collegeOrOrg.trim(),
          experienceLevel,
          weeklyHoursAvailable: Number(weeklyHours) || 10,
        }
      );
      showToast('Profile and skill inventory updated', 'success');
    } catch (err: unknown) {
      showToast('Failed to update profile', 'error', err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <form onSubmit={handleSave} className="space-y-6">
        <PageHeader
          title="Profile & Skill Inventory"
          subtitle="Manage your public portfolio identity, isolated private contact details, workspace role, and self-assessed skills."
          action={
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <SurfaceCard className="lg:col-span-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">Public Workspace Identity</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Final-Year CS Student · Full-Stack & Cloud"
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Career</label>
                  <select
                    value={targetCareerId}
                    onChange={(e) => setTargetCareerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                  >
                    {careers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                {publicProfile?.role !== 'admin' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Account Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'student' | 'recruiter')}
                      className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                    >
                      <option value="student">Student / Learner</option>
                      <option value="recruiter">Recruiter</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Company (for Recruiters)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="lg:col-span-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-100">
              Private Details (Owner-Only)
            </h2>
            <p className="text-xs text-slate-400">
              Stored separately in protected private records; never visible to other learners or recruiters.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Verified Email</label>
                <input
                  type="email"
                  disabled
                  value={privateProfile?.email || ''}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14]/60 text-sm text-slate-400"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  University / College / Organization
                </label>
                <input
                  type="text"
                  value={collegeOrOrg}
                  onChange={(e) => setCollegeOrOrg(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) =>
                      setExperienceLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Weekly Study Hours</label>
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm font-mono text-slate-100"
                  />
                </div>
              </div>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Your Skill Inventory</h2>
              <p className="text-xs text-slate-400">
                Add skills and rate proficiency (0–100) to power AI roadmaps and job match scoring.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g. Docker)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-800 bg-[#070B14] text-sm text-slate-100"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-100 inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(skillLevels).map(([name, val]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-800 bg-[#070B14]"
              >
                <span className="text-sm font-medium text-slate-200 w-32 truncate">{name}</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={val}
                  onChange={(e) =>
                    setSkillLevels((prev) => ({ ...prev, [name]: Number(e.target.value) }))
                  }
                  className="flex-1 accent-blue-500"
                />
                <span className="font-mono text-xs text-slate-300 tabular-nums w-10 text-right">
                  {val}%
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSkillLevels((prev) => {
                      const next = { ...prev };
                      delete next[name];
                      return next;
                    })
                  }
                  className="text-slate-500 hover:text-rose-400 p-1"
                  aria-label={`Remove ${name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </form>
    </AppShell>
  );
}
