import React, { useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Heart,
  Lock,
  MessageCircleHeart,
  Reply,
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCardStyleMeta } from '../data/cardStyles';
import { getCategoryMeta } from '../data/categories';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  acknowledgeBlessing,
  deleteSentBlessing,
  reactToPublicBlessing,
  removeSavedBlessing,
  saveBlessingToCollection,
  updateBlessingVisibility,
} from '../services/blessingService';
import type { Blessing, CardStyleId, ReactionKey } from '../types/ibless';
import {
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  downloadBlessingCardPng,
  shareViaNativeOrFallback,
} from '../utils/cardExporter';
import { fireBlessingConfetti } from '../utils/confetti';
import { formatBlessingDate } from '../utils/date';

const STATUS_LABELS: Record<string, string> = {
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  read: 'Read',
  acknowledged: 'Acknowledged',
};

const REACTION_ITEMS: Array<{ key: ReactionKey; emoji: string; label: string }> = [
  { key: 'heart', emoji: '❤️', label: 'Heart' },
  { key: 'pray', emoji: '🙏', label: 'Appreciate' },
  { key: 'sparkle', emoji: '✨', label: 'Sparkle' },
  { key: 'smile', emoji: '😊', label: 'Smile' },
];

interface BlessingCardViewProps {
  blessing: Blessing;
  mode?: 'inbox' | 'sent' | 'feed' | 'detail';
  onOpened?: () => void;
}

