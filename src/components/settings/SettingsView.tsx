import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { usePWA } from '../../context/PWAContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DEMO_USER } from '../../lib/storage';
import { ObservabilityCard } from './ObservabilityCard';
import {
  Moon,
  Sun,
  Monitor,
  RotateCcw,
  Database,
  Check,
  Download,
  Smartphone,
  Laptop,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function SettingsView() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useNotifications();
  const {
    isInstallable,
    isInstalled,
    isOffline,
    hasUpdate,
    platform,
    installApp,
    updateApp,
    setShowIOSInstallGuide,
  } = usePWA();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [title, setTitle] = useState(user?.title || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      email,
      title,
    });
    setIsSaved(true);
    showToast({
      title: 'Profile Updated',
      description: 'Your changes have been saved to local database persistence.',
      type: 'success',
    });
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo state back to default initial values?')) {
      localStorage.clear();
      updateUser(DEMO_USER);
      showToast({
        title: 'Data Reset',
        description: 'Initial state and demo records restored.',
        type: 'default',
      });
      window.location.reload();
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      }
      showToast({
        title: 'Cache Cleared',
        description: 'PWA service worker caches reset. Refreshing...',
        type: 'success',
      });
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      showToast({
        title: 'Cache Error',
        description: 'Could not clear cache directly.',
        type: 'error',
      });
      setIsClearingCache(false);
    }
  };

  const handleInstallClick = () => {
    if (platform === 'ios') {
      setShowIOSInstallGuide(true);
    } else {
      installApp();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          System Settings & Profile
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Manage your personal operating system configuration, appearance, PWA installation, and data layers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Navigation / Quick status */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">User Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center text-base font-bold">
                  {user?.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs space-y-1.5">
                <div className="flex justify-between text-neutral-500">
                  <span>Current Level</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    Level {user?.level}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Total XP</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {user?.currentXp.toLocaleString()} XP
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Streak</span>
                  <span className="font-bold text-orange-500">🔥 {user?.streakDays} Days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-neutral-500" />
                <CardTitle className="text-sm">Database & Storage</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-neutral-600 dark:text-neutral-400">
              <p>
                Storage engine is configured in offline-first mode with synchronized relational models and Service Worker caching.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetData}
                className="w-full text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset Sample State
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Settings Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Progressive Web App (PWA) & Offline Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                    Ω
                  </div>
                  <div>
                    <CardTitle>Progressive Web App (PWA)</CardTitle>
                    <CardDescription>
                      Offline caching, standalone window execution, and install management.
                    </CardDescription>
                  </div>
                </div>
                {isInstalled ? (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Installed
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                    <Laptop className="w-3.5 h-3.5" /> Browser Mode
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">Display Architecture</span>
                  <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    {isInstalled ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Standalone Window (Zero Chrome)</span>
                      </>
                    ) : (
                      <>
                        <Monitor className="w-3.5 h-3.5 text-blue-500" />
                        <span>Web Browser Session</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">Network / Offline Cache</span>
                  <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    {isOffline ? (
                      <>
                        <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400">Offline (Local Cache Active)</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Online & Synchronized</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Install button if not already installed */}
              {!isInstalled && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                      Install LIFE OS to your Desktop / Device
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                      Get full-screen productivity, lightning load speeds, and keyboard shortcuts.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleInstallClick}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Install App
                  </Button>
                </div>
              )}

              {/* Update & Cache Management */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                  Service Worker: <strong className="text-neutral-700 dark:text-neutral-300">v1.0.0</strong> ({platform.toUpperCase()})
                </span>
                <div className="flex items-center gap-2">
                  {hasUpdate && (
                    <Button
                      size="sm"
                      onClick={updateApp}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Apply Update
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCache}
                    disabled={isClearingCache}
                    className="text-xs"
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${isClearingCache ? 'animate-spin' : ''}`} />
                    Refresh Service Worker Cache
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                Customize your name, primary title, and notification email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Primary Specialization / Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Systems Engineer & Algorithmic Trader"
                />

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" size="sm" className="text-xs">
                    {isSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" /> Saved
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Theme & Appearance */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance & Theme</CardTitle>
              <CardDescription>
                Select your preferred color theme or match system settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    theme === 'dark'
                      ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <Moon className="w-5 h-5" />
                  <span className="text-xs">Dark Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    theme === 'light'
                      ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <Sun className="w-5 h-5" />
                  <span className="text-xs">Light Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    theme === 'system'
                      ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span className="text-xs">System Default</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Observability & Real-World Telemetry */}
          <ObservabilityCard />
        </div>
      </div>
    </div>
  );
}
