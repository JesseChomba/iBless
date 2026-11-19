import React from 'react';
import {
  Archive,
  Award,
  Globe,
  HandHeart,
  Home,
  Inbox,
  LogOut,
  Moon,
  Send,
  Settings,
  Sun,
  User,
  Users,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BLESSING_LEVELS } from '../data/gamification';
import { updateUserPreferences } from '../services/userService';
import { Avatar } from '../components/Avatar';
import { BrandMark } from '../components/BrandMark';
import { NotificationCenter } from '../components/NotificationCenter';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { PWAInstallButton } from '../components/PWAInstallButton';

const DESKTOP_PRIMARY_NAV = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/send', label: 'Send Blessing', icon: Send },
  { to: '/requests', label: 'Requests', icon: HandHeart },
  { to: '/feed', label: 'Public Feed', icon: Globe },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/archive', label: 'Archive', icon: Archive },
  { to: '/achievements', label: 'Achievements', icon: Award },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const MOBILE_TABS = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/send', label: 'Send', icon: Send },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/profile', label: 'Profile', icon: User },
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/send': 'Send a Blessing',
  '/inbox': 'Blessing Inbox',
  '/friends': 'Friends & Discovery',
  '/feed': 'Public Blessing Feed',
  '/requests': 'Blessing Requests',
  '/archive': 'Blessing Archive',
  '/achievements': 'Levels & Achievements',
  '/profile': 'Your Profile',
  '/settings': 'Settings',
};

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, receivedBlessings, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const unreadInboxCount = receivedBlessings.filter(
    (b) => b.status === 'dispatched' || b.status === 'delivered'
  ).length;

  const currentLevelDef =
    BLESSING_LEVELS.find((l) => l.level === (profile?.currentLevel || 1)) ??
    BLESSING_LEVELS[0];

  const pageTitle =
    PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/u/') ? 'Member Profile' : 'iBless');

  const handleToggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    if (profile) {
      await updateUserPreferences(profile.uid, { preferences: { theme: next } });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#111318] text-stone-900 dark:text-stone-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 border-r border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] z-30">
        <div className="px-6 py-5 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between">
          <NavLink to="/dashboard" className="focus:outline-none">
            <BrandMark />
          </NavLink>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Primary">
          {DESKTOP_PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100/70 dark:hover:bg-zinc-800/70 hover:text-stone-900 dark:hover:text-stone-100'
                  }`
                }
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.to === '/inbox' && unreadInboxCount > 0 && (
                  <span className="font-mono text-xs tabular-nums text-orange-600 dark:text-orange-400 font-semibold">
                    {unreadInboxCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-100 dark:border-zinc-800 space-y-3">
          <PWAInstallButton />

          {profile && (
            <div className="flex items-center gap-3 px-2 py-1.5">
              <Avatar src={profile.photoURL} name={profile.displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate text-stone-900 dark:text-stone-100">
                  {profile.displayName}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                  {currentLevelDef.badgeEmoji} {currentLevelDef.title}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Bar (Desktop & Compact Mobile) */}
        <header className="sticky top-0 z-20 h-14 md:h-16 bg-[#FAF9F6]/90 dark:bg-[#111318]/90 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800 px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="md:hidden">
              <NavLink to="/dashboard">
                <BrandMark size="sm" />
              </NavLink>
            </div>
            <h1 className="hidden md:block text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <NotificationCenter />

            <NavLink
              to="/send"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Blessing</span>
            </NavLink>
          </div>
        </header>

        {/* Page Main */}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-12 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Navigation (5 tabs, compact <= 60px) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-15 bg-white/95 dark:bg-[#161920]/95 backdrop-blur-md border-t border-stone-200 dark:border-zinc-800 grid grid-cols-5 items-center"
      >
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center min-h-[48px] text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-orange-600 dark:text-orange-400 font-semibold'
                    : 'text-stone-500 dark:text-stone-400'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="mt-0.5">{tab.label}</span>
              {tab.to === '/inbox' && unreadInboxCount > 0 && (
                <span className="absolute top-1.5 right-1/4 min-w-[16px] h-4 px-1 rounded-full bg-orange-600 text-white text-[9px] font-mono flex items-center justify-center tabular-nums">
                  {unreadInboxCount > 9 ? '9+' : unreadInboxCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <OfflineIndicator />
    </div>
  );
};
