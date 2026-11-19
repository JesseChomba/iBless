import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  HandHeart,
  Lock,
  Send,
  XCircle,
} from 'lucide-react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { BLESSING_CATEGORIES, getCategoryMeta } from '../data/categories';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  createBlessingRequest,
  updateBlessingRequestStatus,
} from '../services/blessingService';
import { searchDiscoverableUsers } from '../services/userService';
import type {
  BlessingCategoryId,
  BlessingRequest,
  BlessingVisibility,
  UserPublic,
} from '../types/ibless';
import { formatRelativeTime, timestampToDate } from '../utils/date';

export const RequestsPage: React.FC = () => {
  const { profile, blockedUserIds } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [incomingReqs, setIncomingReqs] = useState<BlessingRequest[]>([]);
  const [outgoingReqs, setOutgoingReqs] = useState<BlessingRequest[]>([]);
  const [publicReqs, setPublicReqs] = useState<BlessingRequest[]>([]);

  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<BlessingCategoryId>('success');
  const [visibility, setVisibility] = useState<BlessingVisibility>('public');
  const [targetQuery, setTargetQuery] = useState('');
  const [userOptions, setUserOptions] = useState<UserPublic[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<UserPublic | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const uid = profile.uid;

    const u1 = onSnapshot(
      query(collection(db, 'blessingRequests'), where('recipientId', '==', uid), limit(50)),
      (snap) => setIncomingReqs(snap.docs.map((d) => d.data() as BlessingRequest)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'blessingRequests')
    );

    const u2 = onSnapshot(
      query(collection(db, 'blessingRequests'), where('senderId', '==', uid), limit(50)),
      (snap) => setOutgoingReqs(snap.docs.map((d) => d.data() as BlessingRequest)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'blessingRequests')
    );

    const u3 = onSnapshot(
      query(collection(db, 'blessingRequests'), where('visibility', '==', 'public'), limit(40)),
      (snap) => setPublicReqs(snap.docs.map((d) => d.data() as BlessingRequest)),
      (err) => handleFirestoreError(err, OperationType.LIST, 'blessingRequests')
    );

    return () => {
      u1();
      u2();
      u3();
    };
  }, [profile]);

  useEffect(() => {
    if (!profile || visibility !== 'private') return;
    let active = true;
    searchDiscoverableUsers(targetQuery, profile.uid)
      .then((list) => {
        if (active) setUserOptions(list.filter((u) => !blockedUserIds.has(u.uid)));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [targetQuery, visibility, profile, blockedUserIds]);

  const sortDesc = (items: BlessingRequest[]) =>
    [...items].sort(
      (a, b) =>
        (timestampToDate(b.createdAt)?.getTime() ?? 0) -
        (timestampToDate(a.createdAt)?.getTime() ?? 0)
    );

  const sortedIncoming = useMemo(() => sortDesc(incomingReqs), [incomingReqs]);
  const sortedOutgoing = useMemo(() => sortDesc(outgoingReqs), [outgoingReqs]);
  const sortedPublic = useMemo(
    () =>
      sortDesc(
        publicReqs.filter(
          (r) =>
            r.senderId !== profile?.uid &&
            r.status === 'open' &&
            !blockedUserIds.has(r.senderId)
        )
      ),
    [publicReqs, profile?.uid, blockedUserIds]
  );

  if (!profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createBlessingRequest({
        sender: profile,
        recipient: visibility === 'private' ? selectedRecipient : null,
        message,
        category,
        visibility,
      });
      setMessage('');
      setSelectedRecipient(null);
      pushToast({
        title: 'Blessing request posted!',
        description:
          visibility === 'public'
            ? 'Your request is now visible on the community feed.'
            : 'Sent privately to your chosen friend.',
        tone: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Could not create request',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (reqId: string, status: 'fulfilled' | 'closed') => {
    try {
      await updateBlessingRequestStatus(reqId, status);
      pushToast({
        title: status === 'fulfilled' ? 'Request marked fulfilled!' : 'Request closed',
        tone: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Create Request Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 space-y-4"
        >
          <div>
            <h2 className="font-display text-xl font-bold">Request a Blessing</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Exam tomorrow? Big move? Ask a friend privately or rally the public feed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold ${
                visibility === 'public'
                  ? 'border-orange-600 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200'
                  : 'border-stone-200 dark:border-zinc-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Public Feed
            </button>
            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold ${
                visibility === 'private'
                  ? 'border-orange-600 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200'
                  : 'border-stone-200 dark:border-zinc-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Private Friend
            </button>
          </div>

          {visibility === 'private' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold">Select recipient</label>
              {selectedRecipient ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-900 px-3 py-2 text-xs">
                  <span>
                    <strong>{selectedRecipient.displayName}</strong> (@
                    {selectedRecipient.username})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedRecipient(null)}
                    className="text-orange-600 font-semibold"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={targetQuery}
                    onChange={(e) => setTargetQuery(e.target.value)}
                    placeholder="Search @username..."
                    className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs"
                  />
                  <div className="max-h-36 overflow-y-auto divide-y divide-stone-100 dark:divide-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-xl">
                    {userOptions.slice(0, 6).map((u) => (
                      <button
                        key={u.uid}
                        type="button"
                        onClick={() => setSelectedRecipient(u)}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-stone-50 dark:hover:bg-zinc-800 flex justify-between"
                      >
                        <span className="font-semibold">{u.displayName}</span>
                        <span className="font-mono text-stone-500">@{u.username}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BlessingCategoryId)}
              className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs"
            >
              {BLESSING_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <label className="font-semibold">What’s coming up?</label>
              <span className="font-mono text-stone-400">{message.length}/400</span>
            </div>
            <textarea
              rows={3}
              required
              maxLength={400}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="I have an important examination tomorrow morning. Could use a little blessing!"
              className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-3 text-sm font-semibold disabled:opacity-60"
          >
            <HandHeart className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Post Request'}</span>
          </button>
        </form>

        {/* Incoming & Community Open Requests */}
        <div className="lg:col-span-7 space-y-6">
          <section className="space-y-3">
            <h3 className="font-display text-lg font-bold">
              Direct Requests Sent to You ({sortedIncoming.length})
            </h3>
            {sortedIncoming.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 text-sm text-stone-500">
                No private blessing requests addressed to you right now.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedIncoming.map((req) => {
                  const cat = getCategoryMeta(req.category);
                  return (
                    <div
                      key={req.requestId}
                      className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                        <span>
                          {cat.emoji} {cat.name} · from{' '}
                          <Link
                            to={`/u/${req.senderUsername}`}
                            className="font-semibold text-stone-900 dark:text-stone-100 hover:underline"
                          >
                            {req.senderName}
                          </Link>{' '}
                          · {formatRelativeTime(req.createdAt)}
                        </span>
                        <span className="font-mono capitalize">{req.status}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">“{req.message}”</p>
                      {req.status === 'open' && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/send?to=${req.senderUsername}&requestId=${req.requestId}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-xs font-semibold"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Answer with a Blessing
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-lg font-bold">
              Your Outgoing Requests ({sortedOutgoing.length})
            </h3>
            {sortedOutgoing.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 text-sm text-stone-500">
                You haven’t requested any blessings yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedOutgoing.map((req) => {
                  const cat = getCategoryMeta(req.category);
                  return (
                    <div
                      key={req.requestId}
                      className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                        <span>
                          {cat.emoji} {cat.name} ·{' '}
                          {req.visibility === 'public'
                            ? 'Public feed'
                            : `Private to @${req.recipientUsername}`}{' '}
                          · {formatRelativeTime(req.createdAt)}
                        </span>
                        <span className="font-mono tabular-nums">
                          {req.status} · {req.responseCount} response
                          {req.responseCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">“{req.message}”</p>
                      {req.status === 'open' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.requestId, 'fulfilled')}
                            className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Fulfilled
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(req.requestId, 'closed')}
                            className="inline-flex items-center gap-1 rounded-xl border border-stone-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-stone-500"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Close Request
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {sortedPublic.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-display text-lg font-bold">
                Open Community Requests ({sortedPublic.length})
              </h3>
              <div className="space-y-3">
                {sortedPublic.map((req) => {
                  const cat = getCategoryMeta(req.category);
                  return (
                    <div
                      key={req.requestId}
                      className="rounded-2xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span>
                          {cat.emoji} {cat.name} ·{' '}
                          <Link
                            to={`/u/${req.senderUsername}`}
                            className="font-semibold text-stone-900 dark:text-stone-100 hover:underline"
                          >
                            {req.senderName}
                          </Link>{' '}
                          · {formatRelativeTime(req.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">“{req.message}”</p>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/send?to=${req.senderUsername}&requestId=${req.requestId}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-xs font-semibold"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Blessing
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
