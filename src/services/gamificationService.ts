import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  ACHIEVEMENTS,
  calculateGoodwillScore,
  getLevelForScore,
} from '../data/gamification';
import type { UserPublic, UserStatistics, UserStreak } from '../types/ibless';

export interface GamificationSyncResult {
  newlyUnlocked: Array<{ id: string; name: string; icon: string }>;
  leveledUpTo?: { level: number; title: string; badgeEmoji: string };
}

/**
 * Evaluates all achievements against the user's current stats & streak,
 * unlocks any newly met achievements deterministically (via composite ID),
 * and checks if the user's Goodwill Level has advanced.
 */
export async function syncGamificationProgress(
  user: UserPublic,
  extras?: { publicCount?: number; fulfilledRequestCount?: number }
): Promise<GamificationSyncResult> {
  const path = `userAchievements`;
  try {
    const existingSnap = await getDocs(
      query(
        collection(db, 'userAchievements'),
        where('userId', '==', user.uid),
        limit(50)
      )
    );
    const unlockedIds = new Set(existingSnap.docs.map((d) => d.data().achievementId as string));

    const newlyUnlocked: Array<{ id: string; name: string; icon: string }> = [];
    for (const ach of ACHIEVEMENTS) {
      if (!unlockedIds.has(ach.id) && ach.check(user.statistics, user.streak, extras)) {
        newlyUnlocked.push({ id: ach.id, name: ach.name, icon: ach.icon });
      }
    }

    const totalUnlocked = unlockedIds.size + newlyUnlocked.length;
    const score = calculateGoodwillScore(user.statistics, user.streak, totalUnlocked);
    const computedLevel = getLevelForScore(score);
    const didLevelUp = computedLevel.level > user.currentLevel;

    if (newlyUnlocked.length === 0 && !didLevelUp) {
      return { newlyUnlocked: [] };
    }

    await runTransaction(db, async (tx) => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists()) return;
      const latestUser = userSnap.data() as UserPublic;

      for (const item of newlyUnlocked) {
        const achDef = ACHIEVEMENTS.find((a) => a.id === item.id)!;
        const achDocId = `${user.uid}_${item.id}`;
        const achRef = doc(db, 'userAchievements', achDocId);
        const achSnap = await tx.get(achRef);
        if (!achSnap.exists()) {
          tx.set(achRef, {
            id: achDocId,
            userId: user.uid,
            achievementId: item.id,
            name: achDef.name,
            description: achDef.description,
            icon: achDef.icon,
            unlockedAt: serverTimestamp(),
          });

          const notifId = `notif_ach_${user.uid}_${item.id}`;
          tx.set(doc(db, 'notifications', notifId), {
            notificationId: notifId,
            userId: user.uid,
            actorId: user.uid,
            type: 'achievement_unlocked',
            title: `Achievement Unlocked: ${achDef.name}`,
            message: `${achDef.icon} ${achDef.description}`,
            relatedEntityId: item.id,
            linkPath: '/achievements',
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }

      if (computedLevel.level > latestUser.currentLevel) {
        tx.update(userRef, {
          currentLevel: computedLevel.level,
          updatedAt: serverTimestamp(),
        });

        const lvlNotifId = `notif_lvl_${user.uid}_${computedLevel.level}`;
        tx.set(doc(db, 'notifications', lvlNotifId), {
          notificationId: lvlNotifId,
          userId: user.uid,
          actorId: user.uid,
          type: 'level_up',
          title: `Promoted to ${computedLevel.title}!`,
          message: `Congratulations. You have reached Level ${computedLevel.level} (${computedLevel.badgeEmoji}).`,
          relatedEntityId: String(computedLevel.level),
          linkPath: '/achievements',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    });

    return {
      newlyUnlocked,
      leveledUpTo: didLevelUp
        ? {
            level: computedLevel.level,
            title: computedLevel.title,
            badgeEmoji: computedLevel.badgeEmoji,
          }
        : undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function mergeUserStatsAndStreak(
  stats: UserStatistics,
  streak: UserStreak,
  achievementsCount: number
) {
  const score = calculateGoodwillScore(stats, streak, achievementsCount);
  const level = getLevelForScore(score);
  return { score, level };
}
