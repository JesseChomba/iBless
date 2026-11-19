import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Contact2,
  Copy,
  QrCode,
  Search,
  Send,
  ShieldBan,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  removeOrCancelConnection,
  respondToConnectionRequest,
  sendConnectionRequest,
} from '../services/socialService';
import {
  blockUser,
  searchDiscoverableUsers,
} from '../services/userService';
import type { Connection, UserPublic } from '../types/ibless';
import { copyTextToClipboard, shareViaNativeOrFallback } from '../utils/cardExporter';

export const FriendsPage: React.FC = () => {
  const { profile, connections, blockedUserIds } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [queryText, setQueryText] = useState('');
  const [results, setResults] = useState<UserPublic[]>([]);
  const [searching, setSearching] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [contactFallbackNote, setContactFallbackNote] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const list = await searchDiscoverableUsers(queryText, profile.uid);
        if (active) {
          setResults(list.filter((u) => !blockedUserIds.has(u.uid)));
        }
      } finally {
        if (active) setSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [queryText, profile, blockedUserIds]);

  const incomingRequests = useMemo(
    () =>
      connections.filter(
        (c) => c.status === 'pending' && c.recipientId === profile?.uid
      ),
    [connections, profile?.uid]
  );

  const outgoingRequests = useMemo(
    () =>
      connections.filter(
        (c) => c.status === 'pending' && c.requesterId === profile?.uid
      ),
    [connections, profile?.uid]
  );

  const acceptedFriends = useMemo(
    () => connections.filter((c) => c.status === 'accepted'),
    [connections]
  );

  const connectionByOtherUid = useMemo(() => {
    const map = new Map<string, Connection>();
    if (!profile) return map;
    for (const c of connections) {
      const other = c.requesterId === profile.uid ? c.recipientId : c.requesterId;
      map.set(other, c);
    }
    return map;
  }, [connections, profile]);

  if (!profile) return null;

  const profileUrl = `${window.location.origin}/u/${profile.username}`;

  const handleSendRequest = async (target: UserPublic) => {
    try {
      await sendConnectionRequest(profile, target);
      pushToast({
        title: `Connection request sent to @${target.username}`,
        tone: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Could not connect',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    }
  };

  const handleRespond = async (conn: Connection, decision: 'accepted' | 'rejected') => {
    try {
      await respondToConnectionRequest(conn, profile, decision);
      pushToast({
        title:
          decision === 'accepted'
            ? `Connected with @${conn.requesterUsername}!`
            : 'Request declined',
        tone: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Action failed',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    }
  };

  const handleRemove = async (connectionId: string) => {
    try {
      await removeOrCancelConnection(connectionId);
      setConfirmRemoveId(null);
      pushToast({ title: 'Connection updated', tone: 'success' });
    } catch (err) {
      pushToast({
        title: 'Could not remove connection',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    }
  };

  const handleBlock = async (uid: string, username: string, connectionId?: string) => {
    try {
      await blockUser(profile.uid, { uid, username });
      if (connectionId) {
        await removeOrCancelConnection(connectionId);
      }
      pushToast({
        title: `Blocked @${username}`,
        description: 'They can no longer send you blessings or requests.',
        tone: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Block failed',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    }
  };

  const handleContactDiscovery = async () => {
    setContactFallbackNote('');
    const nav = navigator as unknown as {
      contacts?: { select: (props: string[], opts: { multiple: boolean }) => Promise<unknown[]> };
    };
    if (nav.contacts && typeof nav.contacts.select === 'function') {
      try {
        const picked = await nav.contacts.select(['name', 'email'], { multiple: true });
        if (picked.length > 0) {
          await shareViaNativeOrFallback({
            title: 'Join me on iBless!',
            text: `Add me on iBless (@${profile.username}):`,
            url: profileUrl,
          });
        }
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    setContactFallbackNote(
      'Your browser does not support native contact picking. Copy your invite link or share your QR code below to invite friends directly!'
    );
  };

  return (
    <div className="space-y-8">
      {/* Shareable Invite Banner */}
      <section className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h2 className="font-display text-xl font-bold">
            Invite friends to your blessing circle
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Anyone with your username <span className="font-mono">@{profile.username}</span> can send you a blessing—even before connecting.
          </p>
          {contactFallbackNote && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-xl px-3 py-2">
              {contactFallbackNote}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={async () => {
              await copyTextToClipboard(profileUrl);
              pushToast({ title: 'Profile link copied!', tone: 'success' });
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-zinc-800 min-h-[40px]"
          >
            <Copy className="w-3.5 h-3.5 text-orange-600" />
            Copy Link
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-zinc-800 min-h-[40px]"
          >
            <QrCode className="w-3.5 h-3.5 text-orange-600" />
            QR Code
          </button>

          <button
            type="button"
            onClick={handleContactDiscovery}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 dark:border-zinc-700 px-3.5 py-2 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-zinc-800 min-h-[40px]"
          >
            <Contact2 className="w-3.5 h-3.5 text-sky-600" />
            Find Contacts
          </button>
        </div>
      </section>

      {/* Incoming Friend Requests */}
      {incomingRequests.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-lg font-bold">
            Incoming Connection Requests ({incomingRequests.length})
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {incomingRequests.map((req) => (
              <div
                key={req.connectionId}
                className="rounded-2xl border border-orange-200 dark:border-orange-900 bg-white dark:bg-[#161920] p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <Link
                    to={`/u/${req.requesterUsername}`}
                    className="text-sm font-bold hover:underline truncate block"
                  >
                    {req.requesterName}
                  </Link>
                  <p className="text-xs font-mono text-stone-500">
                    @{req.requesterUsername}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRespond(req, 'accepted')}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold min-h-[36px]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespond(req, 'rejected')}
                    className="inline-flex items-center gap-1 rounded-xl border border-stone-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium min-h-[36px]"
                  >
                    <X className="w-3.5 h-3.5" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search Users */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold">Discover Users</h3>
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search by @username or name..."
              className="w-full rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {searching ? (
          <p className="text-sm text-stone-500 py-4">Searching members...</p>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 text-center text-sm text-stone-500">
            No matching discoverable users found. Share your invite link to bring friends aboard!
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((u) => {
              const existingConn = connectionByOtherUid.get(u.uid);
              return (
                <div
                  key={u.uid}
                  className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-5 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar src={u.photoURL} name={u.displayName} size="md" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/u/${u.username}`}
                        className="text-sm font-bold hover:underline truncate block"
                      >
                        {u.displayName}
                      </Link>
                      <p className="text-xs font-mono text-stone-500 truncate">
                        @{u.username}
                      </p>
                      {u.bio && (
                        <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => navigate(`/send?to=${u.username}`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-2 text-xs font-semibold min-h-[38px]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Bless
                    </button>
                    {!existingConn ? (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(u)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 py-2 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-zinc-800 min-h-[38px]"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-orange-600" />
                        Connect
                      </button>
                    ) : existingConn.status === 'accepted' ? (
                      <span className="px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Connected
                      </span>
                    ) : existingConn.status === 'pending' ? (
                      <span className="px-3 py-2 text-xs text-stone-500">Pending</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(u)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 py-2 text-xs font-semibold min-h-[38px]"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Outgoing Requests */}
      {outgoingRequests.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-display text-lg font-bold">
            Pending Sent Requests ({outgoingRequests.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {outgoingRequests.map((req) => (
              <div
                key={req.connectionId}
                className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{req.recipientName}</p>
                  <p className="text-xs font-mono text-stone-500">
                    @{req.recipientUsername}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(req.connectionId)}
                  className="text-xs font-medium text-stone-500 hover:text-rose-600"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Your Friends List */}
      <section className="space-y-4">
        <h3 className="font-display text-lg font-bold">
          Your Connections ({acceptedFriends.length})
        </h3>
        {acceptedFriends.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-8 text-center">
            <Users className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="mt-3 text-sm font-semibold">No connections yet</p>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Search for friends above or share your QR code to build your goodwill circle.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {acceptedFriends.map((conn) => {
              const isRequester = conn.requesterId === profile.uid;
              const friendUid = isRequester ? conn.recipientId : conn.requesterId;
              const friendName = isRequester ? conn.recipientName : conn.requesterName;
              const friendUsername = isRequester
                ? conn.recipientUsername
                : conn.requesterUsername;

              return (
                <div
                  key={conn.connectionId}
                  className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={friendName} size="md" />
                      <div className="min-w-0">
                        <Link
                          to={`/u/${friendUsername}`}
                          className="text-sm font-bold hover:underline truncate block"
                        >
                          {friendName}
                        </Link>
                        <p className="text-xs font-mono text-stone-500">
                          @{friendUsername}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/send?to=${friendUsername}`)}
                        className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 text-xs font-semibold min-h-[36px]"
                      >
                        Bless
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(conn.connectionId)}
                        title="Remove friend"
                        className="p-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-500 hover:text-rose-600"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleBlock(friendUid, friendUsername, conn.connectionId)
                        }
                        title="Block user"
                        className="p-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-stone-500 hover:text-rose-600"
                      >
                        <ShieldBan className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {confirmRemoveId === conn.connectionId && (
                    <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 flex items-center justify-between text-xs">
                      <span>Remove @{friendUsername} from friends?</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(null)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(conn.connectionId)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-7 text-center shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Your Blessing QR Code</h3>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="inline-block p-4 rounded-2xl bg-white border border-stone-200">
              <QRCodeSVG value={profileUrl} size={184} />
            </div>
            <p className="mt-4 text-sm font-semibold">{profile.displayName}</p>
            <p className="text-xs font-mono text-stone-500">@{profile.username}</p>
            <button
              type="button"
              onClick={async () => {
                await copyTextToClipboard(profileUrl);
                pushToast({ title: 'Profile link copied', tone: 'success' });
              }}
              className="mt-5 w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-2.5 text-sm font-semibold"
            >
              Copy Profile Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
