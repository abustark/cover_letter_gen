import React, { useEffect, useState } from 'react';
import { RegenerateIcon, SparklesIcon } from './icons';

export const CURRENT_APP_VERSION = '2.1.5';

export const UpdateNotification: React.FC = () => {
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkVersion = async () => {
    try {
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      if (!res.ok) return;

      const data = (await res.json()) as { version?: string };
      if (data?.version && data.version !== CURRENT_APP_VERSION) {
        setNewVersion(data.version);
      }
    } catch {
      // Silently ignore network failures in background version check
    }
  };

  useEffect(() => {
    // Initial check after 3 seconds
    const initialTimer = setTimeout(checkVersion, 3000);

    // Periodic check every 2 minutes
    const intervalTimer = setInterval(checkVersion, 2 * 60 * 1000);

    // Check when user returns to the tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    window.addEventListener('focus', checkVersion);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
      window.removeEventListener('focus', checkVersion);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (!newVersion || dismissed) return null;

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-fade-in"
    >
      <div className="bg-stone-900/95 dark:bg-stone-900/95 text-stone-100 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3 ring-1 ring-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-400">
                  Update Available
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-stone-300 font-medium mt-0.5">
                Version <span className="font-mono text-amber-300">v{newVersion}</span> is ready
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss update notification"
            className="text-stone-400 hover:text-stone-100 transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-[11.5px] text-stone-400 leading-snug">
          A new version has been deployed with fixes and performance improvements.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all shadow-sm active:scale-95"
          >
            <RegenerateIcon className="w-3.5 h-3.5" />
            <span>Refresh to Update</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
