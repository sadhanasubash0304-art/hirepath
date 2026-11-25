import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';

const IMPACT_IMG = '/src/assets/images/about_education_impact_1794757983484.jpg';

export function AboutPage() {
  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        <div className="space-y-4">
          <p className="text-xs font-medium text-cyan-400">
            About HirePath · UN Sustainable Development Goal 4
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight text-balance">
            Bridging Academic Education and Real-World Engineering Careers
          </h1>
          <p className="text-base text-slate-300 leading-relaxed max-w-3xl">
            Millions of university graduates complete theoretical coursework yet struggle to pass technical screenings because academic syllabi lag behind industry tooling, collaborative workflows, and system-level expectations.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 overflow-hidden aspect-[16/9]">
          <img
            src={IMPACT_IMG}
            alt="Students collaborating on real-world software systems"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-xl border border-slate-800 bg-[#0D1424] p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">The Problem Statement</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Students often bounce between unverified tutorials without knowing which skills actually matter for their target role, how their current proficiency measures up, or how to translate classroom projects into recruiter-ready evidence.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#0D1424] p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">The HirePath Solution</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              HirePath unifies career discovery, skill-gap quantification, Gemini-generated learning roadmaps, verified open resources, server-graded quizzes, ATS resume authoring, and direct recruiter skill matching in one workspace.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0D1424] p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-semibold text-slate-100">
            Alignment with UN SDG 4 &amp; SDG 8
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-blue-400">
                SDG 4 · Quality Education (Target 4.4)
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Substantially increase the number of youth and adults who have relevant technical and vocational skills for employment, decent jobs, and entrepreneurship through transparent, free-access roadmaps and verified documentation.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-cyan-400">
                SDG 8 · Decent Work &amp; Economic Growth (Target 8.6)
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Reduce youth transition friction into technical roles by connecting demonstrated skills and practical project portfolios directly with transparent hiring criteria.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <p className="text-sm text-slate-400">
            Ready to evaluate your career readiness across 12 engineering &amp; digital tracks?
          </p>
          <Link
            to="/auth"
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
          >
            Create Your Profile
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}
