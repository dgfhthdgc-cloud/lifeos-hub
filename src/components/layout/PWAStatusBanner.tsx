import React from 'react';
import { usePWA } from '../../context/PWAContext';
import { WifiOff, RefreshCw, Sparkles, X } from 'lucide-react';
import { Button } from '../ui/Button';

export const PWAStatusBanner: React.FC = () => {
  const { isOffline, hasUpdate, updateApp } = usePWA();
  const [dismissOffline, setDismissOffline] = React.useState(false);

  if (hasUpdate) {
    return (
      <div className="bg-linear-to-r from-violet-600 via-indigo-600 to-emerald-600 text-white text-xs px-4 py-2 flex items-center justify-between shadow-md select-none sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
          <span className="font-semibold">
            A new version of LIFE OS is available!
          </span>
          <span className="hidden sm:inline text-white/80">
            Click update to load the latest capabilities and improvements.
          </span>
        </div>
        <Button
          size="sm"
          onClick={updateApp}
          className="bg-white text-neutral-950 hover:bg-white/90 text-xs font-bold py-1 px-3 h-auto"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Update Now
        </Button>
      </div>
    );
  }

  if (isOffline && !dismissOffline) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs px-4 py-1.5 flex items-center justify-between select-none sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-amber-500" />
          <span>
            <strong>Offline Mode Active:</strong> You are viewing locally cached LIFE OS state. Actions will be saved to your local storage.
          </span>
        </div>
        <button
          onClick={() => setDismissOffline(true)}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-1"
          aria-label="Dismiss offline notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return null;
};
