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
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType, storage } from '../firebase/config';
import type { BlockRecord, UserPreferences, UserPublic } from '../types/ibless';

export function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24);
}

export function isValidUsernameFormat(username: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(username);
}

const inFlightUserEnsure = new Map<string, Promise<UserPublic>>();

/**
 * Ensures /users/{uid} and /userPrivate/{uid} exist on first sign-in.
 * Deduplicates concurrent calls per UID and awaits an active ID token before writing.
 */
export async function ensureUserDocuments(
  authUser: User,
  opts?: { displayName?: string; username?: string }
): Promise<UserPublic> {
  const existingPromise = inFlightUserEnsure.get(authUser.uid);
  if (existingPromise) {
    const result = await existingPromise;
    if (opts?.username && !result.onboardingComplete) {
      const desired = sanitizeUsername(opts.username);
      if (isValidUsernameFormat(desired) && result.username !== desired) {
        try {
          await completeOnboardingOrUpdateUsername(authUser.uid, {
            displayName: opts.displayName || result.displayName,
            username: desired,
            onboardingComplete: true,
          });
          const refreshed = await getUserById(authUser.uid);
          if (refreshed) return refreshed;
        } catch {
          // Keep existing profile if desired username was taken
        }
      }
    }
    return result;
  }

  const task = ensureUserDocumentsInternal(authUser, opts).finally(() => {
    inFlightUserEnsure.delete(authUser.uid);
  });
  inFlightUserEnsure.set(authUser.uid, task);
  return task;
}

async function ensureUserDocumentsInternal(
  authUser: User,
  opts?: { displayName?: string; username?: string }
): Promise<UserPublic> {
  const userRef = doc(db, 'users', authUser.uid);
  const privateRef = doc(db, 'userPrivate', authUser.uid);
  let activePath = `users/${authUser.uid}`;
  let activeOp = OperationType.WRITE;

  try {
    // Ensure Firebase Auth ID token is minted and attached before Firestore requests
    await authUser.getIdToken();

    activeOp = OperationType.GET;
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserPublic;
    }

    const fallbackUsername = sanitizeUsername(
      opts?.username || `user_${authUser.uid.slice(0, 8)}`
    );
    const chosenUsername = isValidUsernameFormat(fallbackUsername)
      ? fallbackUsername
      : `user_${authUser.uid.slice(0, 8).toLowerCase()}`;

    const displayName =
      (opts?.displayName || authUser.displayName || 'Friendly Sender').trim().slice(0, 50) ||
      'Friendly Sender';

    const email = (authUser.email || `${authUser.uid}@ibless.local`).slice(0, 120);

    const newUser: Omit<UserPublic, 'createdAt' | 'updatedAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      uid: authUser.uid,
      username: chosenUsername,
      displayName,
      photoURL: authUser.photoURL && authUser.photoURL.length <= 50000 ? authUser.photoURL : '',
      bio: '',
      discoverable: true,
      onboardingComplete: Boolean(opts?.username && isValidUsernameFormat(opts.username)),
      currentLevel: 1,
      statistics: {
        sentCount: 0,
        receivedCount: 0,
        acknowledgedCount: 0,
        savedCount: 0,
        connectionsCount: 0,
      },
      streak: {
        current: 0,
        longest: 0,
        lastActiveDate: '',
      },
      preferences: {
        defaultVisibility: 'private',
        allowRequestsFromAnyone: true,
        browserNotifications: false,
        theme: 'light',
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    activeOp = OperationType.WRITE;
    await runTransaction(db, async (tx) => {
      const [existingUserSnap, existingPrivateSnap, primaryUsernameSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(privateRef),
        tx.get(doc(db, 'usernames', chosenUsername)),
      ]);
      if (existingUserSnap.exists()) return;

      let finalUsername = chosenUsername;
      let shouldCreateUsernameDoc = !primaryUsernameSnap.exists();

      if (primaryUsernameSnap.exists() && primaryUsernameSnap.data().uid !== authUser.uid) {
        finalUsername = `blesser_${authUser.uid.slice(0, 6).toLowerCase()}`;
        const altSnap = await tx.get(doc(db, 'usernames', finalUsername));
        shouldCreateUsernameDoc = !altSnap.exists();
        if (altSnap.exists() && altSnap.data().uid !== authUser.uid) {
          finalUsername = `bl_${authUser.uid.slice(0, 10).toLowerCase()}_${Math.random()
            .toString(36)
            .slice(2, 6)}`;
          const thirdSnap = await tx.get(doc(db, 'usernames', finalUsername));
          shouldCreateUsernameDoc = !thirdSnap.exists();
        }
      }

      if (shouldCreateUsernameDoc) {
        activePath = `usernames/${finalUsername}`;
        tx.set(doc(db, 'usernames', finalUsername), {
          uid: authUser.uid,
          username: finalUsername,
          createdAt: serverTimestamp(),
        });
      }

      activePath = `users/${authUser.uid}`;
      tx.set(userRef, { ...newUser, username: finalUsername });

      if (!existingPrivateSnap.exists()) {
        activePath = `userPrivate/${authUser.uid}`;
        tx.set(privateRef, {
          uid: authUser.uid,
          email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });

    activeOp = OperationType.GET;
    activePath = `users/${authUser.uid}`;
    const created = await getDoc(userRef);
    return created.data() as UserPublic;
  } catch (error) {
    handleFirestoreError(error, activeOp, activePath);
  }
}

export async function isUsernameAvailable(username: string, currentUid?: string): Promise<boolean> {
  const clean = sanitizeUsername(username);
  if (!isValidUsernameFormat(clean)) return false;
  try {
    const snap = await getDoc(doc(db, 'usernames', clean));
    if (!snap.exists()) return true;
    return snap.data().uid === currentUid;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usernames/${clean}`);
  }
}

export async function completeOnboardingOrUpdateUsername(
  uid: string,
  payload: {
    displayName: string;
    username: string;
    bio?: string;
    photoURL?: string;
    onboardingComplete?: boolean;
  }
): Promise<void> {
  const cleanUsername = sanitizeUsername(payload.username);
  if (!isValidUsernameFormat(cleanUsername)) {
    throw new Error('Username must be 3–24 characters using lowercase letters, numbers, or underscores.');
  }
  const cleanDisplayName = payload.displayName.trim().slice(0, 50);
  if (!cleanDisplayName) {
    throw new Error('Display name is required.');
  }

  try {
    await runTransaction(db, async (tx) => {
      const userRef = doc(db, 'users', uid);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists()) throw new Error('User profile not found.');
      const currentData = userSnap.data() as UserPublic;
      const oldUsername = currentData.username;

      if (cleanUsername !== oldUsername) {
        const newUsernameRef = doc(db, 'usernames', cleanUsername);
        const newUsernameSnap = await tx.get(newUsernameRef);
        if (newUsernameSnap.exists() && newUsernameSnap.data().uid !== uid) {
          throw new Error('That username is already taken. Try another one!');
        }
        tx.set(newUsernameRef, {
          uid,
          username: cleanUsername,
          createdAt: serverTimestamp(),
        });
        if (oldUsername) {
          tx.delete(doc(db, 'usernames', oldUsername));
        }
      }

      tx.update(userRef, {
        displayName: cleanDisplayName,
        username: cleanUsername,
        bio: (payload.bio ?? currentData.bio ?? '').slice(0, 280),
        photoURL: (payload.photoURL ?? currentData.photoURL ?? '').slice(0, 50000),
        onboardingComplete: payload.onboardingComplete ?? true,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('taken') || error.message.includes('Username'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function updateUserPreferences(
  uid: string,
  updates: {
    discoverable?: boolean;
    preferences?: Partial<UserPreferences>;
  }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const current = snap.data() as UserPublic;

    await updateDoc(userRef, {
      discoverable: updates.discoverable ?? current.discoverable,
      preferences: {
        ...current.preferences,
        ...(updates.preferences ?? {}),
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function getUserById(uid: string): Promise<UserPublic | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserPublic) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function getUserByUsername(username: string): Promise<UserPublic | null> {
  const clean = sanitizeUsername(username);
  if (!isValidUsernameFormat(clean)) return null;
  try {
    const regSnap = await getDoc(doc(db, 'usernames', clean));
    if (!regSnap.exists()) return null;
    const targetUid = regSnap.data().uid as string;
    return await getUserById(targetUid);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usernames/${clean}`);
  }
}

export async function searchDiscoverableUsers(
  searchTerm: string,
  excludeUid: string
): Promise<UserPublic[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'users'), where('discoverable', '==', true), limit(50))
    );
    const q = searchTerm.trim().toLowerCase();
    const users = snap.docs
      .map((d) => d.data() as UserPublic)
      .filter((u) => u.uid !== excludeUid);

    if (!q) return users.slice(0, 20);

    return users
      .filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q)
      )
      .slice(0, 20);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

