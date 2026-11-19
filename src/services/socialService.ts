import {
  deleteDoc,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import type { AppNotification, Connection, UserPublic } from '../types/ibless';
import { syncGamificationProgress } from './gamificationService';

export function buildConnectionId(uidA: string, uidB: string): string {
  return uidA < uidB ? `${uidA}_${uidB}` : `${uidB}_${uidA}`;
}

export async function sendConnectionRequest(
  requester: UserPublic,
  recipient: UserPublic
): Promise<void> {
  if (requester.uid === recipient.uid) {
    throw new Error('You are already friends with yourself.');
  }
  const connectionId = buildConnectionId(requester.uid, recipient.uid);
  const notifId = `ntf_conn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    await runTransaction(db, async (tx) => {
      const connRef = doc(db, 'connections', connectionId);
      const existing = await tx.get(connRef);
      if (existing.exists()) {
        const data = existing.data() as Connection;
        if (data.status === 'accepted') throw new Error('You are already connected.');
        if (data.status === 'pending') throw new Error('A connection request is already pending.');
        tx.delete(connRef);
      }

      tx.set(connRef, {
        connectionId,
        requesterId: requester.uid,
        recipientId: recipient.uid,
        participants: [requester.uid, recipient.uid],
        requesterName: requester.displayName,
        requesterUsername: requester.username,
        recipientName: recipient.displayName,
        recipientUsername: recipient.username,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      tx.set(doc(db, 'notifications', notifId), {
        notificationId: notifId,
        userId: recipient.uid,
        actorId: requester.uid,
        type: 'connection_request',
        title: `${requester.displayName} sent a friend request`,
        message: `@${requester.username} wants to connect on iBless.`,
        relatedEntityId: connectionId,
        linkPath: '/friends',
        read: false,
        createdAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('already') || error.message.includes('pending'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `connections/${connectionId}`);
  }
}

export async function respondToConnectionRequest(
  connection: Connection,
  responder: UserPublic,
  decision: 'accepted' | 'rejected'
): Promise<void> {
  try {
    let updatedResponder: UserPublic | null = null;
    const notifId = `ntf_acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    await runTransaction(db, async (tx) => {
      const connRef = doc(db, 'connections', connection.connectionId);
      const uRef = doc(db, 'users', responder.uid);
      const [connSnap, uSnap] = await Promise.all([tx.get(connRef), tx.get(uRef)]);
      if (!connSnap.exists()) throw new Error('Connection request not found.');

      tx.update(connRef, {
        status: decision,
        updatedAt: serverTimestamp(),
      });

      if (decision === 'accepted' && uSnap.exists()) {
        const uData = uSnap.data() as UserPublic;
        const nextStats = {
          ...uData.statistics,
          connectionsCount: uData.statistics.connectionsCount + 1,
        };
        tx.update(uRef, {
          statistics: nextStats,
          updatedAt: serverTimestamp(),
        });
        updatedResponder = { ...uData, statistics: nextStats };

        tx.set(doc(db, 'notifications', notifId), {
          notificationId: notifId,
          userId: connection.requesterId,
          actorId: responder.uid,
          type: 'connection_accepted',
          title: `${responder.displayName} accepted your friend request`,
          message: `You and @${responder.username} are now connected on iBless!`,
          relatedEntityId: connection.connectionId,
          linkPath: '/friends',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    });

    if (updatedResponder) {
      await syncGamificationProgress(updatedResponder);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `connections/${connection.connectionId}`);
  }
}

export async function removeOrCancelConnection(connectionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'connections', connectionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `connections/${connectionId}`);
  }
}

export async function syncUserConnectionsCount(
  uid: string,
  acceptedConnectionsCount: number,
  currentCount: number
): Promise<void> {
  if (acceptedConnectionsCount === currentCount) return;
  try {
    const userRef = doc(db, 'users', uid);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) return;
      const u = snap.data() as UserPublic;
      if (u.statistics.connectionsCount === acceptedConnectionsCount) return;
      tx.update(userRef, {
        statistics: {
          ...u.statistics,
          connectionsCount: acceptedConnectionsCount,
        },
        updatedAt: serverTimestamp(),
      });
    });
  } catch {
    // Silent background sync
  }
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notificationId}`);
  }
}

export async function markAllNotificationsRead(notifications: AppNotification[]): Promise<void> {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return;
  try {
    const batch = writeBatch(db);
    for (const n of unread.slice(0, 50)) {
      batch.update(doc(db, 'notifications', n.notificationId), { read: true });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications');
  }
}

export function canUseBrowserNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!canUseBrowserNotifications()) return 'unsupported';
  try {
    return await window.Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function showLocalBrowserNotification(title: string, body: string): void {
  if (!canUseBrowserNotifications()) return;
  if (window.Notification.permission !== 'granted') return;
  try {
    new window.Notification(title, {
      body,
      icon: '/pwa-192x192.png',
    });
  } catch {
    // Ignore on mobile browsers requiring SW registration
  }
}
