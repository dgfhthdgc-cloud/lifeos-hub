import React from 'react';
import { Search, Sparkles, Sun, Moon, Menu, Download } from 'lucide-react';
import { RoutePath } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePWA } from '../../context/PWAContext';
import { NotificationsDropdown } from './NotificationsDropdown';
import { Button } from '../ui/Button';

interface TopBarProps {
  currentPath: RoutePath;
  onNavigate: (path: RoutePath) => void;
  onOpenSearch: () => void;
  onOpenMobileMenu: () => void;
}

export function TopBar({ currentPath, onNavigate, onOpenSearch, onOpenMobileMenu }: TopBarProps) {
  const { user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { isInstallable, installApp, isInstalled, platform, setShowIOSInstallGuide } = usePWA();

  const getPageTitle = (path: RoutePath) => {
    switch (path) {
      case '/':
      case '/dashboard':
        return { title: 'Dashboard', subtitle: 'Life Intelligence & Daily Pulse' };
      case '/planner':
        return { title: 'Planner', subtitle: 'Daily Execution, Time Blocking & Life Architecture' };
      case '/goals':
        return { title: 'Goals & Milestones', subtitle: 'Long-term Aspirations & High-Impact Targets' };
      case '/habits':
        return { title: 'Habits & Streaks', subtitle: 'Consistent Micro-Behaviors & Daily Wins' };
      case '/ai':
        return { title: 'AI Coach & Guidance', subtitle: 'Proactive Adaptation & Intelligence Engine' };
      case '/analytics':
        return { title: 'Analytics & Insights', subtitle: 'Productivity Trends, XP Velocity & Performance' };
      case '/simulator':
        return { title: 'Life Simulator', subtitle: 'Scenario Modeling & Trajectory Predictions' };
      case '/integrations':
        return { title: 'Biometrics & Hub', subtitle: 'Health Tracking & Device Synchronization' };
      case '/learn':
        return { title: 'Mastery & Learning', subtitle: 'Technical Curriculum & Knowledge Acquisition' };
      case '/languages':
        return { title: 'Language Acquisition', subtitle: 'Spaced Repetition, Drills & Fluency' };
      case '/trading':
      case '/trading/replay':
      case '/trading/journal':
        return { title: 'Trading Terminal', subtitle: 'Execution, Replay & Risk Analytics' };
      case '/progress':
        return { title: 'Progression & RPG', subtitle: 'Character Sheet, XP Ledger & Skill Matrices' };
      case '/bosses':
        return { title: 'Boss Raids', subtitle: 'Collaborative Quests & High-Stakes Focus Battles' };
      case '/perks':
        return { title: 'Perk Tree', subtitle: 'Talents, Multipliers & Specialization Unlocks' };
      case '/syndicate':
        return { title: 'Syndicate & Guilds', subtitle: 'Social Accountability & Collective Quests' };
      case '/automations':
        return { title: 'Automations & Rules', subtitle: 'Event Triggers, Workflows & Webhooks' };
      case '/vault':
        return { title: 'Knowledge Vault', subtitle: 'Encrypted Notes, Documents & Artifacts' };
      case '/swarm':
        return { title: 'Swarm Command', subtitle: 'Multi-Agent Autonomous Orchestration' };
      case '/settings':
        return { title: 'Settings', subtitle: 'Profile, Persistence, Security & Appearance' };
      default:
        return { title: 'LIFE OS', subtitle: 'Personal Operating System' };
    }
  };

  const { title, subtitle } = getPageTitle(currentPath);

  const canInstall = !isInstalled && (isInstallable || platform === 'ios');

  const handleInstallClick = () => {
    if (platform === 'ios') {
      setShowIOSInstallGuide(true);
    } else {
      installApp();
    }
  };

  return (
    <header className="h-16 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 select-none">
      {/* Left: Mobile Menu Trigger + Page Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm lg:text-base font-bold text-neutral-900 dark:text-white leading-tight">
            {title}
          </h1>
          <p className="hidden sm:block text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions: Search, Install, AI Shortcut, Notifications, Theme, User */}
      <div className="flex items-center gap-2">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors text-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick search...</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 ml-2">
            ⌘K
          </kbd>
        </button>

        {/* Native Install LIFE OS PWA Button */}
        {canInstall && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleInstallClick}
            className="gap-1.5 text-xs font-semibold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors shadow-2xs"
            title="Install LIFE OS to your home screen or desktop"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Install App</span>
          </Button>
        )}

        {/* AI Quick Shortcut */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('/ai')}
          className="hidden sm:inline-flex gap-1.5 text-xs font-medium border-violet-200 dark:border-violet-800/60 hover:bg-violet-50 dark:hover:bg-violet-950/30 text-violet-700 dark:text-violet-300"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
          <span>AI Coach</span>
        </Button>

        {/* Notifications */}
        <NotificationsDropdown onNavigate={onNavigate} />

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Avatar Shortcut */}
        {user && (
          <button
            onClick={() => onNavigate('/settings')}
            className="flex items-center gap-2 pl-2 border-l border-neutral-200 dark:border-neutral-800 focus:outline-none"
            title="Profile & Settings"
          >
            <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-xs font-bold ring-1 ring-neutral-300 dark:ring-neutral-700 hover:scale-105 transition-transform">
              {user.name.charAt(0)}
            </div>
          </button>
        )}
      </div>
    </header>
  );
}
