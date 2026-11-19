import React, { useEffect, useMemo, useState } from 'react';
import { Globe, HandHeart, Send } from 'lucide-react';
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { BlessingCardView } from '../components/BlessingCardView';
import { useAuth } from '../contexts/AuthContext';
import { getCategoryMeta } from '../data/categories';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import type { Blessing, BlessingRequest } from '../types/ibless';
import { formatRelativeTime, timestampToDate } from '../utils/date';

type FeedFilter = 'all' | 'blessings' | 'requests';

export const PublicFeedPage: React.FC = () => {
  const { blockedUserIds } = useAuth();
  const navigate = useNavigate();

  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [requests, setRequests] = useState<BlessingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    const u1 = onSnapshot(
      query(collection(db, 'blessings'), where('visibility', '==', 'public'), limit(40)),
      (snap) => {
        setBlessings(snap.docs.map((d) => d.data() as Blessing));
        setLoading(false);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'blessings')
    );

    const u2 = onSnapshot(
      query(collection(db, 'blessingRequests'), where('visibility', '==', 'public'), limit(30)),
      (snap) => {
        setRequests(snap.docs.map((d) => d.data() as BlessingRequest));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'blessingRequests')
    );

    return () => {
      u1();
      u2();
    };
  }, []);

  const feedItems = useMemo(() => {
    type Entry =
      | { kind: 'blessing'; time: number; data: Blessing }
      | { kind: 'request'; time: number; data: BlessingRequest };

    const entries: Entry[] = [];
    if (filter === 'all' || filter === 'blessings') {
      for (const b of blessings) {
        if (blockedUserIds.has(b.senderId)) continue;
        entries.push({
          kind: 'blessing',
          time: timestampToDate(b.createdAt)?.getTime() ?? 0,
          data: b,
        });
      }
    }
    if (filter === 'all' || filter === 'requests') {
      for (const r of requests) {
        if (r.status === 'closed' || blockedUserIds.has(r.senderId)) continue;
        entries.push({
          kind: 'request',
          time: timestampToDate(r.createdAt)?.getTime() ?? 0,
          data: r,
        });
      }
    }
    return entries.sort((a, b) => b.time - a.time);
  }, [blessings, requests, filter, blockedUserIds]);

  const displayed = feedItems.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Public Blessing Feed</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Blessings and encouragement requests explicitly shared with the community. Private blessings never appear here.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-200/70 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 self-start">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'blessings', label: 'Blessings' },
              { id: 'requests', label: 'Requests' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === t.id
                  ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-56 rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] animate-pulse"
            />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-12 text-center">
          <Globe className="w-9 h-9 text-stone-400 mx-auto" />
          <p className="mt-3 text-base font-bold">The public bulletin board is quiet.</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Be the first to share a public blessing or post a public request!
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              to="/send"
              className="rounded-xl bg-orange-600 text-white px-4 py-2 text-xs font-semibold"
            >
              Send Public Blessing
            </Link>
            <Link
              to="/requests"
              className="rounded-xl border border-stone-200 dark:border-zinc-700 px-4 py-2 text-xs font-semibold"
            >
              Ask for a Blessing
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            {displayed.map((item) => {
              if (item.kind === 'blessing') {
                return (
                  <BlessingCardView
                    key={`b_${item.data.blessingId}`}
                    blessing={item.data}
                    mode="feed"
                  />
                );
              }
              const req = item.data;
              const cat = getCategoryMeta(req.category);
              return (
                <article
                  key={`r_${req.requestId}`}
                  className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 sm:p-7 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
                      <span className="inline-flex items-center gap-1.5 font-medium text-orange-600 dark:text-orange-400">
                        <HandHeart className="w-3.5 h-3.5" />
                        Blessing Request
                      </span>
                      <span className="font-mono">
                        {cat.emoji} {cat.name} · {formatRelativeTime(req.createdAt)}
                      </span>
                    </div>

                    <blockquote className="mt-4 font-display text-lg font-semibold leading-relaxed text-stone-900 dark:text-stone-100">
                      “{req.message}”
                    </blockquote>
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                    <div className="text-xs text-stone-500">
                      Requested by{' '}
                      <Link
                        to={`/u/${req.senderUsername}`}
                        className="font-semibold text-stone-900 dark:text-stone-100 hover:underline"
                      >
                        {req.senderName}
                      </Link>
                    </div>
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
                </article>
              );
            })}
          </div>

          {feedItems.length > visibleCount && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 12)}
                className="rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-6 py-2.5 text-sm font-semibold hover:bg-stone-50 dark:hover:bg-zinc-800"
              >
                Load more ({feedItems.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
