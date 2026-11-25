import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <svg
        width="26"
        height="26"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="28" height="28" rx="7" fill="url(#hp_logo_grad)" />
        <path
          d="M8.5 19.5V8.5M19.5 19.5V8.5M8.5 14H19.5M14 8.5L19.5 14L14 19.5"
          stroke="#FFFFFF"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="hp_logo_grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3B82F6" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-display text-lg font-bold tracking-tight text-slate-100">
        HirePath
      </span>
    </span>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
      isActive ? 'text-slate-100 underline underline-offset-8 decoration-blue-500' : 'text-slate-400 hover:text-slate-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[#070B14] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070B14]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <Link to="/" className="whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md">
            <BrandMark />
          </Link>

          <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
            <NavLink to="/features" className={navLinkClass}>
              Features
            </NavLink>
            <NavLink to="/careers" className={navLinkClass}>
              Careers
            </NavLink>
            <NavLink to="/resources" className={navLinkClass}>
              Resources
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
          </nav>

          <div className="hidden md:flex items-center shrink-0">
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {user ? 'Open Workspace' : 'Get Started'}
            </button>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-800 bg-[#0D1424] px-4 py-4 space-y-3">
            <Link to="/features" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-300">
              Features
            </Link>
            <Link to="/careers" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-300">
              Careers
            </Link>
            <Link to="/resources" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-300">
              Resources
            </Link>
            <Link to="/about" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-300">
              About
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                navigate(user ? '/dashboard' : '/auth');
              }}
              className="w-full py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white"
            >
              {user ? 'Open Workspace' : 'Get Started'}
            </button>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-800/80 bg-[#060911]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <BrandMark />
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Learn Smarter. Build Skills. Get Hired. Bridging academic curricula and industry capability standards in alignment with UN SDG 4.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/careers" className="hover:text-slate-200">Career Explorer</Link></li>
              <li><Link to="/resources" className="hover:text-slate-200">Resource Library</Link></li>
              <li><Link to="/features" className="hover:text-slate-200">AI Roadmaps &amp; Skill Gap</Link></li>
              <li><Link to="/auth" className="hover:text-slate-200">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-3">Mission</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/about" className="hover:text-slate-200">About HirePath</Link></li>
              <li><Link to="/about" className="hover:text-slate-200">UN SDG 4 Quality Education</Link></li>
              <li><Link to="/about" className="hover:text-slate-200">SDG 8 Decent Work</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-100 mb-3">Readiness Tools</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/resume" className="hover:text-slate-200">ATS Resume Builder</Link></li>
              <li><Link to="/interview" className="hover:text-slate-200">Interview Prep</Link></li>
              <li><Link to="/quizzes" className="hover:text-slate-200">Skill Assessments</Link></li>
              <li><Link to="/jobs" className="hover:text-slate-200">Jobs &amp; Hiring</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800/80 py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} HirePath. Quality Education &amp; Career Readiness Platform.</span>
          <span>Aligned with UN Sustainable Development Goal 4 &amp; Goal 8</span>
        </div>
      </footer>
    </div>
  );
}
