import type {
  AchievementDefinition,
  LevelDefinition,
  UserStatistics,
  UserStreak,
} from '../types/ibless';

export const BLESSING_LEVELS: LevelDefinition[] = [
  {
    level: 1,
    title: 'Blessing Novice',
    badgeEmoji: '🌱',
    minScore: 0,
    description: 'Freshly sworn into the Department of Digital Goodwill.',
    perksNote: 'Full dispatch privileges unlocked.',
  },
  {
    level: 2,
    title: 'Junior Blessing Officer',
    badgeEmoji: '✉️',
    minScore: 40,
    description: 'Consistently delivering wholesome morale upgrades to friends.',
    perksNote: 'Recognised for reliable stamp-licking velocity.',
  },
  {
    level: 3,
    title: 'Certified Goodwill Distributor',
    badgeEmoji: '🏅',
    minScore: 120,
    description: 'Licensed to dispatch blessings across time zones without supervision.',
    perksNote: 'Official clipboard privileges (metaphorical).',
  },
  {
    level: 4,
    title: 'Senior Blessing Officer',
    badgeEmoji: '🌟',
    minScore: 260,
    description: 'Congratulations. You keep the group’s spirits suspiciously high.',
    perksNote: 'Trusted with emergency encouragement dispatches.',
  },
  {
    level: 5,
    title: 'Chief Blessing Distributor',
    badgeEmoji: '🎩',
    minScore: 500,
    description: 'Commanding an industrial-grade pipeline of warm wishes.',
    perksNote: 'Honorary corner office in the Clouds.',
  },
  {
    level: 6,
    title: 'Grandmaster of Good Fortune',
    badgeEmoji: '👑',
    minScore: 900,
    description: 'Peak benevolent absurdity. Even strangers feel luckier nearby.',
    perksNote: 'Maximum lifetime goodwill certification.',
  },
];

/**
 * Transparent Progression Formula:
 * Score = (sentCount * 15) + (acknowledgedCount * 8) + (longestStreak * 10) + (unlockedAchievementsCount * 20)
 */
export function calculateGoodwillScore(
  stats: UserStatistics,
  streak: UserStreak,
  achievementsCount: number
): number {
  return (
    stats.sentCount * 15 +
    stats.acknowledgedCount * 8 +
    streak.longest * 10 +
    achievementsCount * 20
  );
}

export function getLevelForScore(score: number): LevelDefinition {
  let current = BLESSING_LEVELS[0];
  for (const lvl of BLESSING_LEVELS) {
    if (score >= lvl.minScore) {
      current = lvl;
    }
  }
  return current;
}

export function getNextLevel(currentLevel: number): LevelDefinition | null {
  return BLESSING_LEVELS.find((l) => l.level === currentLevel + 1) ?? null;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_blessing',
    name: 'First Blessing',
    description: 'Dispatch your very first digital blessing into the world.',
    icon: '💌',
    check: (stats) => stats.sentCount >= 1,
    progressLabel: (stats) => `${Math.min(stats.sentCount, 1)} / 1 sent`,
  },
  {
    id: 'goodwill_ambassador',
    name: 'Goodwill Ambassador',
    description: 'Send 10 personalised blessings to brighten people’s days.',
    icon: '🕊️',
    check: (stats) => stats.sentCount >= 10,
    progressLabel: (stats) => `${Math.min(stats.sentCount, 10)} / 10 sent`,
  },
  {
    id: 'blessing_enthusiast',
    name: 'Blessing Enthusiast',
    description: 'Send 25 blessings. Your stamp pad never dries.',
    icon: '📮',
    check: (stats) => stats.sentCount >= 25,
    progressLabel: (stats) => `${Math.min(stats.sentCount, 25)} / 25 sent`,
  },
  {
    id: 'generosity_department',
    name: 'Generosity Department',
    description: 'Send 50 blessings. At this point, you are a one-person postal service.',
    icon: '🏛️',
    check: (stats) => stats.sentCount >= 50,
    progressLabel: (stats) => `${Math.min(stats.sentCount, 50)} / 50 sent`,
  },
  {
    id: 'receiver_of_fortune',
    name: 'Receiver of Good Fortune',
    description: 'Receive 10 blessings from others. Clearly very likeable.',
    icon: '🎁',
    check: (stats) => stats.receivedCount >= 10,
    progressLabel: (stats) => `${Math.min(stats.receivedCount, 10)} / 10 received`,
  },
  {
    id: 'the_thankful_one',
    name: 'The Thankful One',
    description: 'Acknowledge 10 blessings you have received.',
    icon: '🙌',
    check: (stats) => stats.acknowledgedCount >= 10,
    progressLabel: (stats) => `${Math.min(stats.acknowledgedCount, 10)} / 10 acknowledged`,
  },
  {
    id: 'consistency_officer',
    name: 'Consistency Officer',
    description: 'Maintain a 7-day blessing activity streak.',
    icon: '🔥',
    check: (_, streak) => streak.longest >= 7,
    progressLabel: (_, streak) => `${Math.min(streak.longest, 7)} / 7 day streak`,
  },
  {
    id: 'eternal_optimist',
    name: 'The Eternal Optimist',
    description: 'Maintain a 30-day blessing activity streak. Unstoppable cheer.',
    icon: '🌞',
    check: (_, streak) => streak.longest >= 30,
    progressLabel: (_, streak) => `${Math.min(streak.longest, 30)} / 30 day streak`,
  },
  {
    id: 'social_coordinator',
    name: 'Social Blessing Coordinator',
    description: 'Connect with 10 friends on iBless.',
    icon: '🤝',
    check: (stats) => stats.connectionsCount >= 10,
    progressLabel: (stats) => `${Math.min(stats.connectionsCount, 10)} / 10 friends`,
  },
  {
    id: 'archivist_of_joy',
    name: 'Archivist of Joy',
    description: 'Save 5 meaningful blessings to your personal collection.',
    icon: '🔖',
    check: (stats) => stats.savedCount >= 5,
    progressLabel: (stats) => `${Math.min(stats.savedCount, 5)} / 5 saved`,
  },
  {
    id: 'public_benefactor',
    name: 'Public Benefactor',
    description: 'Share a blessing publicly to the community feed.',
    icon: '📣',
    check: (_s, _st, extras) => (extras?.publicCount ?? 0) >= 1,
    progressLabel: () => 'Share 1 public blessing',
  },
  {
    id: 'first_responder',
    name: 'Goodwill Responder',
    description: 'Answer someone’s blessing request with encouragement.',
    icon: '🫶',
    check: (_s, _st, extras) => (extras?.fulfilledRequestCount ?? 0) >= 1,
    progressLabel: () => 'Respond to 1 request',
  },
];
