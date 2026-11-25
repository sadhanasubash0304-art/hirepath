import React from 'react';
import { Link } from 'react-router-dom';
import {
  Map as MapIcon,
  BarChart3,
  Bot,
  FileText,
  Mic,
  Briefcase,
  CheckSquare,
  FolderGit2,
} from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';

const FEATURES = [
  {
    icon: MapIcon,
    title: 'AI Personalized Learning Roadmaps',
    description:
      'Generate 8-stage curricula tailored to your target role, weekly study hours, and current skill baseline—with lesson completion tracking saved to the database.',
  },
  {
    icon: BarChart3,
    title: 'Interactive Skill-Gap Analysis',
    description:
      'Compare your current proficiency levels against industry role benchmarks or specific recruiter job postings using radar and bar diagnostics.',
  },
  {
    icon: Bot,
    title: 'HirePath AI Career Assistant',
    description:
      'Multi-turn technical mentor powered by Gemini with high-thinking reasoning mode for complex architecture questions, study plans, and career guidance.',
  },
  {
    icon: FileText,
    title: 'ATS Resume Builder & PDF Export',
    description:
      'Author structured resumes across three clean ATS-friendly templates with AI critique and instant client-side PDF download.',
  },
  {
    icon: Mic,
    title: 'Timed Interview Preparation',
    description:
      'Practice Technical, HR, and Role-Specific questions under timed conditions and receive calibrated rubric scores and sample answers.',
  },
  {
    icon: CheckSquare,
    title: 'Server-Verified Quizzes & Assessments',
    description:
      'Test real engineering fundamentals with server-side answer verification, detailed explanations, and automatic skill proficiency updates.',
  },
  {
    icon: FolderGit2,
    title: 'Skill-Gap Project Recommendations',
    description:
      'Bridge missing skills with step-by-step project blueprints, track build progress, and attach GitHub repository links.',
  },
  {
    icon: Briefcase,
    title: 'Recruiter Portal & Live Notifications',
    description:
      'Recruiters publish roles with explicit skill tags, compare candidate match percentages, and send real-time application status updates.',
  },
];

export function FeaturesPage() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-medium text-cyan-400">Platform Capabilities</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight text-balance">
            Every tool required to move from student coursework to job readiness
          </h1>
          <p className="text-base text-slate-400 leading-relaxed">
            Built with real persistence, server-verified assessments, and transparent AI reasoning—no static placeholders or mock metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="rounded-xl border border-slate-800 bg-[#0D1424] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-100">{feat.title}</h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0D1424] p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Start building your personalized career roadmap
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Sign in as a Student / Learner or Recruiter in seconds.
            </p>
          </div>
          <Link
            to="/auth"
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold whitespace-nowrap shrink-0"
          >
            Get Started
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
