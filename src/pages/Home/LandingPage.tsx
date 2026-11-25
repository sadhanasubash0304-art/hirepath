import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Compass,
  CheckCircle2,
  Bot,
  BarChart3,
  FileText,
  Briefcase,
} from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { useAuth } from '../../context/AuthContext';
import { CareerTrack } from '../../types/hirepath';
import { apiFetch } from '../../lib/api';

const HERO_IMG = '/src/assets/images/hero_career_workspace_1794757983096.jpg';
const ROADMAP_IMG = '/src/assets/images/feature_roadmap_visual_1794757983516.jpg';
const IMPACT_IMG = '/src/assets/images/about_education_impact_1794757983484.jpg';
const AVATAR_LEARNER = '/src/assets/images/avatar_learner_1_1794757984352.jpg';
const AVATAR_RECRUITER = '/src/assets/images/avatar_recruiter_1_1794757984568.jpg';

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [careers, setCareers] = useState<CareerTrack[]>([]);
  const [previewCareerId, setPreviewCareerId] = useState('fullstack-dev');

  useEffect(() => {
    apiFetch<{ careers: CareerTrack[] }>('/api/v1/careers')
      .then((res) => setCareers(res.careers))
      .catch(() => {});
  }, []);

  const previewCareer =
    careers.find((c) => c.id === previewCareerId) || careers[0];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-cyan-400 tracking-wide mb-4">
                UN SDG 4 Quality Education · Career Readiness Platform
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-50 leading-[1.1] text-balance">
                Learn Smarter. Build Skills. Get Hired.
              </h1>
              <p className="text-base sm:text-lg text-slate-300 mt-5 leading-relaxed max-w-xl">
                HirePath bridges what students learn in classrooms with what engineering and product teams expect on day one—combining skill-gap diagnostics, AI learning roadmaps, verified assessments, and direct recruiter connections.
              </p>

              <div className="flex flex-wrap items-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => navigate(user ? '/dashboard' : '/auth')}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{user ? 'Go to Dashboard' : 'Get Started Free'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  to="/careers"
                  className="px-6 py-3 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 hover:text-white text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <Compass className="w-4 h-4 text-slate-400" />
                  <span>Explore Careers</span>
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="lg:col-span-6 relative rounded-2xl border border-slate-800 bg-[#0D1424] overflow-hidden min-h-[300px] lg:min-h-[420px]"
            >
              <img
                src={HERO_IMG}
                alt="HirePath modern engineering learning workspace"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-[#070B14]/35 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-slate-700/70 bg-[#0A101E]/90 backdrop-blur-md p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Active Track Preview</p>
                    <p className="text-sm font-semibold text-slate-100 mt-0.5">
                      Full-Stack Engineering · 8 Stages · 12 Verified Milestones
                    </p>
                  </div>
                  <span className="font-mono text-xs text-cyan-400 tabular-nums shrink-0">
                    SDG 4 Aligned
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Career & Skill-Gap Preview */}
      <section className="border-b border-slate-800/80 bg-[#0A0F1C]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-100 tracking-tight text-balance">
                Interactive Career &amp; Skill Benchmark Preview
              </h2>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                Select a career track below to inspect real industry skill benchmarks, recommended stack, and entry readiness hours pulled directly from HirePath’s curriculum catalog.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 p-1 rounded-lg bg-[#0D1424] border border-slate-800">
              {['fullstack-dev', 'ai-engineering', 'data-science', 'cybersecurity'].map((cid) => {
                const c = careers.find((item) => item.id === cid);
                if (!c) return null;
                const active = previewCareer?.id === cid;
                return (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => setPreviewCareerId(cid)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {c.title}
                  </button>
                );
              })}
            </div>
          </div>

          {previewCareer && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 rounded-2xl border border-slate-800 bg-[#0D1424] p-6 sm:p-8">
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div>
                  <p className="text-xs text-cyan-400 font-medium">
                    {previewCareer.category} · ~{previewCareer.avgEntryReadinessHours} study hours
                  </p>
                  <h3 className="text-2xl font-semibold text-slate-100 mt-2">
                    {previewCareer.title}
                  </h3>
                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                    {previewCareer.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-400">
                    {previewCareer.interviewTopics.length} interview focus areas mapped
                  </span>
                  <Link
                    to={`/careers/${previewCareer.id}`}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    Inspect full track <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-3.5">
                <p className="text-xs font-medium text-slate-400">
                  Target Industry Proficiency Benchmarks
                </p>
                {previewCareer.requiredTechnicalSkills.slice(0, 6).map((skill) => (
                  <div key={skill.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">
                        {skill.name} <span className="text-slate-500">· {skill.priority}</span>
                      </span>
                      <span className="font-mono text-slate-300 tabular-nums">
                        {skill.targetLevel}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                        style={{ width: `${skill.targetLevel}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How HirePath Works - Editorial 01-04 */}
      <section className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-100 tracking-tight text-balance">
              How HirePath turns academic knowledge into industry readiness
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                num: '01.',
                title: 'Select Career & Audit Skills',
                body: 'Benchmark your existing coursework against 12 industry career tracks and active recruiter requirements.',
              },
              {
                num: '02.',
                title: 'Generate AI Roadmap',
                body: 'Receive an 8-stage personalized learning plan scaled to your weekly schedule and verified documentation.',
              },
              {
                num: '03.',
                title: 'Prove Mastery in Projects & Quizzes',
                body: 'Complete timed server-graded quizzes, build practical portfolio projects, and practice interviews with Gemini feedback.',
              },
              {
                num: '04.',
                title: 'Export Resume & Connect',
                body: 'Generate an ATS-ready PDF resume from your real accomplishments and apply directly to skill-matched jobs.',
              },
            ].map((step) => (
              <div key={step.num} className="border-t border-slate-800 pt-5 space-y-2.5">
                <span className="font-mono text-sm font-semibold text-blue-400 tabular-nums">
                  {step.num}
                </span>
                <h3 className="text-base font-semibold text-slate-100">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Asymmetric Bento Grid */}
      <section className="border-b border-slate-800/80 bg-[#0A0F1C]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#0D1424] overflow-hidden grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <Bot className="w-6 h-6 text-blue-400 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-100">
                    HirePath AI Mentor &amp; Personalized Roadmaps
                  </h3>
                  <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                    Multi-turn career guidance powered by Gemini with high-thinking reasoning mode—tailored to your live skill profile, saved roadmaps, and target job role.
                  </p>
                </div>
                <Link
                  to="/features"
                  className="mt-6 text-sm font-medium text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5"
                >
                  Explore AI capabilities <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="min-h-[220px]">
                <img
                  src={ROADMAP_IMG}
                  alt="Structured engineering skill progression layers"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-1 gap-6">
              <div className="rounded-2xl border border-slate-800 bg-[#0D1424] p-6 flex items-start gap-4">
                <BarChart3 className="w-5 h-5 text-cyan-400 shrink-0 mt-1" />
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Interactive Skill-Gap Diagnostics
                  </h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Visualize proficiency deltas across React, Node.js, SQL, Python, and Cloud against real job listings.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#0D1424] p-6 flex items-start gap-4">
                <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    ATS Resume Builder &amp; Interview Coach
                  </h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Live preview templates with instant PDF export and structured Gemini rubric feedback on technical and HR answers.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-[#0D1424] p-6 flex items-start gap-4">
                <Briefcase className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
                <div>
                  <h3 className="text-base font-semibold text-slate-100">
                    Transparent Recruiter Skill Matching
                  </h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Recruiters publish verified skill requirements and evaluate candidates transparently with real-time application updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDG 4 Impact & Attributable Testimonials */}
      <section className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 rounded-2xl border border-slate-800 overflow-hidden min-h-[280px]">
              <img
                src={IMPACT_IMG}
                alt="University computer science students collaborating on technical projects"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <div>
                <p className="text-xs font-medium text-cyan-400">
                  UN SDG 4 · Quality Education &amp; SDG 8 · Decent Work
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-slate-100 tracking-tight mt-2 text-balance">
                  Closing the college-to-career readiness gap with accessible guidance
                </h2>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  Every student deserves structured, industry-accurate mentorship regardless of university tier or network access. HirePath relies exclusively on verified open engineering documentation and transparent skill rubrics.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="rounded-xl border border-slate-800 bg-[#0D1424] p-4 flex items-start gap-4">
                  <img
                    src={AVATAR_LEARNER}
                    alt="Priya Nair"
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-lg object-cover shrink-0"
                  />
                  <div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      “Seeing PostgreSQL indexing and TypeScript error handling flagged as my exact missing skills turned scattered tutorials into a focused 6-week portfolio build.”
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Priya Nair · Final-Year B.E. CSE Student, Coimbatore
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-[#0D1424] p-4 flex items-start gap-4">
                  <img
                    src={AVATAR_RECRUITER}
                    alt="Daniel Tan"
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-lg object-cover shrink-0"
                  />
                  <div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      “Comparing applicant skill profiles directly against our required backend stack saved our engineering managers hours of initial screening.”
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Daniel Tan · Engineering Hiring Lead, CloudScale Labs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight text-balance">
            Ready to map your next engineering milestone?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Sign in with Google to generate your personalized AI roadmap, audit skill gaps, build an ATS resume, and connect with hiring teams.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{user ? 'Open My Workspace' : 'Start Learning Free'}</span>
            </button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
