import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors font-medium whitespace-nowrap shrink-0 ${
          compact ? 'px-3 py-1.5 text-xs min-h-[36px]' : 'w-full px-4 py-2.5 text-sm min-h-[42px]'
        }`}
      >
        <Download className="w-4 h-4 text-orange-600 dark:text-orange-400" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors font-medium whitespace-nowrap shrink-0 ${
            compact ? 'px-3 py-1.5 text-xs min-h-[36px]' : 'w-full px-4 py-2.5 text-sm min-h-[42px]'
          }`}
        >
          <Share2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  Install iBless on iPhone or iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-300">
                <li>1. Tap the <strong>Share</strong> icon in Safari’s toolbar.</li>
                <li>2. Scroll down and choose <strong>Add to Home Screen</strong>.</li>
                <li>3. Tap <strong>Add</strong> to keep iBless one tap away.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
