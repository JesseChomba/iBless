import React, { useState } from 'react';
import { ArrowRight, Check, Globe, Lock, Moon, Send, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlessingPreviewCard } from '../components/BlessingCardView';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { CARD_STYLES } from '../data/cardStyles';
import { getDailyBlessingForDate } from '../data/dailyBlessings';
import { BLESSING_LEVELS } from '../data/gamification';
import type { CardStyleId } from '../types/ibless';

const SAMPLE_HERO_IMG = '/src/assets/images/hero_blessing_cards_1794919824147.jpg';
const DAILY_PRINT_IMG = '/src/assets/images/daily_blessing_print_1794919824302.jpg';

export const LandingPage: React.FC = () => {
  const { authUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sampleStyle, setSampleStyle] = useState<CardStyleId>('sunbeam');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [dailyImgFailed, setDailyImgFailed] = useState(false);

  const todayBlessing = getDailyBlessingForDate();

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#111318] text-stone-900 dark:text-stone-100">
      {/* Strict 3-zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#FAF9F6]/90 dark:bg-[#111318]/90 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <Link to="/" className="whitespace-nowrap shrink-0">
            <BrandMark />
          </Link>

          <nav
            aria-label="Landing navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-stone-300"
          >
            <a
              href="#how-it-works"
              className="hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              How it works
            </a>
            <a
              href="#daily-dispatch"
              className="hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Daily Blessing
            </a>
            <a
              href="#ranks"
              className="hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Goodwill Ranks
            </a>
            <Link
              to={authUser ? '/dashboard' : '/login'}
              className="hover:text-stone-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {authUser ? 'Dashboard' : 'Log in'}
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={authUser ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <span>{authUser ? 'Open App' : 'Start Blessing'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Split */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-16 lg:pt-16 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-mono uppercase tracking-wider text-orange-700 dark:text-orange-400 font-semibold">
              Spread blessings · Share smiles
            </p>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-900 dark:text-stone-50 text-balance leading-[1.08]">
              Digital blessings, delivered like surprisingly organised post.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl">
              Inspired by warm family traditions from every corner of the world, iBless lets you send personalised blessing cards, request encouragement before big days, and earn mildly absurd titles along the way.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to={authUser ? '/send' : '/register'}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-6 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>{authUser ? 'Send a Blessing' : 'Create Free Account'}</span>
              </Link>
              <Link
                to={authUser ? '/dashboard' : '/login'}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 text-stone-800 dark:text-stone-100 px-6 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <span>{authUser ? 'Go to Dashboard' : 'Sign In'}</span>
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle color theme"
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-zinc-800"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-200 dark:border-zinc-800 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-500 dark:text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Private by default
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Universal & inclusive
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                No ads, no fees, no leaderboards
              </span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] rounded-3xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-stone-100 dark:bg-zinc-900">
              {!heroImgFailed ? (
                <img
                  src={SAMPLE_HERO_IMG}
                  alt="Handmade colorful stationery blessing cards, wax seals, and fountain pen on a bright desk"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-10 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-zinc-900 dark:to-zinc-800">
                  <BlessingPreviewCard
                    message="You have been blessed. Your day just got an unscheduled upgrade."
                    senderName="Grandma Elena"
                    senderUsername="elena"
                    recipientName="You"
                    category="happiness"
                    cardStyle="sunbeam"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sample Card Showcase */}
      <section
        id="how-it-works"
        className="border-t border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] py-16 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <BlessingPreviewCard
              message="Congratulations on tomorrow’s presentation! May your slides behave, your Wi-Fi remain heroic, and your coffee stay warm."
              senderName="Uncle Marcus"
              senderUsername="uncle_marcus"
              recipientName="Maya"
              category="success"
              cardStyle={sampleStyle}
              dateLabel="Nov 17, 2026"
            />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-stone-500 dark:text-stone-400 mr-2">
                Preview card style:
              </span>
              {CARD_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSampleStyle(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    sampleStyle === st.id
                      ? 'border-orange-600 bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200'
                      : 'border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  {st.name}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 space-y-8">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-balance">
                Wholesome goodwill, treated with bureaucratic precision.
              </h2>
              <p className="mt-3 text-stone-600 dark:text-stone-300 leading-relaxed">
                Whether you come from a tradition of big family blessings or just enjoy hyping up your friends before a job interview, iBless gives good intentions a proper home.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  01. Send personalised or templated cards
                </h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Pick from 12 universal categories—or write completely from scratch in your own cultural voice—and download any card as a crisp PNG.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  02. Request backup when life gets big
                </h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Have an exam, flight, or tough Monday coming up? Send a private request to a friend or post to the public community feed.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  03. Private by default, joyful everywhere
                </h3>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  Every blessing stays private between sender and recipient unless you explicitly choose to share it publicly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Blessing Showcase */}
      <section id="daily-dispatch" className="py-16 lg:py-24 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-10 items-center rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 sm:p-10">
          <div className="lg:col-span-5">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-stone-200 dark:border-zinc-800 bg-amber-50 dark:bg-zinc-900">
              {!dailyImgFailed ? (
                <img
                  src={DAILY_PRINT_IMG}
                  alt="Risograph sunbeam botanical illustration for the daily blessing"
                  referrerPolicy="no-referrer"
                  onError={() => setDailyImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  ☀️
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <p className="text-xs font-mono uppercase tracking-wider text-orange-600 dark:text-orange-400 font-semibold">
              Today’s Daily Blessing · {todayBlessing.note}
            </p>
            <blockquote className="mt-3 font-display text-2xl sm:text-3xl font-bold leading-snug text-stone-900 dark:text-stone-100">
              “{todayBlessing.message}”
            </blockquote>
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
              A fresh, locally curated blessing rotates every day—no AI hype required. Sign in to save favourites and share them with friends.
            </p>
            <div className="mt-6">
              <Link
                to={authUser ? '/dashboard' : '/register'}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <span>{authUser ? 'Open Today’s Dashboard' : 'Join & Save Daily Blessings'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Humorous Goodwill Ranks */}
      <section
        id="ranks"
        className="border-t border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] py-16 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-balance">
              Climb the ladder of benevolent absurdity.
            </h2>
            <p className="mt-3 text-stone-600 dark:text-stone-300">
              No leaderboards, no pay-to-win, no pressure—just affectionate promotions as you send blessings, keep streaks, and unlock achievements.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BLESSING_LEVELS.map((lvl) => (
              <div
                key={lvl.level}
                className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-[#FAF9F6] dark:bg-[#111318] p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{lvl.badgeEmoji}</span>
                  <span className="font-mono text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                    Level {lvl.level}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                  {lvl.title}
                </h3>
                <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                  {lvl.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-stone-200 dark:border-zinc-800 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-3">
            <BrandMark size="sm" />
            <span>· Spread blessings. Share smiles.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-stone-900 dark:hover:text-stone-100">
              Log in
            </Link>
            <Link to="/register" className="hover:text-stone-900 dark:hover:text-stone-100">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
