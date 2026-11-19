import React, { useState } from 'react';
import {
  Bell,
  Camera,
  KeyRound,
  LogOut,
  Moon,
  Save,
  ShieldBan,
  Sun,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import {
  canUseBrowserNotifications,
  requestBrowserNotificationPermission,
} from '../services/socialService';
import {
  completeOnboardingOrUpdateUsername,
  unblockUser,
  updateUserPreferences,
  uploadProfileAvatar,
} from '../services/userService';

export const SettingsPage: React.FC = () => {
  const { authUser, profile, blockedRecords, resetPassword, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [discoverable, setDiscoverable] = useState(profile?.discoverable ?? true);
  const [defaultVisibility, setDefaultVisibility] = useState<'private' | 'public'>(
    profile?.preferences.defaultVisibility ?? 'private'
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!profile) return null;

  const browserPermission = canUseBrowserNotifications()
    ? window.Notification.permission
    : 'unsupported';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await completeOnboardingOrUpdateUsername(profile.uid, {
        displayName,
        username: profile.username,
        bio,
        photoURL,
        onboardingComplete: true,
      });
      await updateUserPreferences(profile.uid, {
        discoverable,
        preferences: { defaultVisibility },
      });
      pushToast({ title: 'Settings saved!', tone: 'success' });
    } catch (err) {
      pushToast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProfileAvatar(profile.uid, file);
      setPhotoURL(url);
      pushToast({ title: 'Photo uploaded—click Save Changes to apply', tone: 'success' });
    } catch (err) {
      pushToast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Try another image.',
        tone: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEnableBrowserNotifs = async () => {
    const perm = await requestBrowserNotificationPermission();
    if (perm === 'granted') {
      await updateUserPreferences(profile.uid, {
        preferences: { browserNotifications: true },
      });
      pushToast({ title: 'Browser notifications enabled!', tone: 'success' });
    } else if (perm === 'denied') {
      await updateUserPreferences(profile.uid, {
        preferences: { browserNotifications: false },
      });
      pushToast({
        title: 'Browser notifications declined',
        description: 'In-app notifications will still work normally.',
        tone: 'error',
      });
    }
  };

  const handleThemeSwitch = async (next: 'light' | 'dark') => {
    setTheme(next);
    await updateUserPreferences(profile.uid, { preferences: { theme: next } });
  };

  const handlePasswordReset = async () => {
    if (!authUser?.email) return;
    try {
      await resetPassword(authUser.email);
      pushToast({
        title: 'Password reset email sent',
        description: `Check ${authUser.email}.`,
        tone: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Reset failed',
        description: err instanceof Error ? err.message : 'Try again.',
        tone: 'error',
      });
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Profile & Privacy Form */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2 className="font-display text-xl font-bold">Profile & Privacy</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Update your public card signature and default blessing visibility.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <Avatar src={photoURL} name={displayName || profile.displayName} size="lg" />
          <div>
            <label className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800">
              <Camera className="w-4 h-4 text-orange-600" />
              <span>{uploading ? 'Uploading...' : 'Change profile photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadPhoto}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-stone-500 mt-1.5">
              Handle: <span className="font-mono">@{profile.username}</span>
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Display name</label>
            <input
              type="text"
              required
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">
              Default blessing visibility
            </label>
            <select
              value={defaultVisibility}
              onChange={(e) =>
                setDefaultVisibility(e.target.value as 'private' | 'public')
              }
              className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm"
            >
              <option value="private">Private (Recommended)</option>
              <option value="public">Public Community Feed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">Biography</label>
          <textarea
            rows={3}
            maxLength={280}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share a warm line about yourself..."
            className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={discoverable}
            onChange={(e) => setDiscoverable(e.target.checked)}
            className="mt-1 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
          />
          <div>
            <p className="text-sm font-semibold">Discoverable in username search</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Allow other signed-in members to find you in the Friends directory.
            </p>
          </div>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </form>

      {/* Appearance & Notifications */}
      <section className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 sm:p-8 space-y-5">
        <h3 className="font-display text-lg font-bold">Appearance & Alerts</h3>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Color theme</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Switch between warm paper light mode and slate dark mode.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleThemeSwitch('light')}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold ${
                theme === 'light'
                  ? 'border-orange-600 bg-orange-50 text-orange-800'
                  : 'border-stone-200 dark:border-zinc-700'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
            <button
              type="button"
              onClick={() => handleThemeSwitch('dark')}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold ${
                theme === 'dark'
                  ? 'border-orange-600 bg-orange-950/60 text-orange-200'
                  : 'border-stone-200 dark:border-zinc-700'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-stone-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Browser push notifications</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {browserPermission === 'granted'
                ? 'Enabled for incoming blessings while iBless is open.'
                : browserPermission === 'denied'
                ? 'Blocked in browser settings. In-app notifications remain active.'
                : browserPermission === 'unsupported'
                ? 'Not supported in this browser. In-app notifications remain active.'
                : 'Optional desktop/mobile alerts for incoming blessings.'}
            </p>
          </div>
          {browserPermission === 'default' && (
            <button
              type="button"
              onClick={handleEnableBrowserNotifs}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-zinc-800"
            >
              <Bell className="w-3.5 h-3.5 text-orange-600" />
              Enable Alerts
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-stone-100 dark:border-zinc-800">
          <PWAInstallButton />
        </div>
      </section>

      {/* Blocked Users */}
      <section className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldBan className="w-5 h-5 text-stone-500" />
          <h3 className="font-display text-lg font-bold">
            Blocked Accounts ({blockedRecords.length})
          </h3>
        </div>
        {blockedRecords.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            You haven’t blocked anyone. Blocked users cannot send you blessings or requests.
          </p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-zinc-800 border border-stone-200 dark:border-zinc-800 rounded-2xl">
            {blockedRecords.map((b) => (
              <div
                key={b.blockId}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="font-mono">@{b.blockedUsername}</span>
                <button
                  type="button"
                  onClick={async () => {
                    await unblockUser(profile.uid, b.blockedId);
                    pushToast({
                      title: `Unblocked @${b.blockedUsername}`,
                      tone: 'success',
                    });
                  }}
                  className="text-xs font-semibold text-orange-600 hover:underline"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Account Actions */}
      <section className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold">Account Security</p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Signed in as {authUser?.email || 'authenticated member'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {authUser?.email && (
            <button
              type="button"
              onClick={handlePasswordReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-zinc-700 px-4 py-2 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-zinc-800"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Send Password Reset
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </section>
    </div>
  );
};
