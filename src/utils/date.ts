import type { Timestamp } from 'firebase/firestore';
import { getLocalDateKey, getPreviousDateKey } from '../data/dailyBlessings';
import type { UserStreak } from '../types/ibless';

export function timestampToDate(ts?: Timestamp | Date | null): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof (ts as Timestamp).toDate === 'function') {
    return (ts as Timestamp).toDate();
  }
  return null;
}

export function formatBlessingDate(ts?: Timestamp | Date | null): string {
  const date = timestampToDate(ts) ?? new Date();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(ts?: Timestamp | Date | null): string {
  const date = timestampToDate(ts);
  if (!date) return 'Just now';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatBlessingDate(date);
}

/**
 * Computes the updated streak for a qualifying blessing activity (send or receive)
 * on the current local calendar day. Multiple activities on the same day do not
 * increment the streak more than once.
 */
export function computeUpdatedStreak(existing: UserStreak, now = new Date()): UserStreak {
  const today = getLocalDateKey(now);
  if (existing.lastActiveDate === today) {
    return existing;
  }
  const yesterday = getPreviousDateKey(now);
  const nextCurrent = existing.lastActiveDate === yesterday ? existing.current + 1 : 1;
  const nextLongest = Math.max(existing.longest, nextCurrent);
  return {
    current: nextCurrent,
    longest: nextLongest,
    lastActiveDate: today,
  };
}
