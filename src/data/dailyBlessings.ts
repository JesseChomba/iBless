import type { BlessingCategoryId, DailyBlessingItem } from '../types/ibless';

const RAW_DAILY_BLESSINGS: Array<[BlessingCategoryId, string, string]> = [
  ['happiness', 'May your coffee stay warm until the final sip and your mood stay lighter than your inbox.', 'Bureau of Morning Morale'],
  ['prosperity', 'May your honest efforts multiply quietly, your bills shrink politely, and your pantry never run out of snacks.', 'Department of Household Abundance'],
  ['wisdom', 'May you recognise the difference between an urgent crisis and something that will resolve itself after lunch.', 'Office of Calm Discernment'],
  ['good_health', 'May your shoulders drop away from your ears, your posture straighten without effort, and your sleep tonight be glorious.', 'Wellness Dispatch'],
  ['love', 'May the warmth you carry for others find its way straight back to your doorstep today.', 'Heart & Hearth Division'],
  ['success', 'May the project you have been quietly worrying about click together with suspicious ease.', 'Momentum Desk'],
  ['peace', 'May unnecessary noise turn itself down and leave plenty of room for a deep, unhurried breath.', 'Quiet Waters Desk'],
  ['friendship', 'May someone text you a joke today that makes you laugh out loud in a mildly serious room.', 'Kindred Spirits Bureau'],
  ['gratitude', 'May you spot at least three small, ordinary miracles before dinner and smile at every single one.', 'Appreciation Archive'],
  ['general_goodwill', 'Official notice: your day has been upgraded to include gentle pacing and unexpected kindness.', 'Central Blessing Registry'],

  ['happiness', 'May a stray sunbeam find your desk right when you need a reminder that the world is still bright.', 'Bureau of Morning Morale'],
  ['prosperity', 'May opportunities arrive with clear instructions, fair pay, and zero hidden fees.', 'Department of Household Abundance'],
  ['wisdom', 'May the right words arrive on time—especially the graceful ones that help you say no without guilt.', 'Office of Calm Discernment'],
  ['good_health', 'May water taste extra refreshing today and your energy last comfortably past 4 p.m.', 'Wellness Dispatch'],
  ['love', 'May you be reminded today that you do not have to earn being cared for.', 'Heart & Hearth Division'],
  ['success', 'May every small step you take today stack up into progress you can actually feel proud of.', 'Momentum Desk'],
  ['peace', 'May the things outside your control stop renting space in your thoughts this afternoon.', 'Quiet Waters Desk'],
  ['friendship', 'May an old friend cross your mind today—and reach out before you even finish thinking of them.', 'Kindred Spirits Bureau'],
  ['gratitude', 'May someone thank you today for something small you thought nobody noticed.', 'Appreciation Archive'],
  ['general_goodwill', 'May your keys, phone, and patience all be exactly where you left them.', 'Central Blessing Registry'],

  ['happiness', 'May your favourite song play right as you start walking and turn an ordinary errand into a scene.', 'Bureau of Morning Morale'],
  ['prosperity', 'May your savings grow steadily, your skills stay in demand, and your generosity always have plenty left over.', 'Department of Household Abundance'],
  ['wisdom', 'May curiosity win over cynicism every time you meet something unfamiliar today.', 'Office of Calm Discernment'],
  ['good_health', 'May headaches stay far away, tension melt out of your jaw, and fresh air meet your lungs.', 'Wellness Dispatch'],
  ['love', 'May home feel soft at the edges today—warm lighting, kind voices, and nowhere you have to pretend.', 'Heart & Hearth Division'],
  ['success', 'May your preparation meet good timing and produce results that surprise even your cautious side.', 'Momentum Desk'],
  ['peace', 'May calm accompany every transition today, from waking up to closing your laptop.', 'Quiet Waters Desk'],
  ['friendship', 'May you always have at least one person you can send an unedited voice note to at any hour.', 'Kindred Spirits Bureau'],
  ['gratitude', 'May today hold one meal you truly savour instead of rushing through.', 'Appreciation Archive'],
  ['general_goodwill', 'May every queue you join move at a brisk, polite, and miraculous speed.', 'Central Blessing Registry'],

  ['happiness', 'May laughter surprise you in the middle of an otherwise ordinary Tuesday.', 'Bureau of Morning Morale'],
  ['prosperity', 'May creative ideas turn into tangible outcomes and fair rewards follow honest work.', 'Department of Household Abundance'],
  ['wisdom', 'May you know when to speak up clearly and when to let silence do the heavy lifting.', 'Office of Calm Discernment'],
  ['good_health', 'May every stretch feel good, every breath reach deep, and recovery come quickly.', 'Wellness Dispatch'],
  ['love', 'May patience and humour keep every conversation warm with the people you love.', 'Heart & Hearth Division'],
  ['success', 'May the hard part of the climb finally level out into a clear view.', 'Momentum Desk'],
  ['peace', 'May your mind close unnecessary browser tabs before bedtime tonight.', 'Quiet Waters Desk'],
  ['friendship', 'May good company meet you halfway and make heavy weeks feel noticeably lighter.', 'Kindred Spirits Bureau'],
  ['gratitude', 'May you notice how far you have come since this time last year.', 'Appreciation Archive'],
  ['general_goodwill', 'May green traffic lights follow you like an unofficial parade.', 'Central Blessing Registry'],

  ['happiness', 'May something delightful happen today purely because the universe felt like showing off.', 'Bureau of Morning Morale'],
  ['prosperity', 'May every door meant for you swing open smoothly without needing a crowbar.', 'Department of Household Abundance'],
  ['wisdom', 'May clarity show up gently before big decisions and hindsight stay kind.', 'Office of Calm Discernment'],
  ['good_health', 'May your body receive the rest, movement, and nourishment it has been politely asking for.', 'Wellness Dispatch'],
  ['love', 'May your kindness never feel wasted and your heart stay both open and protected.', 'Heart & Hearth Division'],
  ['success', 'May your focus hold steady long enough to finish what matters and still leave time to rest.', 'Momentum Desk'],
  ['peace', 'May worries shrink back to their true size when daylight hits them.', 'Quiet Waters Desk'],
  ['friendship', 'May you find people who celebrate your wins loudly and sit quietly with you when things wobble.', 'Kindred Spirits Bureau'],
  ['gratitude', 'May the comfort of familiar places wrap around you today.', 'Appreciation Archive'],
  ['general_goodwill', 'May your Wi-Fi remain heroic and your battery stay above twenty percent.', 'Central Blessing Registry'],

  ['happiness', 'May good news travel fast to your phone and stay awhile once it arrives.', 'Bureau of Morning Morale'],
  ['prosperity', 'May abundance show up not only in numbers, but in time, energy, and generous margins.', 'Department of Household Abundance'],
  ['wisdom', 'May you trust your hard-earned experience instead of second-guessing yourself all afternoon.', 'Office of Calm Discernment'],
  ['good_health', 'May mornings feel gentler, eyes feel rested, and strength rebuild quietly.', 'Wellness Dispatch'],
  ['love', 'May tenderness win every small disagreement before it grows teeth.', 'Heart & Hearth Division'],
  ['success', 'May your work land in the exact right hands at the exact right moment.', 'Momentum Desk'],
  ['peace', 'May stillness feel welcoming today, not empty.', 'Quiet Waters Desk'],
  ['friendship', 'May new connections feel surprisingly effortless and old friendships feel timeless.', 'Kindred Spirits Bureau'],
  ['gratitude', 'May you find quiet satisfaction in a job done cleanly.', 'Appreciation Archive'],
  ['general_goodwill', 'May your umbrella never be needed on days you forgot it.', 'Central Blessing Registry'],

  ['happiness', 'May your smile today come from genuine relief and uncomplicated joy.', 'Bureau of Morning Morale'],
  ['prosperity', 'May fruitful partnerships find you and unhelpful distractions wander elsewhere.', 'Department of Household Abundance'],
  ['wisdom', 'May good counsel reach you before you need to learn things the hard way.', 'Office of Calm Discernment'],
  ['good_health', 'May steady rhythms restore your energy and keep burnout far from your door.', 'Wellness Dispatch'],
  ['love', 'May you be surrounded by people who speak well of you in rooms you have not entered.', 'Heart & Hearth Division'],
  ['success', 'May persistence pay off with interest—and a well-earned celebratory treat.', 'Momentum Desk'],
  ['peace', 'May peace settle over your plans so nothing feels frantic today.', 'Quiet Waters Desk'],
  ['friendship', 'May shared meals, shared memes, and shared honesty keep your circle strong.', 'Kindred Spirits Bureau'],
  ['gratitude', 'May every small kindness offered to you today feel twice as warm.', 'Appreciation Archive'],
  ['general_goodwill', 'May the elevator already be waiting on your floor.', 'Central Blessing Registry'],

  ['happiness', 'May today deliver at least one pleasant plot twist you did not see coming.', 'Bureau of Morning Morale'],
  ['prosperity', 'May your cup stay full enough to share without ever feeling stretched thin.', 'Department of Household Abundance'],
  ['wisdom', 'May perspective keep molehills from masquerading as mountains.', 'Office of Calm Discernment'],
  ['good_health', 'May calm breathing steady your pulse and good health anchor your season.', 'Wellness Dispatch'],
  ['love', 'May you feel safe to be fully yourself wherever you gather today.', 'Heart & Hearth Division'],
  ['success', 'May feedback be constructive, collaborators be reliable, and momentum stay friendly.', 'Momentum Desk'],
  ['peace', 'May your evening arrive unhurried and your pillow feel remarkably cool.', 'Quiet Waters Desk'],
  ['friendship', 'May someone remind you today of a hilarious memory you nearly forgot.', 'Kindred Spirits Bureau'],
  ['gratitude', 'May appreciation turn today’s ordinary routine into something unexpectedly rich.', 'Appreciation Archive'],
  ['general_goodwill', 'May lost socks reunite and leftover dinner taste even better today.', 'Central Blessing Registry'],

  ['happiness', 'May bright moments outnumber dull errands by a comfortable margin today.', 'Bureau of Morning Morale'],
  ['prosperity', 'May clarity guide your finances and peace of mind accompany every decision.', 'Department of Household Abundance'],
  ['wisdom', 'May patience buy you the clarity that haste would have missed.', 'Office of Calm Discernment'],
  ['good_health', 'May your step carry ease and your body feel supported in everything you ask of it.', 'Wellness Dispatch'],
  ['love', 'May affection show up in practical, unmistakable ways today.', 'Heart & Hearth Division'],
  ['success', 'May small consistent habits quietly carry you across big finish lines.', 'Momentum Desk'],
  ['peace', 'May an unhurried spirit keep you steady even if everyone else is rushing.', 'Quiet Waters Desk'],
  ['friendship', 'May loyalty and warmth mark every circle you belong to.', 'Kindred Spirits Bureau'],
  ['gratitude', 'May you close the day feeling thankful rather than wrung out.', 'Appreciation Archive'],
  ['general_goodwill', 'May your toast always land butter-side up.', 'Central Blessing Registry'],

  ['happiness', 'May lightness find you early and stay late.', 'Bureau of Morning Morale'],
  ['prosperity', 'May resourceful solutions appear right when budgets or timelines look tight.', 'Department of Household Abundance'],
  ['wisdom', 'May humility keep you learning and confidence keep you moving.', 'Office of Calm Discernment'],
  ['good_health', 'May healing, stamina, and calm nerves be yours in generous measure.', 'Wellness Dispatch'],
  ['love', 'May love anchor your household through busy weeks and quiet Sundays alike.', 'Heart & Hearth Division'],
  ['success', 'May every honest draft you write turn into something worth signing your name to.', 'Momentum Desk'],
  ['peace', 'May peace guard both your front door and your thoughts.', 'Quiet Waters Desk'],
  ['friendship', 'May encouragement reach you from someone whose timing feels uncanny.', 'Kindred Spirits Bureau'],
  ['gratitude', 'May joy in small things become your quiet superpower this week.', 'Appreciation Archive'],
  ['general_goodwill', 'May good weather, good manners, and good fortune conspire in your favour today.', 'Central Blessing Registry'],

  ['happiness', 'May you catch yourself humming for no particular reason before noon.', 'Bureau of Morning Morale'],
  ['prosperity', 'May steady stewardship and lucky timing team up on your behalf.', 'Department of Household Abundance'],
  ['wisdom', 'May you ask the one simple question that clears up three hours of confusion.', 'Office of Calm Discernment'],
  ['good_health', 'May restful sleep knit up every frayed edge of a long week.', 'Wellness Dispatch'],
  ['love', 'May grace cover misunderstandings quickly and leave warmth behind.', 'Heart & Hearth Division'],
  ['success', 'May doors open cleanly, deadlines behave, and pride in your craft stay intact.', 'Momentum Desk'],
  ['peace', 'May gentle quiet meet you at the end of today’s obligations.', 'Quiet Waters Desk'],
  ['friendship', 'May your people always feel only a short message away.', 'Kindred Spirits Bureau'],
];

export const DAILY_BLESSINGS: DailyBlessingItem[] = RAW_DAILY_BLESSINGS.map(
  ([category, message, note], index) => ({
    id: `daily_${index + 1}`,
    category,
    message,
    note,
  })
);

export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPreviousDateKey(date = new Date()): string {
  const prev = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  return getLocalDateKey(prev);
}

export function getDailyBlessingForDate(date = new Date()): DailyBlessingItem {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const seed = date.getFullYear() * 367 + dayOfYear;
  return DAILY_BLESSINGS[seed % DAILY_BLESSINGS.length];
}
