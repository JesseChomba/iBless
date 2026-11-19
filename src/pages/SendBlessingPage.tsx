import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Lock,
  Search,
  Send,
  Sparkles,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { BlessingPreviewCard } from '../components/BlessingCardView';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { CARD_STYLES } from '../data/cardStyles';
import { BLESSING_CATEGORIES, getCategoryMeta } from '../data/categories';
import { sendBlessing } from '../services/blessingService';
import {
  getUserByUsername,
  sanitizeUsername,
  searchDiscoverableUsers,
} from '../services/userService';
import type {
  BlessingCategoryId,
  BlessingVisibility,
  CardStyleId,
  UserPublic,
} from '../types/ibless';
import { fireBlessingConfetti } from '../utils/confetti';

export const SendBlessingPage: React.FC = () => {
  const { profile, connections, blockedUserIds } = useAuth();
  const { pushToast } = useToast();
  const [searchParams] = useSearchParams();

  const preselectedUsername = searchParams.get('to') || '';
  const requestIdParam = searchParams.get('requestId') || '';

  const [searchTerm, setSearchTerm] = useState(preselectedUsername);
  const [searchResults, setSearchResults] = useState<UserPublic[]>([]);
  const [recipient, setRecipient] = useState<UserPublic | null>(null);
  const [searching, setSearching] = useState(false);

  const [category, setCategory] = useState<BlessingCategoryId>('general_goodwill');
  const [templateId, setTemplateId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [cardStyle, setCardStyle] = useState<CardStyleId>('sunbeam');
  const [visibility, setVisibility] = useState<BlessingVisibility>(
    profile?.preferences.defaultVisibility || 'private'
  );

  const [sending, setSending] = useState(false);
  const [dispatchedId, setDispatchedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Resolve ?to=username automatically
  useEffect(() => {
    if (!preselectedUsername || !profile) return;
    getUserByUsername(preselectedUsername)
      .then((u) => {
        if (u) setRecipient(u);
      })
      .catch(() => {});
  }, [preselectedUsername, profile]);

  // Friend quick picks from accepted connections
  const friendIds = useMemo(() => {
    if (!profile) return [];
    return connections
      .filter((c) => c.status === 'accepted')
      .map((c) => ({
        uid: c.requesterId === profile.uid ? c.recipientId : c.requesterId,
        name: c.requesterId === profile.uid ? c.recipientName : c.requesterName,
        username:
          c.requesterId === profile.uid ? c.recipientUsername : c.requesterUsername,
      }));
  }, [connections, profile]);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const list = await searchDiscoverableUsers(searchTerm, profile.uid);
        if (active) {
          setSearchResults(list.filter((u) => !blockedUserIds.has(u.uid)));
        }
      } catch {
        // Ignore transient search error
      } finally {
        if (active) setSearching(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm, profile, blockedUserIds]);

  const handleSelectFriendQuick = async (username: string) => {
    const user = await getUserByUsername(username);
    if (user) {
      setRecipient(user);
      setError('');
    }
  };

  const activeCategoryMeta = getCategoryMeta(category);

  const handleApplyTemplate = (id: string, text: string) => {
    setTemplateId(id);
    setMessage(text);
    setError('');
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    if (!recipient) {
      setError('Please select a recipient first.');
      return;
    }
    if (blockedUserIds.has(recipient.uid)) {
      setError('You have blocked this user. Unblock them in Settings to send blessings.');
      return;
    }
    if (!message.trim()) {
      setError('Write a blessing message or pick a template above.');
      return;
    }

    setSending(true);
    try {
      const res = await sendBlessing({
        sender: profile,
        recipient,
        message,
        category,
        templateId: templateId || undefined,
        cardStyle,
        visibility,
        requestId: requestIdParam || undefined,
      });

      setDispatchedId(res.blessingId);
      fireBlessingConfetti('celebrate');
      pushToast({
        title: 'Blessing successfully dispatched!',
        description: `Delivered to ${recipient.displayName} (@${recipient.username}).`,
        tone: 'success',
      });
      for (const ach of res.gamification.newlyUnlocked) {
        pushToast({
          title: `Achievement unlocked: ${ach.name}`,
          description: `${ach.icon} Added to your achievements.`,
          tone: 'celebrate',
        });
      }
      if (res.gamification.leveledUpTo) {
        pushToast({
          title: `Promoted to ${res.gamification.leveledUpTo.title}!`,
          description: `Congratulations! Level ${res.gamification.leveledUpTo.level} reached.`,
          tone: 'celebrate',
        });
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes('permission')
          ? 'Could not dispatch blessing—this recipient may have blocked incoming messages.'
          : err instanceof Error
          ? err.message
          : 'Failed to dispatch blessing.';
      setError(msg);
      pushToast({ title: 'Dispatch failed', description: msg, tone: 'error' });
    } finally {
      setSending(false);
    }
  };

  if (!profile) return null;

  if (dispatchedId) {
    return (
      <div className="max-w-xl mx-auto py-8 space-y-6 text-center">
        <div className="rounded-3xl border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-[#161920] p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">
            Blessing successfully dispatched!
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Your goodwill card has landed in <strong>{recipient?.displayName}</strong>’s inbox.
          </p>

          <div className="mt-6 text-left">
            <BlessingPreviewCard
              message={message}
              senderName={profile.displayName}
              senderUsername={profile.username}
              recipientName={recipient?.displayName || ''}
              category={category}
              cardStyle={cardStyle}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setDispatchedId(null);
                setMessage('');
                setTemplateId('');
              }}
              className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 text-sm font-semibold"
            >
              Send Another Blessing
            </button>
            <Link
              to="/archive"
              className="rounded-xl border border-stone-200 dark:border-zinc-700 px-5 py-2.5 text-sm font-semibold"
            >
              View Sent History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      <form onSubmit={handleDispatch} className="lg:col-span-7 space-y-6">
        {requestIdParam && (
          <div className="rounded-2xl border border-orange-200 dark:border-orange-900 bg-orange-50/70 dark:bg-orange-950/30 px-4 py-3 text-xs text-orange-900 dark:text-orange-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Responding directly to a blessing request.</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs text-rose-800 dark:text-rose-200"
          >
            {error}
          </div>
        )}

        {/* Step 1: Recipient */}
        <section className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">1. Choose a recipient</h2>
            {recipient && (
              <button
                type="button"
                onClick={() => setRecipient(null)}
                className="text-xs font-medium text-orange-600 hover:underline"
              >
                Change
              </button>
            )}
          </div>

          {recipient ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={recipient.photoURL} name={recipient.displayName} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{recipient.displayName}</p>
                  <p className="text-xs font-mono text-stone-500 truncate">
                    @{recipient.username}
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by @username or display name..."
                  className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {friendIds.length > 0 && (
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">
                    Your connections:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {friendIds.map((f) => (
                      <button
                        key={f.uid}
                        type="button"
                        onClick={() => handleSelectFriendQuick(f.username)}
                        className="rounded-xl border border-stone-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/30 transition-colors"
                      >
                        {f.name} (@{f.username})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="divide-y divide-stone-100 dark:divide-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-2xl max-h-56 overflow-y-auto">
                {searching ? (
                  <p className="p-4 text-xs text-stone-500">Searching registry...</p>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-xs text-stone-500 flex items-center justify-between gap-2">
                    <span>No matching users found.</span>
                    {sanitizeUsername(searchTerm).length >= 3 && (
                      <button
                        type="button"
                        onClick={() => handleSelectFriendQuick(sanitizeUsername(searchTerm))}
                        className="text-orange-600 font-semibold hover:underline"
                      >
                        Look up @{sanitizeUsername(searchTerm)} directly
                      </button>
                    )}
                  </div>
                ) : (
                  searchResults.map((u) => (
                    <button
                      key={u.uid}
                      type="button"
                      onClick={() => {
                        setRecipient(u);
                        setError('');
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-zinc-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={u.photoURL} name={u.displayName} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{u.displayName}</p>
                          <p className="text-xs font-mono text-stone-500 truncate">
                            @{u.username}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                        Select
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </section>

        {/* Step 2: Category & Optional Template */}
        <section className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 space-y-4">
          <h2 className="font-display text-lg font-bold">
            2. Category & starter templates
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BLESSING_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.id);
                  setTemplateId('');
                }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors min-h-[42px] ${
                  category === cat.id
                    ? 'border-orange-600 bg-orange-50 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100 font-semibold'
                    : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                <span className="text-base shrink-0">{cat.emoji}</span>
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            {activeCategoryMeta.description}
          </p>

          {activeCategoryMeta.templates.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Optional templates (click to pre-fill, then customise):
              </p>
              <div className="grid sm:grid-cols-3 gap-2">
                {activeCategoryMeta.templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl.id, tpl.text)}
                    className={`rounded-xl border p-3 text-left text-xs transition-colors ${
                      templateId === tpl.id
                        ? 'border-orange-600 bg-orange-50/70 dark:bg-orange-950/30'
                        : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <p className="font-semibold text-stone-900 dark:text-stone-100">
                      {tpl.label}
                    </p>
                    <p className="mt-1 text-stone-500 dark:text-stone-400 line-clamp-2">
                      {tpl.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Step 3: Write Message & Card Style & Visibility */}
        <section className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">3. Personalise & send</h2>
            <span className="font-mono text-xs text-stone-500 tabular-nums">
              {message.length} / 600
            </span>
          </div>

          <div>
            <textarea
              rows={4}
              maxLength={600}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your blessing in your own voice, tradition, or inside joke..."
              className="w-full rounded-2xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <p className="text-xs font-semibold mb-2">Card stationery style</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CARD_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setCardStyle(st.id)}
                  className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                    cardStyle === st.id
                      ? 'border-orange-600 ring-1 ring-orange-600'
                      : 'border-stone-200 dark:border-zinc-800'
                  }`}
                  style={{ backgroundColor: st.bgHex, color: st.textHex }}
                >
                  <p className="text-xs font-bold">{st.name}</p>
                  <p className="text-[10px] opacity-75 truncate">{st.tagline}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2">Visibility (Private by default)</p>
            <div className="grid sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  visibility === 'private'
                    ? 'border-orange-600 bg-orange-50/70 dark:bg-orange-950/30'
                    : 'border-stone-200 dark:border-zinc-800'
                }`}
              >
                <Lock className="w-4 h-4 mt-0.5 text-orange-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Private Blessing</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Only visible to you and the recipient.
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  visibility === 'public'
                    ? 'border-orange-600 bg-orange-50/70 dark:bg-orange-950/30'
                    : 'border-stone-200 dark:border-zinc-800'
                }`}
              >
                <Eye className="w-4 h-4 mt-0.5 text-sky-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Public Community Feed</p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Visible in the public blessing feed & shareable via link.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-3.5 text-sm font-semibold transition-colors disabled:opacity-60 min-h-[48px]"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Dispatching blessing...' : 'Dispatch Blessing'}</span>
          </button>
        </section>
      </form>

      {/* Live Preview Sticky Column */}
      <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 font-semibold">
          Live Card Preview
        </h2>
        <BlessingPreviewCard
          message={message}
          senderName={profile.displayName}
          senderUsername={profile.username}
          recipientName={recipient?.displayName || 'Your Recipient'}
          category={category}
          cardStyle={cardStyle}
        />
      </aside>
    </div>
  );
};
