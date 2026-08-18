import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Target,
  Flame,
  GraduationCap,
  Globe,
  TrendingUp,
  Sparkles,
  Award,
  Settings,
  LogOut,
  ChevronRight,
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
import { Progress } from '../ui/Progress';
import { cn } from '../../lib/utils';

interface SidebarProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
}

interface NavItem {
  label: string;
  path: RoutePath;
  icon: React.ElementType;
  badge?: string;
}

export function Sidebar({ currentPath, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const { isInstallable, installApp, isInstalled, platform, setShowIOSInstallGuide } = usePWA();

  const canInstall = !isInstalled && (isInstallable || platform === 'ios');

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Planner', path: '/planner', icon: Calendar },
    { label: 'Goals', path: '/goals', icon: Target },
    { label: 'Habits', path: '/habits', icon: Flame },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Boss Raids', path: '/bosses', icon: Swords },
    { label: 'Perk Tree', path: '/perks', icon: Zap },
    { label: 'Automations', path: '/automations', icon: Sliders, badge: 'AUTO' },
    { label: 'Syndicate', path: '/syndicate', icon: Crown, badge: 'GUILD' },
    { label: 'Biometrics & Hub', path: '/integrations', icon: Activity },
    { label: 'Swarm Command', path: '/swarm', icon: Cpu, badge: 'SWARM' },
    { label: 'Simulator', path: '/simulator', icon: Compass, badge: 'SIM' },
    { label: 'Legacy Vault', path: '/vault', icon: ShieldCheck, badge: 'VAULT' },
    { label: 'Learn', path: '/learn', icon: GraduationCap },
    { label: 'Languages', path: '/languages', icon: Globe },
    { label: 'Trading', path: '/trading', icon: TrendingUp },
    { label: 'AI Assistant', path: '/ai', icon: Sparkles, badge: 'PRO' },
    { label: 'Progress & XP', path: '/progress', icon: Award },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const xpPercent = user ? Math.round((user.currentXp / user.nextLevelXp) * 100) : 0;

  const handleInstall = () => {
    if (platform === 'ios') {
      setShowIOSInstallGuide(true);
    } else {
      installApp();
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen border-r border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/80 dark:bg-neutral-950/90 shrink-0 select-none sticky top-0 backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <button
          onClick={() => onNavigate('/dashboard')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-950 font-black text-sm tracking-wider shadow-sm group-hover:scale-105 transition-transform">
            Ω
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                LIFE OS
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                PWA v1.0
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">
              Personal Intelligence Engine
            </p>
          </div>
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
          Core Systems
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPath === item.path ||
            (item.path === '/dashboard' && currentPath === '/') ||
            (item.path === '/trading' && currentPath.startsWith('/trading'));

          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group focus:outline-none',
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-neutral-800/90 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive
                      ? 'text-white dark:text-neutral-100'
                      : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span
                  className={cn(
                    'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}

        {/* Install PWA Button if available */}
        {canInstall && (
          <div className="pt-2">
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all group focus:outline-none"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span>Install LIFE OS</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 uppercase tracking-wider">
                APP
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Gamification & Profile Status Card */}
      {user && (
        <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100/40 dark:bg-neutral-900/40">
          <div className="p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs space-y-2.5">
            {/* User Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-neutral-800 to-neutral-900 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center text-white text-xs font-bold ring-2 ring-neutral-200 dark:ring-neutral-700">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      LVL {user.level}
                    </span>
                    <span className="text-neutral-300 dark:text-neutral-600">•</span>
                    <span className="text-[10px] font-medium text-amber-500 flex items-center gap-0.5">
                      🔥 {user.streakDays}d
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* XP Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-500 dark:text-neutral-400 font-medium">
                <span>XP Progress</span>
                <span className="font-mono">
                  {user.currentXp.toLocaleString()} / {user.nextLevelXp.toLocaleString()} ({xpPercent}%)
                </span>
              </div>
              <Progress
                value={user.currentXp}
                max={user.nextLevelXp}
                size="xs"
                indicatorClassName="bg-linear-to-r from-emerald-500 to-teal-400"
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
