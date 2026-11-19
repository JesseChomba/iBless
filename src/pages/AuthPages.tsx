import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  isUsernameAvailable,
  isValidUsernameFormat,
  sanitizeUsername,
} from '../services/userService';

function mapAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Try logging in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Please choose a password with at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Double-check and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please pause for a minute before trying again.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console yet (Authentication -> Sign-in method -> Email/Password). You can use Continue with Google below right now!';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing.';
    case 'auth/permission-denied-on-the-service':
    case 'auth/permission-denied-on-the-service.':
      return 'Firebase Token Service was denied by your Google Cloud API key restrictions. In Google Cloud Console -> Credentials, allow Token Service API, Identity Toolkit API, and Cloud Firestore API for your domain (or remove key restrictions).';
    default: {
      if (err instanceof Error) {
        let inner = err.message;
        try {
          const parsed = JSON.parse(err.message);
          if (parsed?.error) {
            inner = String(parsed.error);
          }
        } catch {
          // Not JSON
        }
        if (inner.includes('permission-denied-on-the-service')) {
          return 'Firebase Token Service was denied by your Google Cloud API key restrictions. In Google Cloud Console -> Credentials, allow Token Service API, Identity Toolkit API, and Cloud Firestore API for this domain (or set restrictions to None).';
        }
        if (inner.includes('requests-from-referer-') && inner.includes('are-blocked')) {
          return `Requests from ${window.location.origin} are blocked by your Google Cloud API key Website restrictions. Add "${window.location.origin}/*" in Google Cloud Console -> APIs & Services -> Credentials (or set Application restrictions to None).`;
        }
        return inner !== err.message
          ? `Account setup could not save your profile (${inner}). Please try again.`
          : err.message;
      }
      return 'Authentication failed. Please try again.';
    }
  }
}

const AuthShell: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-[#FAF9F6] dark:bg-[#111318] flex flex-col justify-center px-4 py-10">
    <div className="max-w-md w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="focus:outline-none">
          <BrandMark />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Home
        </Link>
      </div>

      <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-7 sm:p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  </div>
);

export const LoginPage: React.FC = () => {
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }
    setBusy(true);
    try {
      await loginWithEmail(email, password);
      pushToast({ title: 'Welcome back to iBless!', tone: 'success' });
      navigate('/dashboard');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle();
      pushToast({ title: 'Signed in with Google', tone: 'success' });
      navigate('/dashboard');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to check your blessing inbox and dispatch fresh smiles."
    >
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs text-rose-800 dark:text-rose-200 leading-relaxed"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-3 text-sm font-semibold transition-colors disabled:opacity-60 min-h-[44px]"
        >
          {busy ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-stone-400">
        <div className="flex-1 h-px bg-stone-200 dark:bg-zinc-800" />
        <span>or</span>
        <div className="flex-1 h-px bg-stone-200 dark:bg-zinc-800" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 py-2.5 text-sm font-semibold text-stone-800 dark:text-stone-100 transition-colors min-h-[44px]"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-xs text-stone-600 dark:text-stone-400">
        New to iBless?{' '}
        <Link
          to="/register"
          className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
};

export const RegisterPage: React.FC = () => {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameState, setUsernameState] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const clean = sanitizeUsername(username);
    if (!isValidUsernameFormat(clean)) {
      setUsernameState('idle');
      return;
    }
    let active = true;
    setUsernameState('checking');
    const timer = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(clean);
        if (active) setUsernameState(available ? 'ok' : 'taken');
      } catch {
        if (active) setUsernameState('idle');
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanUsername = sanitizeUsername(username);
    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (!isValidUsernameFormat(cleanUsername)) {
      setError('Username must be 3–24 characters using lowercase letters, numbers, or underscores.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      await registerWithEmail({
        email,
        password,
        displayName,
        username: cleanUsername,
      });
      pushToast({ title: 'Account created! Welcome to iBless.', tone: 'celebrate' });
      navigate('/onboarding');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate('/onboarding');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Join iBless"
      subtitle="Claim your username and start sending personalised digital blessings."
    >
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs text-rose-800 dark:text-rose-200 leading-relaxed"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Display name
          </label>
          <input
            type="text"
            required
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Auntie Priya"
            className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Unique username
            </label>
            {usernameState === 'checking' && (
              <span className="text-[11px] text-stone-400">Checking...</span>
            )}
            {usernameState === 'ok' && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Available
              </span>
            )}
            {usernameState === 'taken' && (
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                Already taken
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-mono">
              @
            </span>
            <input
              type="text"
              required
              minLength={3}
              maxLength={24}
              value={username}
              onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
              placeholder="priya_blesses"
              className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-8 pr-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            Password (6+ characters)
          </label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <button
          type="submit"
          disabled={busy || usernameState === 'taken'}
          className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-3 text-sm font-semibold transition-colors disabled:opacity-60 min-h-[44px]"
        >
          {busy ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-stone-400">
        <div className="flex-1 h-px bg-stone-200 dark:bg-zinc-800" />
        <span>or</span>
        <div className="flex-1 h-px bg-stone-200 dark:bg-zinc-800" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 py-2.5 text-sm font-semibold text-stone-800 dark:text-stone-100 transition-colors min-h-[44px]"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-xs text-stone-600 dark:text-stone-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email address and we will send you a password reset link."
    >
      {sent ? (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-5 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <p className="mt-3 text-sm font-semibold text-stone-900 dark:text-stone-100">
            Reset email dispatched!
          </p>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
            Check your inbox at <span className="font-mono">{email}</span> for reset instructions.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-orange-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-orange-700"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-3 text-xs text-rose-800 dark:text-rose-200"
            >
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Account email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white py-3 text-sm font-semibold transition-colors disabled:opacity-60 min-h-[44px]"
          >
            <Mail className="w-4 h-4" />
            <span>{busy ? 'Sending...' : 'Send Reset Link'}</span>
          </button>
          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400"
            >
              Return to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
};
