import React from 'react';
import { usePWA } from '../../context/PWAContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import {
  Download,
  Share,
  PlusSquare,
  Smartphone,
  Laptop,
  CheckCircle2,
  Sparkles,
  WifiOff,
  Zap,
} from 'lucide-react';

export const PWAInstallModal: React.FC = () => {
  const {
    showIOSInstallGuide,
    setShowIOSInstallGuide,
    platform,
    isInstallable,
    installApp,
    isInstalled,
  } = usePWA();

  if (!showIOSInstallGuide) return null;

  return (
    <Modal
      isOpen={showIOSInstallGuide}
      onClose={() => setShowIOSInstallGuide(false)}
      title="Install LIFE OS"
      maxWidth="md"
    >
      <div className="space-y-5 select-none">
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-black text-base flex items-center justify-center shrink-0 shadow-sm">
            Ω
          </div>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
              LIFE OS Progressive Web App
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Run as a standalone app with instant startup, offline caching, and zero browser chrome.
            </p>
          </div>
        </div>

        {platform === 'ios' ? (
          <div className="space-y-3">
            <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
              To install on your iPhone or iPad:
            </p>
            <ol className="space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300 list-decimal list-inside bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <li className="flex items-center gap-2">
                <span>1. Tap the</span>
                <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                  <Share className="w-3.5 h-3.5" /> Share
                </span>
                <span>button in Safari's bottom toolbar.</span>
              </li>
              <li className="flex items-center gap-2">
                <span>2. Scroll down and tap</span>
                <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                  <PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen
                </span>
              </li>
              <li>
                <span>3. Tap <strong className="text-emerald-600 dark:text-emerald-400">Add</strong> in the top right corner.</span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Experience LIFE OS as a native desktop or mobile application.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                  <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Instant Launch</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Opens in dedicated standalone window without URL bar.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                  <WifiOff className="w-3.5 h-3.5 text-teal-500" />
                  <span>Offline Ready</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Planner, journal, habits, and tasks function without internet.
                </p>
              </div>
            </div>

            {isInstallable && (
              <Button
                variant="primary"
                onClick={async () => {
                  await installApp();
                  setShowIOSInstallGuide(false);
                }}
                className="w-full justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5"
              >
                <Download className="w-4 h-4" />
                <span>Install LIFE OS Now</span>
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowIOSInstallGuide(false)}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