async function compressImageToDataUrl(file: File, maxSize = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Attempts Firebase Storage upload for profile avatars; if Storage bucket
 * is not enabled or unreachable, falls back cleanly to a compact compressed
 * JPEG data URL (< 25 KB) stored in the profile.
 */
export async function uploadProfileAvatar(uid: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a PNG, JPEG, or WebP image.');
  }
  const compressedDataUrl = await compressImageToDataUrl(file, 192);
  try {
    const res = await fetch(compressedDataUrl);
    const blob = await res.blob();
    const storageRef = ref(storage, `avatars/${uid}/avatar_${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    return await getDownloadURL(storageRef);
  } catch {
    if (compressedDataUrl.length <= 48000) {
      return compressedDataUrl;
    }
    return await compressImageToDataUrl(file, 128);
  }
}

export async function blockUser(
  blockerId: string,
  blockedUser: { uid: string; username: string }
): Promise<void> {
  const blockId = `${blockerId}_${blockedUser.uid}`;
  try {
    await setDoc(doc(db, 'blocks', blockId), {
      blockId,
      blockerId,
      blockedId: blockedUser.uid,
      blockedUsername: blockedUser.username,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `blocks/${blockId}`);
  }
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  const blockId = `${blockerId}_${blockedId}`;
  try {
    await deleteDoc(doc(db, 'blocks', blockId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `blocks/${blockId}`);
  }
}

export async function getBlockedUsers(blockerId: string): Promise<BlockRecord[]> {
  try {
    const snap = await getDocs(
      query(collection(db, 'blocks'), where('blockerId', '==', blockerId), limit(100))
    );
    return snap.docs.map((d) => d.data() as BlockRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'blocks');
  }
}
