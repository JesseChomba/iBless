import React, { useMemo, useState } from 'react';
import { Archive, Download, Trash2 } from 'lucide-react';
import { BlessingCardView } from '../components/BlessingCardView';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getCardStyleMeta } from '../data/cardStyles';
import { BLESSING_CATEGORIES, getCategoryMeta } from '../data/categories';
import { removeSavedBlessing } from '../services/blessingService';
import { downloadBlessingCardPng } from '../utils/cardExporter';

type ArchiveTab = 'received' | 'sent' | 'saved' | 'public';

export const ArchivePage: React.FC = () => {
  const { profile, receivedBlessings, sentBlessings, savedBlessings } = useAuth();
  const { pushToast } = useToast();

  const [tab, setTab] = useState<ArchiveTab>('received');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const publicShared = useMemo(
    () => sentBlessings.filter((b) => b.visibility === 'public'),
    [sentBlessings]
  );

  const filteredBlessings = useMemo(() => {
    const source =
      tab === 'received'
        ? receivedBlessings
        : tab === 'sent'
        ? sentBlessings
        : tab === 'public'
        ? publicShared
        : [];
    if (categoryFilter === 'all') return source;
    return source.filter((b) => b.category === categoryFilter);
  }, [tab, receivedBlessings, sentBlessings, publicShared, categoryFilter]);

  const filteredSaved = useMemo(() => {
    if (categoryFilter === 'all') return savedBlessings;
    return savedBlessings.filter((s) => s.blessingSnapshot.category === categoryFilter);
  }, [savedBlessings, categoryFilter]);

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Blessing Archive</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Browse your received, sent, saved, and publicly shared blessing history.
          </p>
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter archive by category"
          className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs self-start"
        >
          <option value="all">All categories</option>
          {BLESSING_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-200/70 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 overflow-x-auto w-fit max-w-full">
        {(
          [
            { id: 'received', label: `Received (${receivedBlessings.length})` },
            { id: 'sent', label: `Sent (${sentBlessings.length})` },
            { id: 'saved', label: `Saved (${savedBlessings.length})` },
            { id: 'public', label: `Publicly Shared (${publicShared.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'saved' ? (
        filteredSaved.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-12 text-center">
            <Archive className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="mt-3 text-sm font-semibold">No saved blessings here yet.</p>
            <p className="mt-1 text-xs text-stone-500">
              Click “Save” on any blessing card or today’s Daily Blessing to keep it here.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-5">
            {filteredSaved.map((item) => {
              const snap = item.blessingSnapshot;
              const style = getCardStyleMeta(snap.cardStyle);
              const cat = getCategoryMeta(snap.category);
              return (
                <article
                  key={item.saveId}
                  className="rounded-3xl border p-6 flex flex-col justify-between"
                  style={{
                    backgroundColor: style.bgHex,
                    borderColor: style.borderHex,
                    color: style.textHex,
                  }}
                >
                  <div>
                    <div
                      className="text-xs font-medium flex flex-wrap items-center gap-2"
                      style={{ color: style.mutedHex }}
                    >
                      <span>
                        {cat.emoji} {cat.name}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{snap.createdAtLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {item.sourceType === 'daily' ? 'Daily Blessing' : 'Saved Card'}
                      </span>
                    </div>
                    <blockquote className="mt-4 font-display text-lg font-semibold leading-relaxed">
                      “{snap.message}”
                    </blockquote>
                  </div>

                  <div
                    className="mt-5 pt-4 border-t flex items-center justify-between gap-2 text-xs"
                    style={{ borderColor: style.borderHex }}
                  >
                    <span>
                      From <strong>{snap.senderName}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await downloadBlessingCardPng({
                            message: snap.message,
                            senderName: snap.senderName,
                            recipientName: snap.recipientName,
                            category: snap.category,
                            cardStyle: snap.cardStyle,
                            dateLabel: snap.createdAtLabel,
                          });
                          pushToast({ title: 'Saved card downloaded as PNG', tone: 'success' });
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 font-medium"
                        style={{ borderColor: style.borderHex }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        PNG
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await removeSavedBlessing(profile.uid, item.saveId);
                          pushToast({ title: 'Removed from saved', tone: 'success' });
                        }}
                        aria-label="Remove saved blessing"
                        className="p-2 rounded-xl border hover:opacity-80"
                        style={{ borderColor: style.borderHex }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : filteredBlessings.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-12 text-center">
          <Archive className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="mt-3 text-sm font-semibold">No blessings in this view yet.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredBlessings.map((b) => (
            <BlessingCardView
              key={b.blessingId}
              blessing={b}
              mode={tab === 'sent' || tab === 'public' ? 'sent' : 'inbox'}
            />
          ))}
        </div>
      )}
    </div>
  );
};
