import React, { useEffect, useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BlessingCardView } from '../components/BlessingCardView';
import { useAuth } from '../contexts/AuthContext';
import { getBlessingById } from '../services/blessingService';
import type { Blessing } from '../types/ibless';

export const BlessingDetailPage: React.FC = () => {
  const { blessingId } = useParams<{ blessingId: string }>();
  const { authUser } = useAuth();
  const [blessing, setBlessing] = useState<Blessing | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!blessingId || !authUser) {
      setLoading(false);
      return;
    }
    let active = true;
    getBlessingById(blessingId)
      .then((b) => {
        if (active) setBlessing(b);
      })
      .catch(() => {
        if (active) setDenied(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [blessingId, authUser]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <Link
        to={authUser ? '/dashboard' : '/'}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-100"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to iBless
      </Link>

      {!authUser ? (
        <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-8 text-center">
          <Lock className="w-8 h-8 text-orange-600 mx-auto" />
          <h1 className="mt-3 font-display text-xl font-bold">Sign in to view blessing</h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Blessings on iBless respect strict visibility rules. Sign in to view this card if it is public or addressed to you.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-orange-600 text-white px-5 py-2.5 text-sm font-semibold"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-stone-200 dark:border-zinc-700 px-5 py-2.5 text-sm font-semibold"
            >
              Create Account
            </Link>
          </div>
        </div>
      ) : loading ? (
        <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-12 text-center text-sm text-stone-500">
          Fetching blessing card...
        </div>
      ) : denied || !blessing ? (
        <div className="rounded-3xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-[#161920] p-8 text-center">
          <Lock className="w-8 h-8 text-stone-400 mx-auto" />
          <h1 className="mt-3 font-display text-xl font-bold">
            This blessing is private or unavailable
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Private blessings are strictly limited to their sender and recipient.
          </p>
        </div>
      ) : (
        <BlessingCardView blessing={blessing} mode="detail" />
      )}
    </div>
  );
};
