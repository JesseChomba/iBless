import React, { useState } from 'react';
import {
  Archive,
  Award,
  Bookmark,
  Download,
  Flame,
  Globe,
  HandHeart,
  Inbox,
  Send,
  Settings,
  Share2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlessingCardView } from '../components/BlessingCardView';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getCategoryMeta } from '../data/categories';
import { getDailyBlessingForDate } from '../data/dailyBlessings';
import {
  BLESSING_LEVELS,
  calculateGoodwillScore,
  getNextLevel,
} from '../data/gamification';
import {
  removeSavedBlessing,
  saveDailyBlessingToCollection,
} from '../services/blessingService';
import {
  downloadBlessingCardPng,
  shareViaNativeOrFallback,
} from '../utils/cardExporter';
import { formatBlessingDate } from '../utils/date';

const DAILY_PRINT_IMG = '/src/assets/images/daily_blessing_print_1794919824302.jpg';

export const DashboardPage: React.FC = () => {
  const {
    profile,
    receivedBlessings,
    savedBlessings,
    userAchievements,
    unreadNotificationCount,
  } = useAuth();
  const { pushToast } = useToast();

  const [imgFailed, setImgFailed] = useState(false);
  const [busySaveDaily, setBusySaveDaily] = useState(false);

  if (!profile) return null;

  const daily = getDailyBlessingForDate();
  const dailyCat = getCategoryMeta(daily.category);
  const savedDaily = savedBlessings.find((s) => s.blessingId === daily.id);

  const score = calculateGoodwillScore(
    profile.statistics,
    profile.streak,
    userAchievements.length
  );
  const currentLvl =
    BLESSING_LEVELS.find((l) => l.level === profile.currentLevel) ?? BLESSING_LEVELS[0];
  const nextLvl = getNextLevel(currentLvl.level);
  const progressPct = nextLvl
    ? Math.min(
        100,
        Math.max(
          4,
          Math.round(
            ((score - currentLvl.minScore) / (nextLvl.minScore - currentLvl.minScore)) *
              100
          )
        )
      )
    : 100;

  const recentIncoming = receivedBlessings.slice(0, 2);

  const handleSaveDaily = async () => {
    setBusySaveDaily(true);
    try {
      if (savedDaily) {
        await removeSavedBlessing(profile.uid, savedDaily.saveId);
        pushToast({ title: 'Removed from saved collection', tone: 'success' });
      } else {
        const res = await saveDailyBlessingToCollection(profile, daily);
        pushToast({ title: 'Daily blessing saved!', tone: 'success' });
        if (res.newlyUnlocked.length > 0) {
          pushToast({
            title: `Achievement unlocked: ${res.newlyUnlocked[0].name}`,
            tone: 'celebrate',
          });
        }
      }
    } catch (err) {
      pushToast({
        title: 'Could not save daily blessing',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    } finally {
      setBusySaveDaily(false);
    }
  };

  const handleDownloadDaily = async () => {
    try {
      await downloadBlessingCardPng(
        {
          message: daily.message,
          senderName: daily.note,
          recipientName: profile.displayName,
          category: daily.category,
          cardStyle: 'sunbeam',
          dateLabel: formatBlessingDate(new Date()),
        },
        `ibless-daily-${daily.id}.png`
      );
      pushToast({ title: 'Daily blessing PNG downloaded', tone: 'success' });
    } catch {
      pushToast({ title: 'Download failed', tone: 'error' });
    }
  };

  const handleShareDaily = async () => {
    const res = await shareViaNativeOrFallback({
      title: 'Today’s iBless Daily Blessing',
      text: `“${daily.message}” — ${daily.note} (via iBless)`,
    });
    if (res === 'copied') {
      pushToast({ title: 'Daily blessing copied for sharing', tone: 'success' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner + Quick Actions */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-stone-500 dark:text-stone-400">
            @{profile.username} · {currentLvl.badgeEmoji} {currentLvl.title}
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Good day, {profile.displayName}.
          </h2>
          {unreadNotificationCount > 0 && (
            <p className="mt-1 text-sm text-orange-700 dark:text-orange-400 font-medium">
              You have {unreadNotificationCount} unread notification
              {unreadNotificationCount === 1 ? '' : 's'} waiting upstairs.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/send"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            <span>Send a Blessing</span>
          </Link>
          <Link
            to="/requests"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <HandHeart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Request Blessing</span>
          </Link>
        </div>
      </section>

      {/* 4-column Statistics Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-5">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            Blessings Sent
          </p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums">
            {profile.statistics.sentCount}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-5">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            Blessings Received
          </p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums">
            {profile.statistics.receivedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-5">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            Current Streak
          </p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums flex items-center gap-2">
            <span>{profile.streak.current}d</span>
            <Flame className="w-5 h-5 text-orange-500" />
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 font-mono tabular-nums">
            Longest: {profile.streak.longest}d
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-5">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            Achievements
          </p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums">
            {userAchievements.length}
            <span className="text-base font-normal text-stone-400"> / 12</span>
          </p>
        </div>
      </section>

      {/* Daily Blessing + Level Progression Split */}
      <section className="grid lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-[#FFFBEB] dark:bg-[#1D1A14] p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="text-xs font-medium text-amber-800 dark:text-amber-300 flex flex-wrap items-center gap-2">
                <span>Daily Blessing</span>
                <span aria-hidden="true">·</span>
                <span>
                  {dailyCat.emoji} {dailyCat.name}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{formatBlessingDate(new Date())}</span>
              </div>
              {!imgFailed && (
                <img
                  src={DAILY_PRINT_IMG}
                  alt="Daily blessing sun print"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-14 h-11 rounded-lg object-cover border border-amber-200 dark:border-amber-800 shrink-0"
                />
              )}
            </div>

            <blockquote className="mt-4 font-display text-xl sm:text-2xl font-bold leading-snug text-stone-900 dark:text-amber-50">
              “{daily.message}”
            </blockquote>
            <p className="mt-2 text-xs text-stone-600 dark:text-amber-200/70">
              Issued by {daily.note}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-amber-200/80 dark:border-amber-900/50 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveDaily}
              disabled={busySaveDaily}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold border transition-colors min-h-[38px] ${
                savedDaily
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 border-amber-300 dark:border-amber-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              {savedDaily ? 'Saved' : 'Save Daily'}
            </button>
            <button
              type="button"
              onClick={handleDownloadDaily}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 min-h-[38px]"
            >
              <Download className="w-3.5 h-3.5" />
              Download PNG
            </button>
            <button
              type="button"
              onClick={handleShareDaily}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 min-h-[38px]"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>

        {/* Level Progress & Quick Explore */}
        <div className="lg:col-span-5 rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                Level {currentLvl.level} of 6
              </span>
              <Link
                to="/achievements"
                className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
              >
                View all ranks
              </Link>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-3xl">{currentLvl.badgeEmoji}</span>
              <div>
                <h3 className="font-display text-lg font-bold">{currentLvl.title}</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {currentLvl.description}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono tabular-nums text-stone-600 dark:text-stone-300">
                  Goodwill Score: {score}
                </span>
                {nextLvl ? (
                  <span className="font-mono tabular-nums text-stone-500 dark:text-stone-400">
                    Next: {nextLvl.minScore}
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold">Max Rank!</span>
                )}
              </div>
              <div className="h-2.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-600 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {nextLvl && (
                <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                  {nextLvl.minScore - score} points to{' '}
                  <strong className="text-stone-800 dark:text-stone-200">
                    {nextLvl.title}
                  </strong>
                  .
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
            <Link
              to="/feed"
              className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-zinc-800 px-3 py-2 text-xs font-medium hover:bg-stone-50 dark:hover:bg-zinc-800"
            >
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              Public Feed
            </Link>
            <Link
              to="/archive"
              className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-zinc-800 px-3 py-2 text-xs font-medium hover:bg-stone-50 dark:hover:bg-zinc-800"
            >
              <Archive className="w-3.5 h-3.5 text-emerald-600" />
              Archive
            </Link>
            <Link
              to="/achievements"
              className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-zinc-800 px-3 py-2 text-xs font-medium hover:bg-stone-50 dark:hover:bg-zinc-800"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" />
              Achievements
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-zinc-800 px-3 py-2 text-xs font-medium hover:bg-stone-50 dark:hover:bg-zinc-800"
            >
              <Settings className="w-3.5 h-3.5 text-stone-500" />
              Settings
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Incoming Blessings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">Recent Incoming Blessings</h3>
          <Link
            to="/inbox"
            className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
          >
            Open Inbox ({receivedBlessings.length})
          </Link>
        </div>

        {recentIncoming.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-8 text-center">
            <Inbox className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="mt-3 text-sm font-semibold text-stone-800 dark:text-stone-200">
              Your inbox is waiting for its first blessing.
            </p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Send one to a friend first, or post a friendly blessing request!
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                to="/send"
                className="rounded-xl bg-orange-600 text-white px-4 py-2 text-xs font-semibold hover:bg-orange-700"
              >
                Send First Blessing
              </Link>
              <Link
                to="/requests"
                className="rounded-xl border border-stone-200 dark:border-zinc-700 px-4 py-2 text-xs font-semibold"
              >
                Request One
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-5">
            {recentIncoming.map((b) => (
              <BlessingCardView key={b.blessingId} blessing={b} mode="inbox" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
