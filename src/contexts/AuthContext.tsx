import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import { ensureUserDocuments } from '../services/userService';
import { syncUncountedReceivedBlessings } from '../services/blessingService';
import {
  showLocalBrowserNotification,
  syncUserConnectionsCount,
} from '../services/socialService';
import type {
  AppNotification,
  Blessing,
  BlockRecord,
  Connection,
  SavedBlessing,
  UserAchievement,
  UserPublic,
} from '../types/ibless';
import { timestampToDate } from '../utils/date';
import { useTheme } from './ThemeContext';

interface AuthContextValue {
  authUser: User | null;
  profile: UserPublic | null;
  loading: boolean;
  receivedBlessings: Blessing[];
  sentBlessings: Blessing[];
  savedBlessings: SavedBlessing[];
  connections: Connection[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  userAchievements: UserAchievement[];
  blockedRecords: BlockRecord[];
  blockedUserIds: Set<string>;
  registerWithEmail: (params: {
    email: string;
    password: string;
    displayName: string;
    username: string;
  }) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function sortByTimestampDesc<T>(items: T[], getTs: (item: T) => unknown): T[] {
  return [...items].sort((a, b) => {
    const da = timestampToDate(getTs(a) as never)?.getTime() ?? 0;
    const dbTime = timestampToDate(getTs(b) as never)?.getTime() ?? 0;
    return dbTime - da;
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setTheme } = useTheme();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const [receivedBlessings, setReceivedBlessings] = useState<Blessing[]>([]);
  const [sentBlessings, setSentBlessings] = useState<Blessing[]>([]);
  const [savedBlessings, setSavedBlessings] = useState<SavedBlessing[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [blockedRecords, setBlockedRecords] = useState<BlockRecord[]>([]);

  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const initialNotifLoadRef = useRef(true);
  const pendingRegistrationRef = useRef<{
    email: string;
    displayName: string;
    username: string;
  } | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) {
        setProfile(null);
        setReceivedBlessings([]);
        setSentBlessings([]);
        setSavedBlessings([]);
        setConnections([]);
        setNotifications([]);
        setUserAchievements([]);
        setBlockedRecords([]);
        initialNotifLoadRef.current = true;
        seenNotifIdsRef.current.clear();
        setLoading(false);
        return;
      }
      try {
        const pending = pendingRegistrationRef.current;
        const regOpts =
          pending && (user.email || '').toLowerCase() === pending.email
            ? { displayName: pending.displayName, username: pending.username }
            : undefined;
        const ensured = await ensureUserDocuments(user, regOpts);
        setProfile(ensured);
      } catch (err) {
        console.error('Failed to ensure user profile:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Attach real-time Firestore listeners ONLY when authenticated
  useEffect(() => {
    if (!authUser) return;
    const uid = authUser.uid;

    const unsubProfile = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserPublic;
          setProfile(data);
          if (data.preferences?.theme) {
            setTheme(data.preferences.theme);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    const unsubReceived = onSnapshot(
      query(collection(db, 'blessings'), where('recipientId', '==', uid), limit(100)),
      (snap) => {
        const list = sortByTimestampDesc(
          snap.docs.map((d) => d.data() as Blessing),
          (b) => b.createdAt
        );
        setReceivedBlessings(list);
        syncUncountedReceivedBlessings(uid, list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'blessings')
    );

    const unsubSent = onSnapshot(
      query(collection(db, 'blessings'), where('senderId', '==', uid), limit(100)),
      (snap) => {
        setSentBlessings(
          sortByTimestampDesc(
            snap.docs.map((d) => d.data() as Blessing),
            (b) => b.createdAt
          )
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'blessings')
    );

    const unsubSaved = onSnapshot(
      query(collection(db, 'savedBlessings'), where('userId', '==', uid), limit(100)),
      (snap) => {
        setSavedBlessings(
          sortByTimestampDesc(
            snap.docs.map((d) => d.data() as SavedBlessing),
            (s) => s.savedAt
          )
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'savedBlessings')
    );

    const unsubConns = onSnapshot(
      query(collection(db, 'connections'), where('participants', 'array-contains', uid), limit(100)),
      (snap) => {
        const list = sortByTimestampDesc(
          snap.docs.map((d) => d.data() as Connection),
          (c) => c.updatedAt
        );
        setConnections(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'connections')
    );

    const unsubNotifs = onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', uid), limit(50)),
      (snap) => {
        const list = sortByTimestampDesc(
          snap.docs.map((d) => d.data() as AppNotification),
          (n) => n.createdAt
        );
        if (!initialNotifLoadRef.current) {
          for (const n of list) {
            if (!n.read && !seenNotifIdsRef.current.has(n.notificationId)) {
              showLocalBrowserNotification(n.title, n.message);
            }
          }
        }
        initialNotifLoadRef.current = false;
        list.forEach((n) => seenNotifIdsRef.current.add(n.notificationId));
        setNotifications(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    const unsubAch = onSnapshot(
      query(collection(db, 'userAchievements'), where('userId', '==', uid), limit(50)),
      (snap) => {
        setUserAchievements(
          sortByTimestampDesc(
            snap.docs.map((d) => d.data() as UserAchievement),
            (a) => a.unlockedAt
          )
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'userAchievements')
    );

    const unsubBlocks = onSnapshot(
      query(collection(db, 'blocks'), where('blockerId', '==', uid), limit(100)),
      (snap) => {
        setBlockedRecords(snap.docs.map((d) => d.data() as BlockRecord));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'blocks')
    );

    return () => {
      unsubProfile();
      unsubReceived();
      unsubSent();
      unsubSaved();
      unsubConns();
      unsubNotifs();
      unsubAch();
      unsubBlocks();
    };
  }, [authUser, setTheme]);

  // Keep connectionsCount synced when accepted connections change
  useEffect(() => {
    if (!profile) return;
    const acceptedCount = connections.filter((c) => c.status === 'accepted').length;
    if (acceptedCount !== profile.statistics.connectionsCount) {
      syncUserConnectionsCount(profile.uid, acceptedCount, profile.statistics.connectionsCount);
    }
  }, [connections, profile]);

  const registerWithEmail: AuthContextValue['registerWithEmail'] = async ({
    email,
    password,
    displayName,
    username,
  }) => {
    const cleanEmail = email.trim();
    const cleanDisplayName = displayName.trim();
    const cleanUsername = username.trim().toLowerCase();
    pendingRegistrationRef.current = {
      email: cleanEmail.toLowerCase(),
      displayName: cleanDisplayName,
      username: cleanUsername,
    };
    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(cred.user, { displayName: cleanDisplayName });
      const created = await ensureUserDocuments(cred.user, {
        displayName: cleanDisplayName,
        username: cleanUsername,
      });
      setProfile(created);
    } finally {
      pendingRegistrationRef.current = null;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await ensureUserDocuments(cred.user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    await signOut(auth);
  };

  const blockedUserIds = useMemo(
    () => new Set(blockedRecords.map((b) => b.blockedId)),
    [blockedRecords]
  );

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <AuthContext.Provider
      value={{
        authUser,
        profile,
        loading,
        receivedBlessings,
        sentBlessings,
        savedBlessings,
        connections,
        notifications,
        unreadNotificationCount,
        userAchievements,
        blockedRecords,
        blockedUserIds,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
