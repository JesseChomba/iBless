import React, { useEffect, useState } from 'react';
import { ArrowRight, Camera, Check, Sparkles, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { BrandMark } from '../components/BrandMark';
import { BlessingPreviewCard } from '../components/BlessingCardView';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  completeOnboardingOrUpdateUsername,
  isUsernameAvailable,
  isValidUsernameFormat,
  sanitizeUsername,
  searchDiscoverableUsers,
  uploadProfileAvatar,
} from '../services/userService';
import { sendConnectionRequest } from '../services/socialService';
import type { UserPublic } from '../types/ibless';
import { fireBlessingConfetti } from '../utils/confetti';

export const OnboardingPage: React.FC = () => {
  const { profile } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<UserPublic[]>([]);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile) {
      setDisplayName((prev) => prev || profile.displayName);
      setUsername((prev) => prev || profile.username);
      setPhotoURL((prev) => prev || profile.photoURL || '');
    }
  }, [profile]);

  useEffect(() => {
    const clean = sanitizeUsername(username);
    if (!isValidUsernameFormat(clean)) {
      setUsernameStatus('idle');
      return;
    }
    let active = true;
    setUsernameStateSafe();
    function setUsernameStateSafe() {
      setUsernameStatus('checking');
    }
    const timer = setTimeout(async () => {
      try {
        const ok = await isUsernameAvailable(clean, profile?.uid);
        if (active) setUsernameStatus(ok ? 'ok' : 'taken');
      } catch {
        if (active) setUsernameStatus('idle');
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username, profile?.uid]);

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    const clean = sanitizeUsername(username);
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }
    if (!isValidUsernameFormat(clean)) {
      setError('Username must be 3–24 lowercase letters, numbers, or underscores.');
      return;
    }
    setBusy(true);
    try {
      await completeOnboardingOrUpdateUsername(profile.uid, {
        displayName,
        username: clean,
        bio,
        photoURL,
        onboardingComplete: false,
      });
      const others = await searchDiscoverableUsers('', profile.uid);
      setSuggestedUsers(others.slice(0, 5));
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const url = await uploadProfileAvatar(profile.uid, file);
      setPhotoURL(url);
      await completeOnboardingOrUpdateUsername(profile.uid, {
        displayName: displayName || profile.displayName,
        username: username || profile.username,
        bio,
        photoURL: url,
        onboardingComplete: false,
      });
      pushToast({ title: 'Profile picture updated!', tone: 'success' });
    } catch (err) {
      pushToast({
        title: 'Photo upload failed',
        description: err instanceof Error ? err.message : 'Try another image.',
        tone: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleConnectFriend = async (target: UserPublic) => {
    if (!profile) return;
    try {
      await sendConnectionRequest(profile, target);
      setRequestedIds((prev) => new Set(prev).add(target.uid));
      pushToast({ title: `Friend request sent to @${target.username}`, tone: 'success' });
    } catch (err) {
      pushToast({
        title: 'Could not send request',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    }
  };

  const handleFinish = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      await completeOnboardingOrUpdateUsername(profile.uid, {
        displayName: displayName || profile.displayName,
        username: sanitizeUsername(username || profile.username),
        bio,
        photoURL,
        onboardingComplete: true,
      });
      fireBlessingConfetti('celebrate');
      navigate('/dashboard');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#111318] px-4 py-10 flex flex-col justify-center">
      <div className="max-w-xl w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <BrandMark />
          <span className="font-mono text-xs text-stone-500 dark:text-stone-400 tabular-nums">
            Step {step} of 3
          </span>
        </div>

        <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-7 sm:p-9 shadow-sm">
          {step === 1 && (
            <form onSubmit={handleSaveIdentity} className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                  Welcome to iBless
                </h1>
                <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">
                  Confirm how friends will recognise you and pick your unique handle.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-900 px-4 py-3 text-xs text-rose-800 dark:text-rose-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1.5">Display name</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold">Username</label>
                  {usernameStatus === 'ok' && (
                    <span className="text-[11px] text-emerald-600 font-medium">Available</span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="text-[11px] text-rose-600 font-medium">Already taken</span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={24}
                    value={username}
                    onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
                    className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-8 pr-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Short bio (optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={280}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Professional encourager, tea drinker, chronic well-wisher."
                  className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={busy || usernameStatus === 'taken'}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-3 text-sm font-semibold transition-colors disabled:opacity-60"
              >
                <span>{busy ? 'Saving...' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  Add a photo & spot friends
                </h2>
                <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">
                  Optional, of course. You can also invite friends anytime with your profile link.
                </p>
              </div>

              <div className="flex items-center gap-5 p-4 rounded-2xl border border-stone-200 dark:border-zinc-800 bg-[#FAF9F6] dark:bg-[#111318]">
                <Avatar src={photoURL} name={displayName || 'B'} size="lg" />
                <div>
                  <label className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800">
                    <Camera className="w-4 h-4 text-orange-600" />
                    <span>{uploading ? 'Uploading...' : 'Upload profile photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1.5">
                    PNG, JPEG, or WebP.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                  People already on iBless
                </h3>
                {suggestedUsers.length === 0 ? (
                  <p className="text-sm text-stone-500 dark:text-stone-400 py-3">
                    No other public profiles yet—share your profile link once you enter your dashboard!
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100 dark:divide-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    {suggestedUsers.map((u) => {
                      const sent = requestedIds.has(u.uid);
                      return (
                        <div
                          key={u.uid}
                          className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-zinc-900"
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
                          <button
                            type="button"
                            disabled={sent}
                            onClick={() => handleConnectFriend(u)}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border border-stone-200 dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-800 disabled:opacity-60"
                          >
                            {sent ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Requested
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5 text-orange-600" />
                                Connect
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 text-sm font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 text-sm font-semibold"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                  <Sparkles className="w-4 h-4" /> Official Welcome Dispatch
                </span>
                <h2 className="mt-1 font-display text-2xl font-bold">
                  Your very first welcome blessing
                </h2>
              </div>

              <BlessingPreviewCard
                message={`Welcome aboard, ${displayName || 'friend'}! You have officially been sworn in as a Blessing Novice. May your inbox stay warm, your friends feel cheered, and your snacks never go stale.`}
                senderName="Central Blessing Registry"
                senderUsername="ibless_hq"
                recipientName={displayName || 'You'}
                category="general_goodwill"
                cardStyle="mint"
                dateLabel="Day One"
              />

              <button
                type="button"
                onClick={handleFinish}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-3.5 text-sm font-semibold transition-colors disabled:opacity-60"
              >
                <span>{busy ? 'Opening Dashboard...' : 'Enter Your Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