export const BlessingCardView: React.FC<BlessingCardViewProps> = ({
  blessing,
  mode = 'inbox',
  onOpened,
}) => {
  const { profile, savedBlessings } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const style = getCardStyleMeta(blessing.cardStyle);
  const category = getCategoryMeta(blessing.category);
  const dateLabel = formatBlessingDate(blessing.createdAt);

  const isRecipient = profile?.uid === blessing.recipientId;
  const isSender = profile?.uid === blessing.senderId;

  const savedEntry = savedBlessings.find((s) => s.blessingId === blessing.blessingId);
  const isSaved = Boolean(savedEntry);

  const [showAckBox, setShowAckBox] = useState(false);
  const [thankYouText, setThankYouText] = useState('');
  const [busyAck, setBusyAck] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [busyExport, setBusyExport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setBusyAck(true);
    try {
      const res = await acknowledgeBlessing(blessing, profile, thankYouText);
      setShowAckBox(false);
      setThankYouText('');
      fireBlessingConfetti('gentle');
      pushToast({
        title: 'Blessing acknowledged!',
        description: thankYouText
          ? 'Your thank-you note has been dispatched back.'
          : 'Receipt confirmed with gratitude.',
        tone: 'success',
      });
      if (res.newlyUnlocked.length > 0) {
        pushToast({
          title: `Achievement unlocked: ${res.newlyUnlocked[0].name}`,
          description: `${res.newlyUnlocked[0].icon} Added to your trophy shelf.`,
          tone: 'celebrate',
        });
      }
      if (res.leveledUpTo) {
        fireBlessingConfetti('celebrate');
        pushToast({
          title: `Promoted to ${res.leveledUpTo.title}!`,
          description: `Congratulations on reaching Level ${res.leveledUpTo.level}.`,
          tone: 'celebrate',
        });
      }
      onOpened?.();
    } catch (err) {
      pushToast({
        title: 'Could not acknowledge blessing',
        description: err instanceof Error ? err.message : 'Please try again.',
        tone: 'error',
      });
    } finally {
      setBusyAck(false);
    }
  };

  const handleToggleSave = async () => {
    if (!profile || busySave) return;
    setBusySave(true);
    try {
      if (isSaved && savedEntry) {
        await removeSavedBlessing(profile.uid, savedEntry.saveId);
        pushToast({ title: 'Removed from saved blessings', tone: 'success' });
      } else {
        const res = await saveBlessingToCollection(profile, blessing);
        pushToast({ title: 'Saved to your collection', tone: 'success' });
        if (res.newlyUnlocked.length > 0) {
          pushToast({
            title: `Achievement unlocked: ${res.newlyUnlocked[0].name}`,
            tone: 'celebrate',
          });
        }
      }
    } catch (err) {
      pushToast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Try again shortly.',
        tone: 'error',
      });
    } finally {
      setBusySave(false);
    }
  };

  const handleDownloadPng = async () => {
    setBusyExport(true);
    try {
      await downloadBlessingCardPng(
        {
          message: blessing.message,
          senderName: blessing.senderName,
          recipientName: blessing.recipientName,
          category: blessing.category,
          cardStyle: blessing.cardStyle,
          dateLabel,
        },
        `ibless-${blessing.blessingId.slice(-6)}.png`
      );
      pushToast({ title: 'Blessing card downloaded as PNG', tone: 'success' });
    } catch (err) {
      pushToast({
        title: 'Download failed',
        description: err instanceof Error ? err.message : 'Could not render card.',
        tone: 'error',
      });
    } finally {
      setBusyExport(false);
    }
  };

  const handleCopyText = async () => {
    const text = `“${blessing.message}”\n— ${blessing.senderName} via iBless`;
    const ok = await copyTextToClipboard(text);
    pushToast({
      title: ok ? 'Blessing text copied' : 'Copy unavailable',
      tone: ok ? 'success' : 'error',
    });
  };

  const shareUrl = `${window.location.origin}/b/${blessing.blessingId}`;

  const handleShareNative = async () => {
    const text = `“${blessing.message}” — ${blessing.senderName} on iBless`;
    const result = await shareViaNativeOrFallback({
      title: 'A Blessing from iBless',
      text,
      url: blessing.visibility === 'public' ? shareUrl : undefined,
    });
    if (result === 'copied') {
      pushToast({ title: 'Copied to clipboard for sharing', tone: 'success' });
    }
  };

  const handleToggleVisibility = async () => {
    if (!isSender) return;
    const next = blessing.visibility === 'public' ? 'private' : 'public';
    try {
      await updateBlessingVisibility(blessing.blessingId, next);
      pushToast({
        title: next === 'public' ? 'Blessing is now public' : 'Blessing set to private',
        description:
          next === 'public'
            ? 'It can now appear in the community feed.'
            : 'Only you and the recipient can view it.',
        tone: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Could not update visibility',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!isSender) return;
    try {
      await deleteSentBlessing(blessing.blessingId);
      pushToast({ title: 'Blessing deleted', tone: 'success' });
    } catch (err) {
      pushToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    }
  };

  const handleReact = async (emoji: ReactionKey) => {
    if (!profile) return;
    try {
      await reactToPublicBlessing(blessing, profile, emoji);
    } catch (err) {
      pushToast({
        title: 'Reaction failed',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    }
  };

  return (
    <article
      className="rounded-3xl border overflow-hidden transition-shadow hover:shadow-md"
      style={{
        backgroundColor: style.bgHex,
        borderColor: style.borderHex,
        color: style.textHex,
      }}
    >
      <div className="p-6 sm:p-7">
        {/* Clean unboxed metadata header */}
        <div className="flex items-start justify-between gap-4">
          <div
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium"
            style={{ color: style.mutedHex }}
          >
            <span>
              {category.emoji} {category.name}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{dateLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              {blessing.visibility === 'private' ? (
                <>
                  <Lock className="w-3 h-3" /> Private
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" /> Public
                </>
              )}
            </span>
            {mode !== 'feed' && (
              <>
                <span aria-hidden="true">·</span>
                <span>{STATUS_LABELS[blessing.status] || blessing.status}</span>
              </>
            )}
          </div>

          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-display font-bold tracking-wider uppercase shrink-0"
            style={{
              backgroundColor: style.sealBgHex,
              color: style.sealTextHex,
            }}
            title="Official iBless Dispatch Seal"
          >
            Seal
          </div>
        </div>

        {/* Salutation & Message */}
        <p className="mt-4 text-xs font-medium" style={{ color: style.mutedHex }}>
          To{' '}
          <Link
            to={`/u/${blessing.recipientUsername}`}
            className="underline decoration-dotted underline-offset-2 hover:opacity-80"
          >
            {blessing.recipientName}
          </Link>
        </p>

        <blockquote className="mt-2 font-display text-lg sm:text-xl font-semibold leading-relaxed">
          “{blessing.message}”
        </blockquote>

        <div
          className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-3 text-sm"
          style={{ borderColor: style.borderHex }}
        >
          <div>
            <span className="text-xs" style={{ color: style.mutedHex }}>
              Dispatched by{' '}
            </span>
            <Link
              to={`/u/${blessing.senderUsername}`}
              className="font-semibold hover:underline underline-offset-2"
            >
              {blessing.senderName}
            </Link>
            <span className="text-xs ml-1.5 font-mono" style={{ color: style.mutedHex }}>
              @{blessing.senderUsername}
            </span>
          </div>

          {blessing.status === 'acknowledged' && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: style.accentHex }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Acknowledged
            </span>
          )}
        </div>

        {blessing.thankYouNote && (
          <div
            className="mt-3 rounded-2xl px-4 py-3 text-xs leading-relaxed border"
            style={{
              borderColor: style.borderHex,
              backgroundColor:
                blessing.cardStyle === 'midnight'
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(255,255,255,0.6)',
            }}
          >
            <span className="font-semibold">Thank-you reply: </span>
            {blessing.thankYouNote}
          </div>
        )}

        {/* Public reactions bar */}
        {blessing.visibility === 'public' && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {REACTION_ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleReact(item.key)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium border transition-transform active:scale-95"
                style={{
                  borderColor: style.borderHex,
                  backgroundColor:
                    blessing.cardStyle === 'midnight'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.75)',
                }}
              >
                <span>{item.emoji}</span>
                <span className="font-mono tabular-nums">
                  {blessing.reactions?.[item.key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Interactive actions toolbar */}
        <div
          className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-2"
          style={{ borderColor: style.borderHex }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {isRecipient && blessing.status !== 'acknowledged' && (
              <button
                type="button"
                onClick={() => setShowAckBox((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 min-h-[40px]"
                style={{ backgroundColor: style.sealBgHex, color: style.sealTextHex }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Acknowledge
              </button>
            )}

            {isRecipient && (
              <button
                type="button"
                onClick={() => navigate(`/send?to=${blessing.senderUsername}`)}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold border transition-colors min-h-[40px]"
                style={{
                  borderColor: style.borderHex,
                  backgroundColor:
                    blessing.cardStyle === 'midnight'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.85)',
                }}
              >
                <Reply className="w-3.5 h-3.5" />
                Bless Back
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleSave}
              disabled={busySave}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border transition-colors min-h-[40px]"
              style={{
                borderColor: style.borderHex,
                backgroundColor: isSaved
                  ? style.sealBgHex
                  : blessing.cardStyle === 'midnight'
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(255,255,255,0.75)',
                color: isSaved ? style.sealTextHex : style.textHex,
              }}
            >
              <Bookmark className="w-3.5 h-3.5" />
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 relative">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={busyExport}
              title="Download PNG card"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border hover:opacity-80 min-h-[40px]"
              style={{ borderColor: style.borderHex }}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PNG</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              title="Copy blessing text"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border hover:opacity-80 min-h-[40px]"
              style={{ borderColor: style.borderHex }}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowShareMenu((v) => !v)}
              title="External share options"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border hover:opacity-80 min-h-[40px]"
              style={{ borderColor: style.borderHex }}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {isSender && (
              <>
                <button
                  type="button"
                  onClick={handleToggleVisibility}
                  title={
                    blessing.visibility === 'public' ? 'Make private' : 'Share to public feed'
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border hover:opacity-80 min-h-[40px]"
                  style={{ borderColor: style.borderHex }}
                >
                  {blessing.visibility === 'public' ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete((v) => !v)}
                  title="Delete blessing"
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border hover:opacity-80 min-h-[40px]"
                  style={{ borderColor: style.borderHex }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {showShareMenu && (
              <div className="absolute right-0 bottom-12 z-20 w-56 rounded-2xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 shadow-xl p-2 space-y-1">
                <a
                  href={buildWhatsAppShareUrl(
                    `“${blessing.message}” — sent by ${blessing.senderName} via iBless${
                      blessing.visibility === 'public' ? `\n${shareUrl}` : ''
                    }`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowShareMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-stone-100 dark:hover:bg-zinc-800"
                >
                  <MessageCircleHeart className="w-4 h-4 text-emerald-600" />
                  Share on WhatsApp
                </a>
                {blessing.visibility === 'public' ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await copyTextToClipboard(shareUrl);
                      pushToast({ title: 'Public blessing link copied', tone: 'success' });
                      setShowShareMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-stone-100 dark:hover:bg-zinc-800 text-left"
                  >
                    <ExternalLink className="w-4 h-4 text-orange-600" />
                    Copy public link
                  </button>
                ) : (
                  <p className="px-3 py-2 text-[11px] text-stone-500 dark:text-stone-400">
                    Private blessings cannot be opened via public links.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleShareNative();
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium hover:bg-stone-100 dark:hover:bg-zinc-800 text-left"
                >
                  <Share2 className="w-4 h-4 text-sky-600" />
                  System share / copy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Acknowledge inline drawer */}
        {showAckBox && (
          <form
            onSubmit={handleAcknowledge}
            className="mt-4 rounded-2xl p-4 border space-y-3"
            style={{
              borderColor: style.borderHex,
              backgroundColor:
                blessing.cardStyle === 'midnight'
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(255,255,255,0.85)',
            }}
          >
            <label className="block text-xs font-semibold">
              Optional thank-you note for {blessing.senderName}
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={thankYouText}
              onChange={(e) => setThankYouText(e.target.value)}
              placeholder="Thank you so much! That really made my day..."
              className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAckBox(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium opacity-75 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyAck}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
              >
                {busyAck ? 'Confirming...' : 'Confirm Receipt'}
              </button>
            </div>
          </form>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="mt-4 rounded-2xl p-3.5 border border-rose-300 bg-rose-50 text-rose-950 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium">Delete this blessing permanently?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 font-medium"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold"
              >
                Yes, delete
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

interface BlessingPreviewCardProps {
  message: string;
  senderName: string;
  senderUsername?: string;
  recipientName: string;
  category: string;
  cardStyle: CardStyleId;
  dateLabel?: string;
}

export const BlessingPreviewCard: React.FC<BlessingPreviewCardProps> = ({
  message,
  senderName,
  senderUsername,
  recipientName,
  category,
  cardStyle,
  dateLabel = 'Today',
}) => {
  const style = getCardStyleMeta(cardStyle);
  const cat = getCategoryMeta(category);

  return (
    <div
      className="rounded-3xl border p-6 sm:p-8 shadow-sm transition-colors"
      style={{
        backgroundColor: style.bgHex,
        borderColor: style.borderHex,
        color: style.textHex,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium"
          style={{ color: style.mutedHex }}
        >
          <span>
            {cat.emoji} {cat.name}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">{dateLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Official Dispatch
          </span>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-display font-bold tracking-wider uppercase shrink-0"
          style={{ backgroundColor: style.sealBgHex, color: style.sealTextHex }}
        >
          Seal
        </div>
      </div>

      <p className="mt-5 text-xs font-medium" style={{ color: style.mutedHex }}>
        To {recipientName || 'Your Friend'},
      </p>

      <blockquote className="mt-2 font-display text-xl sm:text-2xl font-semibold leading-relaxed min-h-[5.5rem]">
        “{message.trim() || 'Your heartfelt blessing will appear right here...'}”
      </blockquote>

      <div
        className="mt-6 pt-4 border-t flex items-center justify-between text-sm"
        style={{ borderColor: style.borderHex }}
      >
        <div>
          <span className="text-xs" style={{ color: style.mutedHex }}>
            Warmly from{' '}
          </span>
          <span className="font-semibold">{senderName || 'You'}</span>
          {senderUsername && (
            <span className="text-xs ml-1.5 font-mono" style={{ color: style.mutedHex }}>
              @{senderUsername}
            </span>
          )}
        </div>
        <Heart className="w-4 h-4 opacity-60" style={{ color: style.accentHex }} />
      </div>
    </div>
  );
};
