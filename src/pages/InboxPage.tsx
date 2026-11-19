import React, { useEffect, useMemo, useState } from 'react';
import { Inbox, Search, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlessingCardView } from '../components/BlessingCardView';
import { useAuth } from '../contexts/AuthContext';
import { BLESSING_CATEGORIES } from '../data/categories';
import { markBlessingAsRead } from '../services/blessingService';

type InboxFilter = 'all' | 'unread' | 'read' | 'acknowledged' | 'saved';

export const InboxPage: React.FC = () => {
  const { profile, receivedBlessings, savedBlessings } = useAuth();
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Mark unread blessings as read when viewed in Inbox
  useEffect(() => {
    if (!profile) return;
    const unread = receivedBlessings.filter(
      (b) => b.status === 'dispatched' || b.status === 'delivered'
    );
    for (const b of unread.slice(0, 5)) {
      markBlessingAsRead(b, profile.uid).catch(() => {});
    }
  }, [receivedBlessings, profile]);

  const savedIds = useMemo(
    () => new Set(savedBlessings.map((s) => s.blessingId)),
    [savedBlessings]
  );

  const filtered = useMemo(() => {
    return receivedBlessings.filter((b) => {
      if (filter === 'unread' && b.status !== 'dispatched' && b.status !== 'delivered') {
        return false;
      }
      if (filter === 'read' && b.status !== 'read') return false;
      if (filter === 'acknowledged' && b.status !== 'acknowledged') return false;
      if (filter === 'saved' && !savedIds.has(b.blessingId)) return false;
      if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          b.message.toLowerCase().includes(q) ||
          b.senderName.toLowerCase().includes(q) ||
          b.senderUsername.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [receivedBlessings, filter, categoryFilter, search, savedIds]);

  const filterTabs: Array<{ id: InboxFilter; label: string }> = [
    { id: 'all', label: `All (${receivedBlessings.length})` },
    {
      id: 'unread',
      label: `Unread (${
        receivedBlessings.filter(
          (b) => b.status === 'dispatched' || b.status === 'delivered'
        ).length
      })`,
    },
    {
      id: 'read',
      label: `Read (${receivedBlessings.filter((b) => b.status === 'read').length})`,
    },
    {
      id: 'acknowledged',
      label: `Acknowledged (${
        receivedBlessings.filter((b) => b.status === 'acknowledged').length
      })`,
    },
    { id: 'saved', label: `Saved (${savedIds.size})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Your Blessing Inbox</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Open, acknowledge, save, download, or send a blessing right back.
          </p>
        </div>

        <Link
          to="/send"
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 text-sm font-semibold whitespace-nowrap self-start"
        >
          <Send className="w-4 h-4" />
          Send a Blessing
        </Link>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-200/70 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                filter === tab.id
                  ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inbox..."
              className="w-full rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All categories</option>
            {BLESSING_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-12 text-center">
          <Inbox className="w-9 h-9 text-stone-400 mx-auto" />
          <p className="mt-3 text-base font-bold text-stone-900 dark:text-stone-100">
            The heavens are currently quiet here.
          </p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            No blessings match this filter yet. Try requesting one or cheering up a friend first!
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {filtered.map((blessing) => (
            <BlessingCardView
              key={blessing.blessingId}
              blessing={blessing}
              mode="inbox"
            />
          ))}
        </div>
      )}
    </div>
  );
};
