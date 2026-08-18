import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Flame,
  GraduationCap,
  TrendingUp,
  X,
  Target,
  Globe,
  Sparkles,
  Award,
  Settings,
  LogOut,
  BarChart3,
  Swords,
  Zap,
  Sliders,
  Crown,
  Activity,
  Cpu,
  Compass,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { RoutePath } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { usePWA } from '../../context/PWAContext';
import { cn } from '../../lib/utils';

interface MobileNavProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
}

export function MobileNav({
  currentPath,
  onNavigate,
  isDrawerOpen,
  onCloseDrawer,
}: MobileNavProps) {
  const { user, logout } = useAuth();
  const { isInstallable, installApp, isInstalled, platform, setShowIOSInstallGuide } = usePWA();

  const canInstall = !isInstalled && (isInstallable || platform === 'ios');

  const primaryBottomTabs: { label: string; path: RoutePath; icon: React.ElementType }[] = [
    { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Planner', path: '/planner', icon: Calendar },
    { label: 'Habits', path: '/habits', icon: Flame },
    { label: 'Learn', path: '/learn', icon: GraduationCap },
    { label: 'Trading', path: '/trading', icon: TrendingUp },
  ];

  const allNavItems = [
    { label: 'Dashboard', path: '/dashboard' as RoutePath, icon: LayoutDashboard },
    { label: 'Planner', path: '/planner' as RoutePath, icon: Calendar },
    { label: 'Goals', path: '/goals' as RoutePath, icon: Target },
    { label: 'Habits', path: '/habits' as RoutePath, icon: Flame },
    { label: 'Analytics', path: '/analytics' as RoutePath, icon: BarChart3 },
    { label: 'Boss Raids', path: '/bosses' as RoutePath, icon: Swords },
    { label: 'Perk Tree', path: '/perks' as RoutePath, icon: Zap },
    { label: 'Automations', path: '/automations' as RoutePath, icon: Sliders },
    { label: 'Syndicate', path: '/syndicate' as RoutePath, icon: Crown },
    { label: 'Biometrics & Hub', path: '/integrations' as RoutePath, icon: Activity },
    { label: 'Swarm Command', path: '/swarm' as RoutePath, icon: Cpu },
    { label: 'Quantum Simulator', path: '/simulator' as RoutePath, icon: Compass },
    { label: 'Legacy Vault', path: '/vault' as RoutePath, icon: ShieldCheck },
    { label: 'Learn', path: '/learn' as RoutePath, icon: GraduationCap },
    { label: 'Languages', path: '/languages' as RoutePath, icon: Globe },
    { label: 'Trading Terminal', path: '/trading' as RoutePath, icon: TrendingUp },
    { label: 'AI Assistant', path: '/ai' as RoutePath, icon: Sparkles },
    { label: 'Progress & Gamification', path: '/progress' as RoutePath, icon: Award },
    { label: 'Settings', path: '/settings' as RoutePath, icon: Settings },
  ];

  const handleInstall = () => {
    onCloseDrawer();
    if (platform === 'ios') {
      setShowIOSInstallGuide(true);
    } else {
      installApp();
    }
  };

  return (
    <>
      {/* Bottom Floating/Docked Navigation on Mobile with safe-area spacing */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800/80 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around">
        {primaryBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.path || (tab.path === '/dashboard' && currentPath === '/');

          return (
            <button
              key={tab.path}
              onClick={() => onNavigate(tab.path)}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 mb-0.5 transition-transform',
                  isActive && 'text-emerald-600 dark:text-emerald-400 scale-110'
                )}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Full Drawer Sheet for Mobile */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={onCloseDrawer}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[80vw] h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black text-xs flex items-center justify-center">
                  Ω
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">LIFE OS</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    PWA
                  </span>
                </div>
              </div>
              <button
                onClick={onCloseDrawer}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Install banner in mobile drawer */}
            {canInstall && (
              <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 bg-emerald-500/5">
                <button
                  onClick={handleInstall}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Install App to Device</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase">
                    Free
                  </span>
                </button>
              </div>
            )}

            {/* Navigation items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      onNavigate(item.path);
                      onCloseDrawer();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left',
                      isActive
                        ? 'bg-neutral-900 text-white dark:bg-neutral-800 dark:text-white'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer User Info */}
            {user && (
              <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Level {user.level} • {user.streakDays}d Streak
                  </p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    onCloseDrawer();
                  }}
                  className="p-2 text-neutral-400 hover:text-red-500 rounded-md"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
