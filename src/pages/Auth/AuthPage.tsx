import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, ShieldCheck } from 'lucide-react';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function AuthPage() {
  const { user, authReady, signInWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'student' | 'recruiter'>('student');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authReady && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [authReady, user, navigate]);

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle(selectedRole);
      showToast('Signed in to HirePath', 'success');
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to complete sign-in. Please try again.';
      showToast('Authentication failed', 'error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-slate-800 bg-[#0D1424] p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-100">
              Sign in to HirePath
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
              Choose your primary workspace role and authenticate securely with Google. You can update your profile and career preferences anytime.
            </p>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-medium text-slate-300 block">
              Select Workspace Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  selectedRole === 'student'
                    ? 'border-blue-500 bg-blue-600/15'
                    : 'border-slate-800 bg-[#0A0F1C] hover:border-slate-700'
                }`}
              >
                <GraduationCap className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-sm font-semibold text-slate-100">Student / Learner</p>
                <p className="text-xs text-slate-400 mt-1">
                  Roadmaps, skill-gap diagnostics, quizzes, AI mentor &amp; resume builder.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('recruiter')}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  selectedRole === 'recruiter'
                    ? 'border-blue-500 bg-blue-600/15'
                    : 'border-slate-800 bg-[#0A0F1C] hover:border-slate-700'
                }`}
              >
                <Building2 className="w-5 h-5 text-cyan-400 mb-2" />
                <p className="text-sm font-semibold text-slate-100">Recruiter</p>
                <p className="text-xs text-slate-400 mt-1">
                  Publish job roles, compare candidate skills &amp; manage applications.
                </p>
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            <span>{submitting ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          <div className="pt-4 border-t border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Protected by Firebase Authentication &amp; role-verified Firestore security rules. Administrator access is automatically provisioned for verified platform administrators.
            </span>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
