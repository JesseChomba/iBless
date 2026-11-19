import React, { useEffect, useState } from 'react';
import {
  Copy,
  QrCode,
  Send,
  Settings,
  ShieldBan,
  UserPlus,
  X,
} from 'lucide-react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { BlessingCardView } from '../components/BlessingCardView';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { BLESSING_LEVELS } from '../data/gamification';
import { db } from '../firebase/config';
import { sendConnectionRequest } from '../services/socialService';
import { blockUser, getUserByUsername } from '../services/userService';
import type { Blessing, UserPublic } from '../types/ibless';
import { copyTextToClipboard } from '../utils/cardExporter';
import { formatBlessingDate, timestampToDate } from '../utils/date';

export const ProfilePage: React.FC = () => {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const { profile: ownProfile, connections, blockedUserIds, sentBlessings } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [viewedUser, setViewedUser] = useState<UserPublic | null>(null);
  const [publicBlessings, setPublicBlessings] = useState<Blessing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);

  const isOwnProfile =
    !paramUsername || paramUsername.toLowerCase() === ownProfile?.username;

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        if (isOwnProfile) {
          setViewedUser(ownProfile);
          setPublicBlessings(sentBlessings.filter((b) => b.visibility === 'public'));
        } else if (paramUsername) {
          const target = await getUserByUsername(paramUsername);
          if (!active) return;
          setViewedUser(target);
          if (target) {
            const snap = await getDocs(
              query(
                collection(db, 'blessings'),
                where('visibility', '==', 'public'),
                limit(50)
              )
            );
            const list = snap.docs
              .map((d) => d.data() as Blessing)
              .filter((b) => b.senderId === target.uid)
              .sort(
                (a, b) =>
                  (timestampToDate(b.createdAt)?.getTime() ?? 0) -
                  (timestampToDate(a.createdAt)?.getTime() ?? 0)
              );
            if (active) setPublicBlessings(list);
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [isOwnProfile, paramUsername, ownProfile, sentBlessings]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-12 text-center text-sm text-stone-500">
        Loading profile...
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-12 text-center">
        <h2 className="font-display text-xl font-bold">Profile not found</h2>
        <p className="mt-2 text-sm text-stone-500">
          No member with handle @{paramUsername} was found.
        </p>
        <Link
          to="/friends"
          className="mt-5 inline-flex rounded-xl bg-orange-600 text-white px-5 py-2.5 text-sm font-semibold"
        >
          Browse Users
        </Link>
      </div>
    );
  }

  const levelDef =
    BLESSING_LEVELS.find((l) => l.level === viewedUser.currentLevel) ??
    BLESSING_LEVELS[0];
  const profileUrl = `${window.location.origin}/u/${viewedUser.username}`;
  const isBlocked = blockedUserIds.has(viewedUser.uid);

  const existingConn = connections.find(
    (c) =>
      c.participants.includes(viewedUser.uid) &&
      ownProfile &&
      c.participants.includes(ownProfile.uid)
  );

  const handleConnect = async () => {
    if (!ownProfile) return;
    try {
      await sendConnectionRequest(ownProfile, viewedUser);
      pushToast({ title: `Friend request sent to @${viewedUser.username}`, tone: 'success' });
    } catch (err) {
      pushToast({
        title: 'Could not connect',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    }
  };

  const handleBlock = async () => {
    if (!ownProfile) return;
    await blockUser(ownProfile.uid, {
      uid: viewedUser.uid,
      username: viewedUser.username,
    });
    pushToast({ title: `Blocked @${viewedUser.username}`, tone: 'success' });
  };

  return (
    <div className="space-y-8">
      {/* Profile Header Card */}
      <section className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <Avatar
              src={viewedUser.photoURL}
              name={viewedUser.displayName}
              size="xl"
            />
            <div>
              <p className="text-xs font-mono text-orange-600 dark:text-orange-400 font-semibold">
                {levelDef.badgeEmoji} {levelDef.title}
              </p>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold">
                {viewedUser.displayName}
              </h2>
              <p className="text-sm font-mono text-stone-500 dark:text-stone-400">
                @{viewedUser.username} · Joined {formatBlessingDate(viewedUser.createdAt)}
              </p>
              {viewedUser.bio && (
                <p className="mt-3 text-sm text-stone-700 dark:text-stone-300 max-w-xl leading-relaxed">
                  {viewedUser.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={async () => {
                await copyTextToClipboard(profileUrl);
                pushToast({ title: 'Profile URL copied!', tone: 'success' });
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-zinc-800"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Link
            </button>
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-zinc-800"
            >
              <QrCode className="w-3.5 h-3.5" />
              QR
            </button>

            {isOwnProfile ? (
              <Link
                to="/settings"
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-4 py-2 text-xs font-semibold"
              >
                <Settings className="w-3.5 h-3.5" />
                Edit Profile
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isBlocked}
                  onClick={() => navigate(`/send?to=${viewedUser.username}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Blessing
                </button>
                {!existingConn && !isBlocked && (
                  <button
                    type="button"
                    onClick={handleConnect}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-orange-600" />
                    Connect
                  </button>
                )}
                {!isBlocked && (
                  <button
                    type="button"
                    onClick={handleBlock}
                    title="Block user"
                    className="p-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-500 hover:text-rose-600"
                  >
                    <ShieldBan className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Public Stats Strip */}
        <div className="mt-6 pt-6 border-t border-stone-100 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-stone-500">Blessings Sent</p>
            <p className="font-display text-2xl font-bold tabular-nums mt-0.5">
              {viewedUser.statistics.sentCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Blessings Received</p>
            <p className="font-display text-2xl font-bold tabular-nums mt-0.5">
              {viewedUser.statistics.receivedCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Best Streak</p>
            <p className="font-display text-2xl font-bold tabular-nums mt-0.5">
              {viewedUser.streak.longest}d
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Connections</p>
            <p className="font-display text-2xl font-bold tabular-nums mt-0.5">
              {viewedUser.statistics.connectionsCount}
            </p>
          </div>
        </div>
      </section>

      {/* Publicly Shared Blessings */}
      <section className="space-y-4">
        <h3 className="font-display text-xl font-bold">
          Public Blessings Shared by {viewedUser.displayName} ({publicBlessings.length})
        </h3>
        {publicBlessings.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-8 text-center text-sm text-stone-500">
            No public blessings shared yet. Private blessings stay strictly between sender and recipient.
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {publicBlessings.map((b) => (
              <BlessingCardView key={b.blessingId} blessing={b} mode="feed" />
            ))}
          </div>
        )}
      </section>

      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-7 text-center shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Shareable Profile QR</h3>
              <button
                type="button"
                onClick={() => setShowQr(false)}
                className="p-1.5 rounded-lg text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="inline-block p-4 rounded-2xl bg-white border border-stone-200">
              <QRCodeSVG value={profileUrl} size={184} />
            </div>
            <p className="mt-3 text-xs font-mono text-stone-500">@{viewedUser.username}</p>
          </div>
        </div>
      )}
    </div>
  );
};
