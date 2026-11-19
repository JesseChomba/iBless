import type { BlessingCategoryId } from '../types/ibless';

export interface BlessingTemplate {
  id: string;
  label: string;
  text: string;
}

export interface BlessingCategoryMeta {
  id: BlessingCategoryId;
  name: string;
  description: string;
  emoji: string;
  accentHex: string;
  softBgClass: string;
  textClass: string;
  templates: BlessingTemplate[];
}

export const BLESSING_CATEGORIES: BlessingCategoryMeta[] = [
  {
    id: 'prosperity',
    name: 'Prosperity',
    description: 'Abundance, flourishing ventures, and zero surprise bills.',
    emoji: '🌱',
    accentHex: '#10B981',
    softBgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    templates: [
      {
        id: 'prosp_1',
        label: 'Overflowing pantry',
        text: 'May your hard work bear generous fruit, your pantry stay full, and every honest venture you touch multiply in quiet, steady abundance.',
      },
      {
        id: 'prosp_2',
        label: 'Sudden green lights',
        text: 'Sending an official prosperity blessing: may opportunities knock early, invoices clear swiftly, and unexpected good news land in your inbox this week.',
      },
      {
        id: 'prosp_3',
        label: 'Generous harvest',
        text: 'May you have more than enough to thrive, rest easy, and share joyfully with the people who matter most to you.',
      },
    ],
  },
  {
    id: 'good_health',
    name: 'Good Health',
    description: 'Restful sleep, steady energy, and resilient wellbeing.',
    emoji: '💚',
    accentHex: '#059669',
    softBgClass: 'bg-teal-50 dark:bg-teal-950/40',
    textClass: 'text-teal-700 dark:text-teal-300',
    templates: [
      {
        id: 'health_1',
        label: 'Deep rest & renewal',
        text: 'May your body feel light, your mind find unhurried quiet, and every night bring the kind of deep sleep that makes mornings welcome.',
      },
      {
        id: 'health_2',
        label: 'Steady strength',
        text: 'Dispatching a fresh supply of vitality your way—may strength meet you where you feel tired and healing move swiftly wherever it is needed.',
      },
      {
        id: 'health_3',
        label: 'Hydrated & thriving',
        text: 'May your shoulders drop from your ears, your breath deepen, and good health accompany every step you take this season.',
      },
    ],
  },
  {
    id: 'love',
    name: 'Love',
    description: 'Warmth, tenderness, and feeling deeply cherished.',
    emoji: '🧡',
    accentHex: '#F43F5E',
    softBgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-300',
    templates: [
      {
        id: 'love_1',
        label: 'Surrounded by care',
        text: 'May you feel genuinely seen, deeply appreciated, and reminded today of how much warmth your presence brings into the world.',
      },
      {
        id: 'love_2',
        label: 'Kindness returned',
        text: 'May all the patience, care, and quiet kindness you give away come circling back to you tenfold.',
      },
      {
        id: 'love_3',
        label: 'Home & heart',
        text: 'Blessing your home with gentle laughter, lingering conversations, and love that feels safe and effortless.',
      },
    ],
  },
  {
    id: 'happiness',
    name: 'Happiness',
    description: 'Small delights, spontaneous laughter, and bright mornings.',
    emoji: '☀️',
    accentHex: '#F59E0B',
    softBgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-700 dark:text-amber-300',
    templates: [
      {
        id: 'happy_1',
        label: 'Unplanned joy',
        text: 'May something wonderfully silly make you laugh today, your favourite beverage hit the exact right temperature, and joy sneak up on you.',
      },
      {
        id: 'happy_2',
        label: 'Bright upgrade',
        text: 'Consider your day officially upgraded: wishing you sunshine in unexpected places and small victories that put a spring in your step.',
      },
      {
        id: 'happy_3',
        label: 'Lightness of heart',
        text: 'May heaviness lift gently off your shoulders and make room for bright, uncomplicated happiness.',
      },
    ],
  },
  {
    id: 'wisdom',
    name: 'Wisdom',
    description: 'Clear judgement, calm perspective, and timely insight.',
    emoji: '🦉',
    accentHex: '#6366F1',
    softBgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    textClass: 'text-indigo-700 dark:text-indigo-300',
    templates: [
      {
        id: 'wisdom_1',
        label: 'Clear compass',
        text: 'When the path splits, may clarity arrive without panic, good counsel find your ear, and your instincts stay steady and true.',
      },
      {
        id: 'wisdom_2',
        label: 'Right words at the right time',
        text: 'Blessing you with calm discernment—may you know what deserves your energy, what can wait until Tuesday, and what to let go of.',
      },
      {
        id: 'wisdom_3',
        label: 'Thoughtful clarity',
        text: 'May complex knots untangle easily before you and every decision leave you more grounded than before.',
      },
    ],
  },
  {
    id: 'success',
    name: 'Success',
    description: 'Breakthroughs, focused momentum, and proud milestones.',
    emoji: '🚀',
    accentHex: '#EA580C',
    softBgClass: 'bg-orange-50 dark:bg-orange-950/40',
    textClass: 'text-orange-700 dark:text-orange-300',
    templates: [
      {
        id: 'success_1',
        label: 'Smooth execution',
        text: 'May your preparation meet its moment cleanly, your focus stay sharp, and the work you put in open doors you once only hoped for.',
      },
      {
        id: 'success_2',
        label: 'Exam & interview boost',
        text: 'Sending certified goodwill for the big task ahead: may everything you studied stick, every answer flow clearly, and confidence stay by your side.',
      },
      {
        id: 'success_3',
        label: 'Milestone reached',
        text: 'May obstacles step politely aside and your next milestone arrive sooner and smoother than you planned.',
      },
    ],
  },
  {
    id: 'good_fortune',
    name: 'Good Fortune',
    description: 'Happy coincidences, green traffic lights, and lucky timing.',
    emoji: '🍀',
    accentHex: '#16A34A',
    softBgClass: 'bg-green-50 dark:bg-green-950/40',
    textClass: 'text-green-700 dark:text-green-300',
    templates: [
      {
        id: 'luck_1',
        label: 'All green lights',
        text: 'May you catch every train with ten seconds to spare, find the last great seat, and stumble into remarkably good timing all week.',
      },
      {
        id: 'luck_2',
        label: 'Serendipity dispatch',
        text: 'Blessing your week with pleasant surprises, helpful strangers, and coincidences that feel suspiciously well-orchestrated.',
      },
      {
        id: 'luck_3',
        label: 'Tailwinds only',
        text: 'May the wind stay squarely at your back and fortune smile softly on your plans.',
      },
    ],
  },
  {
    id: 'peace',
    name: 'Peace',
    description: 'Stillness, untroubled thoughts, and gentle breathing room.',
    emoji: '🕊️',
    accentHex: '#0EA5E9',
    softBgClass: 'bg-sky-50 dark:bg-sky-950/40',
    textClass: 'text-sky-700 dark:text-sky-300',
    templates: [
      {
        id: 'peace_1',
        label: 'Quiet waters',
        text: 'May noise settle down, deadlines feel manageable, and a deep, unshakeable calm anchor your heart today.',
      },
      {
        id: 'peace_2',
        label: 'Gentle pace',
        text: 'Dispatching an emergency shipment of peace: may you feel no rush to prove anything today and enjoy the simple quiet of being here.',
      },
      {
        id: 'peace_3',
        label: 'Restful heart',
        text: 'May peace guard your thoughts, soften sharp edges, and follow you wherever this week takes you.',
      },
    ],
  },
  {
    id: 'protection',
    name: 'Protection',
    description: 'Safe travels, steady shelter, and watchful goodwill.',
    emoji: '🛡️',
    accentHex: '#7C3AED',
    softBgClass: 'bg-violet-50 dark:bg-violet-950/40',
    textClass: 'text-violet-700 dark:text-violet-300',
    templates: [
      {
        id: 'prot_1',
        label: 'Safe journeys',
        text: 'Wishing you smooth roads, safe arrivals, attentive drivers around you, and peace of mind from departure until you are home again.',
      },
      {
        id: 'prot_2',
        label: 'Sheltered & steady',
        text: 'May you and your household stay sheltered from unnecessary harm, shielded from stress, and surrounded by reliable care.',
      },
      {
        id: 'prot_3',
        label: 'Watchful grace',
        text: 'May every journey you take—near or far—be guarded with safety, warmth, and a welcome waiting at the end.',
      },
    ],
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    description: 'Appreciating someone who made life noticeably better.',
    emoji: '🙏',
    accentHex: '#D97706',
    softBgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    textClass: 'text-yellow-700 dark:text-yellow-300',
    templates: [
      {
        id: 'grat_1',
        label: 'Thank you for being you',
        text: 'Just wanted to pause and bless you for the quiet, generous way you show up for people. You make everything around you better.',
      },
      {
        id: 'grat_2',
        label: 'Grateful dispatch',
        text: 'Consider this an official thank-you wrapped in a blessing: grateful for your patience, your humour, and your steady presence.',
      },
      {
        id: 'grat_3',
        label: 'Appreciation note',
        text: 'May the kindness you have poured into my life return to you in full measure and bright moments.',
      },
    ],
  },
  {
    id: 'friendship',
    name: 'Friendship',
    description: 'Celebrating kindred spirits, shared jokes, and loyalty.',
    emoji: '🤝',
    accentHex: '#0284C7',
    softBgClass: 'bg-cyan-50 dark:bg-cyan-950/40',
    textClass: 'text-cyan-700 dark:text-cyan-300',
    templates: [
      {
        id: 'friend_1',
        label: 'Glad you exist',
        text: 'No special occasion—just sending a blessing because life is markedly funnier, lighter, and better with you in my corner.',
      },
      {
        id: 'friend_2',
        label: 'Long-overdue cheer',
        text: 'Even when life gets busy, know I am cheering loudly for you. May this week treat my favourite human extraordinarily well.',
      },
      {
        id: 'friend_3',
        label: 'Kindred spirit',
        text: 'May our friendship keep aging like fine tea, bringing comfort, absurd jokes, and honest encouragement for years to come.',
      },
    ],
  },
  {
    id: 'general_goodwill',
    name: 'General Goodwill',
    description: 'All-purpose, universal warmth for any day of the week.',
    emoji: '✨',
    accentHex: '#EC4899',
    softBgClass: 'bg-pink-50 dark:bg-pink-950/40',
    textClass: 'text-pink-700 dark:text-pink-300',
    templates: [
      {
        id: 'gen_1',
        label: 'Day upgrade',
        text: 'You have been officially blessed. Your day just received an unscheduled upgrade toward lighter moods and pleasant surprises.',
      },
      {
        id: 'gen_2',
        label: 'Warm wishes',
        text: 'Sending all-purpose goodwill your way—may whatever you are carrying feel a little lighter after reading this.',
      },
      {
        id: 'gen_3',
        label: 'Bright horizon',
        text: 'May good things find your doorstep, good people cross your path, and peace stay in your pocket all week long.',
      },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Blessing',
    description: 'Write completely from scratch in your own voice or tradition.',
    emoji: '✍️',
    accentHex: '#57534E',
    softBgClass: 'bg-stone-100 dark:bg-zinc-800',
    textClass: 'text-stone-700 dark:text-stone-300',
    templates: [],
  },
];

export function getCategoryMeta(id: string): BlessingCategoryMeta {
  return (
    BLESSING_CATEGORIES.find((c) => c.id === id) ??
    BLESSING_CATEGORIES[BLESSING_CATEGORIES.length - 1]
  );
}
