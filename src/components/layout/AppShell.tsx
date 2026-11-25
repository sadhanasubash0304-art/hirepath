import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Map as MapIcon,
  BarChart3,
  BookOpen,
  Bot,
  FileText,
  Mic,
  CheckSquare,
  FolderGit2,
  Briefcase,
  Users,
  ShieldCheck,
  UserCircle,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BrandMark } from './PublicLayout';

interface NavGroup {
  label: string;
  items: Array<{
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: Array<'student' | 'recruiter' | 'admin'>;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Learning Core',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/careers', label: 'Career Explorer', icon: Compass },
      { to: '/roadmap', label: 'Learning Roadmap', icon: MapIcon },
      { to: '/skill-gap', label: 'Skill Gap Analysis', icon: BarChart3 },
      { to: '/resources', label: 'Resource Library', icon: BookOpen },
      { to: '/ai-assistant', label: 'HirePath AI', icon: Bot },
    ],
  },
  {
    label: 'Career Readiness',
    items: [
      { to: '/resume', label: 'Resume Builder', icon: FileText },
      { to: '/interview', label: 'Interview Prep', icon: Mic },
      { to: '/quizzes', label: 'Quizzes', icon: CheckSquare },
      { to: '/projects', label: 'Projects', icon: FolderGit2 },
    ],
  },
  {
    label: 'Network & Hiring',
    items: [
      { to: '/jobs', label: 'Jobs Board', icon: Briefcase },
      { to: '/community', label: 'Community', icon: Users },
      {
        to: '/recruiter',
        label: 'Recruiter Portal',
        icon: Building2,
        roles: ['recruiter', 'admin'],
      },
      {
        to: '/admin',
        label: 'Admin Console',
        icon: ShieldCheck,
        roles: ['admin'],
      },
      { to: '/profile', label: 'Profile & Skills', icon: UserCircle },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    publicProfile,
    notifications,
    unreadCount,
    markAllNotificationsRead,
    markNotificationRead,
    signOut,
  } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const userRole = publicProfile?.role || 'student';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    navigate(`/resources?q=${encodeURIComponent(q)}`);
    setSearchTerm('');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const renderNav = (onNavigate?: () => void) => (
    <div className="space-y-6 py-4 px-3">
      {NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter(
          (item) => !item.roles || item.roles.includes(userRole)
        );
        if (visibleItems.length === 0) return null;
        return (
          <div key={group.label}>
            <p className="px-3 text-xs font-medium text-slate-500 mb-2">
              {group.label}
            </p>
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#070B14] text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-slate-800/80 bg-[#0A0F1C] sticky top-0 h-screen">
        <div className="h-16 px-5 flex items-center border-b border-slate-800/80 shrink-0">
          <Link to="/dashboard">
            <BrandMark />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">{renderNav()}</div>

        <div className="p-4 border-t border-slate-800/80 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">
                {publicProfile?.displayName || 'Learner'}
              </p>
              <p className="text-xs text-slate-400 capitalize truncate">
                {userRole} account
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[82vw] bg-[#0A0F1C] border-r border-slate-800 flex flex-col h-full">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
              <BrandMark />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderNav(() => setSidebarOpen(false))}
            </div>
            <div className="p-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-[#070B14]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearch} className="hidden sm:flex items-center max-w-md w-full relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search resources, skills, or topics..."
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-800 bg-[#0D1424] text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </form>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative">
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative p-2 rounded-lg border border-slate-800 bg-[#0D1424] text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-[10px] font-mono font-semibold text-white flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            <Link
              to="/profile"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg border border-slate-800 bg-[#0D1424] hover:border-slate-700 transition-colors"
            >
              {publicProfile?.avatarUrl ? (
                <img
                  src={publicProfile.avatarUrl}
                  alt={publicProfile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-md object-cover"
                />
              ) : (
                <UserCircle className="w-5 h-5 text-slate-400" />
              )}
              <span className="hidden md:inline text-xs font-medium text-slate-200 max-w-[120px] truncate">
                {publicProfile?.displayName || 'Profile'}
              </span>
            </Link>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-xl border border-slate-800 bg-[#0D1424] shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsRead()}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/70">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet. Activity from quizzes, roadmaps, and job applications will appear here.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotifOpen(false);
                          if (n.link) navigate(n.link);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-800/40 transition-colors ${
                          n.read ? 'opacity-70' : 'bg-blue-950/15'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-100">{n.title}</span>
                          {!n.read && (
                            <span className="text-[11px] font-medium text-blue-400">New</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
