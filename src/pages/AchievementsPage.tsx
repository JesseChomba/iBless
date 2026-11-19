import React from 'react';
import { Award, CheckCircle2, Flame, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  ACHIEVEMENTS,
  BLESSING_LEVELS,
  calculateGoodwillScore,
  getNextLevel,
} from '../data/gamification';
import { formatBlessingDate } from '../utils/date';

export const AchievementsPage: React.FC = () => {
  const { profile, userAchievements } = useAuth();
  if (!profile) return null;

  const unlockedMap = new Map(userAchievements.map((a) => [a.achievementId, a]));
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

  return (
    <div className="space-y-8">
      {/* Personal Statistics Summary */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Sent', value: profile.statistics.sentCount },
          { label: 'Received', value: profile.statistics.receivedCount },
          { label: 'Acknowledged', value: profile.statistics.acknowledgedCount },
          { label: 'Current Streak', value: `${profile.streak.current}d` },
          { label: 'Longest Streak', value: `${profile.streak.longest}d` },
          { label: 'Goodwill Score', value: score },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-4"
          >
            <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
              {stat.label}
            </p>
            <p className="mt-1.5 font-display text-2xl font-bold tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      {/* Level Progression Ladder */}
      <section className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{currentLvl.badgeEmoji}</span>
            <div>
              <p className="text-xs font-mono text-orange-600 dark:text-orange-400 font-semibold">
                Current Rank · Level {currentLvl.level} of 6
              </p>
              <h2 className="font-display text-2xl font-bold">{currentLvl.title}</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {currentLvl.description}
              </p>
            </div>
          </div>

          <div className="md:w-72 space-y-1.5">
            <div className="flex justify-between text-xs font-mono tabular-nums">
              <span>Score: {score}</span>
              <span>{nextLvl ? `Next: ${nextLvl.minScore}` : 'Max Level'}</span>
            </div>
            <div className="h-2.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-orange-600"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Formula: 15/sent + 8/acknowledged + 10/best-streak-day + 20/achievement
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-stone-100 dark:border-zinc-800">
          {BLESSING_LEVELS.map((lvl) => {
            const reached = profile.currentLevel >= lvl.level;
            return (
              <div
                key={lvl.level}
                className={`rounded-2xl border p-4 ${
                  reached
                    ? 'border-orange-200 dark:border-orange-900/60 bg-orange-50/40 dark:bg-orange-950/20'
                    : 'border-stone-200 dark:border-zinc-800 opacity-65'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{lvl.badgeEmoji}</span>
                  <span className="text-[11px] font-mono tabular-nums text-stone-500">
                    {lvl.minScore} pts
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold">{lvl.title}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {lvl.perksNote}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievements Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-600" />
              <span>Achievements ({userAchievements.length} / {ACHIEVEMENTS.length})</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Unlocked automatically whenever you hit qualifying goodwill milestones.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500 font-mono">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>Streak: {profile.streak.current}d</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = unlockedMap.get(ach.id);
            return (
              <div
                key={ach.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between transition-colors ${
                  unlocked
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-[#161920]'
                    : 'border-stone-200 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-900/50 opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{ach.icon}</span>
                    {unlocked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                        <Lock className="w-3.5 h-3.5" />
                        Locked
                      </span>
                    )}
                  </div>
                  <h4 className="mt-3 font-display text-base font-bold">{ach.name}</h4>
                  <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-zinc-800 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                  {unlocked
                    ? `Earned ${formatBlessingDate(unlocked.unlockedAt)}`
                    : `Progress: ${ach.progressLabel(profile.statistics, profile.streak)}`}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
