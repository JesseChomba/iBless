import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import type {
  Blessing,
  BlessingCategoryId,
  BlessingRequest,
  BlessingVisibility,
  CardStyleId,
  DailyBlessingItem,
  ReactionKey,
  SavedBlessing,
  UserPublic,
} from '../types/ibless';
import { computeUpdatedStreak, formatBlessingDate } from '../utils/date';
import { syncGamificationProgress } from './gamificationService';

function genId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
}

export interface SendBlessingInput {
  sender: UserPublic;
  recipient: UserPublic;
  message: string;
  category: BlessingCategoryId;
  templateId?: string;
  cardStyle: CardStyleId;
  visibility: BlessingVisibility;
  requestId?: string;
}

export async function sendBlessing(input: SendBlessingInput): Promise<{
  blessingId: string;
  gamification: Awaited<ReturnType<typeof syncGamificationProgress>>;
}> {
  const cleanMessage = input.message.trim();
  if (!cleanMessage || cleanMessage.length > 600) {
    throw new Error('Blessing message must be between 1 and 600 characters.');
  }

  const blessingId = genId('bls');
  const notifId = genId('ntf');

  try {
    let updatedSender: UserPublic | null = null;
    let fulfilledCountDelta = 0;

    await runTransaction(db, async (tx) => {
      const senderRef = doc(db, 'users', input.sender.uid);
      const senderSnap = await tx.get(senderRef);
      if (!senderSnap.exists()) throw new Error('Sender profile not found.');
      const senderData = senderSnap.data() as UserPublic;

      let requestData: BlessingRequest | null = null;
      const reqRef = input.requestId ? doc(db, 'blessingRequests', input.requestId) : null;
      if (reqRef) {
        const reqSnap = await tx.get(reqRef);
        if (reqSnap.exists()) {
          requestData = reqSnap.data() as BlessingRequest;
        }
      }

      const nextStreak = computeUpdatedStreak(senderData.streak);
      const nextStats = {
        ...senderData.statistics,
        sentCount: senderData.statistics.sentCount + 1,
      };

      const blessingDoc: Record<string, unknown> = {
        blessingId,
        senderId: senderData.uid,
        senderName: senderData.displayName,
        senderUsername: senderData.username,
        senderPhotoURL: senderData.photoURL || '',
        recipientId: input.recipient.uid,
        recipientName: input.recipient.displayName,
        recipientUsername: input.recipient.username,
        recipientIds: [input.recipient.uid],
        message: cleanMessage,
        category: input.category,
        cardStyle: input.cardStyle,
        visibility: input.visibility,
        status: 'delivered',
        reactions: { heart: 0, pray: 0, sparkle: 0, smile: 0 },
        countedByRecipient: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (input.templateId) blessingDoc.templateId = input.templateId.slice(0, 64);
      if (input.requestId) blessingDoc.requestId = input.requestId.slice(0, 128);

      tx.set(doc(db, 'blessings', blessingId), blessingDoc);

      tx.update(senderRef, {
        statistics: nextStats,
        streak: nextStreak,
        updatedAt: serverTimestamp(),
      });

      updatedSender = {
        ...senderData,
        statistics: nextStats,
        streak: nextStreak,
      };

      if (input.recipient.uid !== senderData.uid) {
        tx.set(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          userId: input.recipient.uid,
          actorId: senderData.uid,
          type: 'blessing_received',
          title: `${senderData.displayName} sent you a blessing`,
          message: cleanMessage.slice(0, 140),
          relatedEntityId: blessingId,
          linkPath: '/inbox',
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      if (reqRef && requestData && requestData.status === 'open') {
        tx.update(reqRef, {
          status: 'fulfilled',
          responseCount: requestData.responseCount + 1,
          fulfilledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        fulfilledCountDelta = 1;

        if (requestData.senderId !== senderData.uid && requestData.senderId !== input.recipient.uid) {
          const reqNotifId = genId('ntf');
          tx.set(doc(db, 'notifications', reqNotifId), {
            notificationId: reqNotifId,
            userId: requestData.senderId,
            actorId: senderData.uid,
            type: 'request_fulfilled',
            title: `${senderData.displayName} responded to your blessing request`,
            message: cleanMessage.slice(0, 140),
            relatedEntityId: requestData.requestId,
            linkPath: '/inbox',
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    });

    const gamification = updatedSender
      ? await syncGamificationProgress(updatedSender, {
          publicCount: input.visibility === 'public' ? 1 : 0,
          fulfilledRequestCount: fulfilledCountDelta,
        })
      : { newlyUnlocked: [] };

    return { blessingId, gamification };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `blessings/${blessingId}`);
  }
}

/**
 * Transactionally counts newly delivered blessings for the recipient (idempotent via countedByRecipient).
 */
export async function syncUncountedReceivedBlessings(
  uid: string,
  receivedBlessings: Blessing[]
): Promise<void> {
  const uncounted = receivedBlessings.filter((b) => !b.countedByRecipient).slice(0, 10);
  if (uncounted.length === 0) return;

  try {
    let latestUser: UserPublic | null = null;
    for (const item of uncounted) {
      await runTransaction(db, async (tx) => {
        const bRef = doc(db, 'blessings', item.blessingId);
        const uRef = doc(db, 'users', uid);
        const [bSnap, uSnap] = await Promise.all([tx.get(bRef), tx.get(uRef)]);
        if (!bSnap.exists() || !uSnap.exists()) return;
        const bData = bSnap.data() as Blessing;
        if (bData.countedByRecipient || bData.recipientId !== uid) return;

        const uData = uSnap.data() as UserPublic;
        const nextStreak = computeUpdatedStreak(uData.streak);
        const nextStats = {
          ...uData.statistics,
          receivedCount: uData.statistics.receivedCount + 1,
        };

        tx.update(bRef, {
          countedByRecipient: true,
          status: bData.status === 'dispatched' ? 'delivered' : bData.status,
          updatedAt: serverTimestamp(),
        });
        tx.update(uRef, {
          statistics: nextStats,
          streak: nextStreak,
          updatedAt: serverTimestamp(),
        });
        latestUser = { ...uData, statistics: nextStats, streak: nextStreak };
      });
    }

    if (latestUser) {
      await syncGamificationProgress(latestUser);
    }
  } catch (error) {
    console.warn('Could not sync uncounted received blessings:', error);
  }
}

export async function markBlessingAsRead(blessing: Blessing, currentUid: string): Promise<void> {
  if (blessing.recipientId !== currentUid) return;
  if (blessing.status === 'read' || blessing.status === 'acknowledged') return;
  try {
    await updateDoc(doc(db, 'blessings', blessing.blessingId), {
      status: 'read',
      readAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `blessings/${blessing.blessingId}`);
  }
}

export async function acknowledgeBlessing(
  blessing: Blessing,
  recipient: UserPublic,
  thankYouNote?: string
): Promise<Awaited<ReturnType<typeof syncGamificationProgress>>> {
  if (blessing.recipientId !== recipient.uid) {
    throw new Error('Only the recipient can acknowledge this blessing.');
  }
  const cleanNote = thankYouNote?.trim().slice(0, 300) || '';

  try {
    let updatedUser: UserPublic | null = null;

    await runTransaction(db, async (tx) => {
      const bRef = doc(db, 'blessings', blessing.blessingId);
      const uRef = doc(db, 'users', recipient.uid);
      const [bSnap, uSnap] = await Promise.all([tx.get(bRef), tx.get(uRef)]);
      if (!bSnap.exists() || !uSnap.exists()) throw new Error('Blessing not found.');
      const bData = bSnap.data() as Blessing;
      const uData = uSnap.data() as UserPublic;
      const wasAlreadyAck = bData.status === 'acknowledged';

      const patch: Record<string, unknown> = {
        status: 'acknowledged',
        readAt: bData.readAt ?? serverTimestamp(),
        acknowledgedAt: bData.acknowledgedAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (cleanNote) {
        patch.thankYouNote = cleanNote;
      }

      tx.update(bRef, patch);

      if (!wasAlreadyAck) {
        const nextStats = {
          ...uData.statistics,
          acknowledgedCount: uData.statistics.acknowledgedCount + 1,
        };
        tx.update(uRef, {
          statistics: nextStats,
          updatedAt: serverTimestamp(),
        });
        updatedUser = { ...uData, statistics: nextStats };

        if (bData.senderId !== recipient.uid) {
          const notifId = genId('ntf');
          tx.set(doc(db, 'notifications', notifId), {
            notificationId: notifId,
            userId: bData.senderId,
            actorId: recipient.uid,
            type: 'blessing_acknowledged',
            title: `${recipient.displayName} acknowledged your blessing`,
            message: cleanNote
              ? `Thank-you note: "${cleanNote.slice(0, 120)}"`
              : 'Receipt confirmed with gratitude!',
            relatedEntityId: bData.blessingId,
            linkPath: '/archive',
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    });

    if (updatedUser) {
      return await syncGamificationProgress(updatedUser);
    }
    return { newlyUnlocked: [] };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `blessings/${blessing.blessingId}`);
  }
}

export async function updateBlessingVisibility(
  blessingId: string,
  visibility: BlessingVisibility
): Promise<void> {
  try {
    await updateDoc(doc(db, 'blessings', blessingId), {
      visibility,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `blessings/${blessingId}`);
  }
}

export async function deleteSentBlessing(blessingId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'blessings', blessingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `blessings/${blessingId}`);
  }
}

export async function getBlessingById(blessingId: string): Promise<Blessing | null> {
  try {
    const snap = await getDoc(doc(db, 'blessings', blessingId));
    return snap.exists() ? (snap.data() as Blessing) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `blessings/${blessingId}`);
  }
}

export async function reactToPublicBlessing(
  blessing: Blessing,
  reactor: UserPublic,
  emoji: ReactionKey
): Promise<void> {
  if (blessing.visibility !== 'public') {
    throw new Error('Only public blessings can receive community reactions.');
  }
  const reactionId = `${blessing.blessingId}_${reactor.uid}`;

  try {
    await runTransaction(db, async (tx) => {
      const bRef = doc(db, 'blessings', blessing.blessingId);
      const rRef = doc(db, 'blessingReactions', reactionId);
      const [bSnap, rSnap] = await Promise.all([tx.get(bRef), tx.get(rRef)]);
      if (!bSnap.exists()) throw new Error('Blessing not found.');

      const bData = bSnap.data() as Blessing;
      const nextReactions = { ...bData.reactions };

      if (rSnap.exists()) {
        const prevEmoji = rSnap.data().emoji as ReactionKey;
        if (prevEmoji === emoji) {
          nextReactions[prevEmoji] = Math.max(0, (nextReactions[prevEmoji] || 0) - 1);
          tx.delete(rRef);
          tx.update(bRef, { reactions: nextReactions, updatedAt: serverTimestamp() });
          return;
        }
        nextReactions[prevEmoji] = Math.max(0, (nextReactions[prevEmoji] || 0) - 1);
        nextReactions[emoji] = (nextReactions[emoji] || 0) + 1;
        tx.update(rRef, { emoji });
        tx.update(bRef, { reactions: nextReactions, updatedAt: serverTimestamp() });
      } else {
        nextReactions[emoji] = (nextReactions[emoji] || 0) + 1;
        tx.set(rRef, {
          reactionId,
          blessingId: blessing.blessingId,
          userId: reactor.uid,
          emoji,
          createdAt: serverTimestamp(),
        });
        tx.update(bRef, { reactions: nextReactions, updatedAt: serverTimestamp() });

        if (bData.senderId !== reactor.uid) {
          const notifId = genId('ntf');
          tx.set(doc(db, 'notifications', notifId), {
            notificationId: notifId,
            userId: bData.senderId,
            actorId: reactor.uid,
            type: 'public_reaction',
            title: `${reactor.displayName} reacted to your public blessing`,
            message: `Sent a warm ${emoji} reaction.`,
            relatedEntityId: bData.blessingId,
            linkPath: '/feed',
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `blessingReactions/${reactionId}`);
  }
}

export async function saveBlessingToCollection(
  user: UserPublic,
  blessing: Blessing
): Promise<Awaited<ReturnType<typeof syncGamificationProgress>>> {
  const saveId = `${user.uid}_${blessing.blessingId}`;
  try {
    let updatedUser: UserPublic | null = null;
    await runTransaction(db, async (tx) => {
      const saveRef = doc(db, 'savedBlessings', saveId);
      const userRef = doc(db, 'users', user.uid);
      const [saveSnap, userSnap] = await Promise.all([tx.get(saveRef), tx.get(userRef)]);
      if (saveSnap.exists() || !userSnap.exists()) return;

      const uData = userSnap.data() as UserPublic;
      const nextStats = {
        ...uData.statistics,
        savedCount: uData.statistics.savedCount + 1,
      };
      tx.set(saveRef, {
        saveId,
        userId: user.uid,
        blessingId: blessing.blessingId,
        sourceType: 'blessing',
        blessingSnapshot: {
          message: blessing.message.slice(0, 600),
          category: blessing.category,
          senderName: blessing.senderName.slice(0, 50),
          senderUsername: blessing.senderUsername,
          recipientName: blessing.recipientName.slice(0, 50),
          cardStyle: blessing.cardStyle,
          createdAtLabel: formatBlessingDate(blessing.createdAt),
        },
        savedAt: serverTimestamp(),
      });
      tx.update(userRef, {
        statistics: nextStats,
        updatedAt: serverTimestamp(),
      });
      updatedUser = { ...uData, statistics: nextStats };
    });

    if (updatedUser) {
      return await syncGamificationProgress(updatedUser);
    }
    return { newlyUnlocked: [] };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `savedBlessings/${saveId}`);
  }
}

export async function saveDailyBlessingToCollection(
  user: UserPublic,
  daily: DailyBlessingItem
): Promise<Awaited<ReturnType<typeof syncGamificationProgress>>> {
  const saveId = `${user.uid}_${daily.id}`;
  try {
    let updatedUser: UserPublic | null = null;
    await runTransaction(db, async (tx) => {
      const saveRef = doc(db, 'savedBlessings', saveId);
      const userRef = doc(db, 'users', user.uid);
      const [saveSnap, userSnap] = await Promise.all([tx.get(saveRef), tx.get(userRef)]);
      if (saveSnap.exists() || !userSnap.exists()) return;

      const uData = userSnap.data() as UserPublic;
      const nextStats = {
        ...uData.statistics,
        savedCount: uData.statistics.savedCount + 1,
      };
      tx.set(saveRef, {
        saveId,
        userId: user.uid,
        blessingId: daily.id,
        sourceType: 'daily',
        blessingSnapshot: {
          message: daily.message.slice(0, 600),
          category: daily.category,
          senderName: daily.note.slice(0, 50),
          recipientName: user.displayName.slice(0, 50),
          cardStyle: 'sunbeam',
          createdAtLabel: formatBlessingDate(new Date()),
        },
        savedAt: serverTimestamp(),
      });
      tx.update(userRef, {
        statistics: nextStats,
        updatedAt: serverTimestamp(),
      });
      updatedUser = { ...uData, statistics: nextStats };
    });

    if (updatedUser) {
      return await syncGamificationProgress(updatedUser);
    }
    return { newlyUnlocked: [] };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `savedBlessings/${saveId}`);
  }
}

export async function removeSavedBlessing(uid: string, saveId: string): Promise<void> {
  try {
    await runTransaction(db, async (tx) => {
      const saveRef = doc(db, 'savedBlessings', saveId);
      const userRef = doc(db, 'users', uid);
      const [saveSnap, userSnap] = await Promise.all([tx.get(saveRef), tx.get(userRef)]);
      if (!saveSnap.exists()) return;
      tx.delete(saveRef);
      if (userSnap.exists()) {
        const uData = userSnap.data() as UserPublic;
        tx.update(userRef, {
          statistics: {
            ...uData.statistics,
            savedCount: Math.max(0, uData.statistics.savedCount - 1),
          },
          updatedAt: serverTimestamp(),
        });
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `savedBlessings/${saveId}`);
  }
}

export async function createBlessingRequest(input: {
  sender: UserPublic;
  recipient?: UserPublic | null;
  message: string;
  category: BlessingCategoryId;
  visibility: BlessingVisibility;
}): Promise<string> {
  const cleanMessage = input.message.trim();
  if (!cleanMessage || cleanMessage.length > 400) {
    throw new Error('Request message must be 1–400 characters.');
  }
  if (input.visibility === 'private' && !input.recipient) {
    throw new Error('Please choose a recipient for a private blessing request.');
  }

  const requestId = genId('req');
  try {
    await runTransaction(db, async (tx) => {
      tx.set(doc(db, 'blessingRequests', requestId), {
        requestId,
        senderId: input.sender.uid,
        senderName: input.sender.displayName,
        senderUsername: input.sender.username,
        recipientId: input.visibility === 'private' && input.recipient ? input.recipient.uid : '',
        recipientName:
          input.visibility === 'private' && input.recipient ? input.recipient.displayName : '',
        recipientUsername:
          input.visibility === 'private' && input.recipient ? input.recipient.username : '',
        message: cleanMessage,
        category: input.category,
        visibility: input.visibility,
        status: 'open',
        responseCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (input.visibility === 'private' && input.recipient && input.recipient.uid !== input.sender.uid) {
        const notifId = genId('ntf');
        tx.set(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          userId: input.recipient.uid,
          actorId: input.sender.uid,
          type: 'request_received',
          title: `${input.sender.displayName} requested a blessing`,
          message: cleanMessage.slice(0, 140),
          relatedEntityId: requestId,
          linkPath: '/requests',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    });
    return requestId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `blessingRequests/${requestId}`);
  }
}

export async function updateBlessingRequestStatus(
  requestId: string,
  status: 'fulfilled' | 'closed'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'blessingRequests', requestId), {
      status,
      ...(status === 'fulfilled' ? { fulfilledAt: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `blessingRequests/${requestId}`);
  }
}

export async function fetchPublicFeedBlessings(maxItems = 30): Promise<Blessing[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'blessings'), where('visibility', '==', 'public'), limit(maxItems))
    );
    return snap.docs.map((d) => d.data() as Blessing);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'blessings');
  }
}

export async function fetchUserSavedBlessings(uid: string): Promise<SavedBlessing[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'savedBlessings'), where('userId', '==', uid), limit(100))
    );
    return snap.docs.map((d) => d.data() as SavedBlessing);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'savedBlessings');
  }
}
