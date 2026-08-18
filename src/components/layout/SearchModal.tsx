import React, { useState, useEffect } from 'react';
import { RoutePath } from '../../types';
import {
  Search,
  X,
  LayoutDashboard,
  Calendar,
  Target,
  Flame,
  BarChart3,
  Swords,
  Zap,
  Sliders,
  Crown,
  Activity,
  Cpu,
  Compass,
  ShieldCheck,
  GraduationCap,
  Globe,
  TrendingUp,
  Sparkles,
  Award,
  Settings,
  ArrowRight,
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: RoutePath) => void;
}

interface CommandItem {
  title: string;
  path: RoutePath;
  category: string;
  icon: React.ElementType;
  keywords: string[];
}

export function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands: CommandItem[] = [
    { title: 'Dashboard', path: '/dashboard', category: 'Navigation', icon: LayoutDashboard, keywords: ['home', 'overview', 'stats'] },
    { title: 'Execution Planner', path: '/planner', category: 'Productivity', icon: Calendar, keywords: ['tasks', 'schedule', 'todo', 'agenda'] },
    { title: 'Strategic Goals', path: '/goals', category: 'Strategy', icon: Target, keywords: ['okr', 'milestones', 'targets', 'pillars'] },
    { title: 'Atomic Habits', path: '/habits', category: 'Productivity', icon: Flame, keywords: ['rituals', 'streaks', 'discipline', 'freeze'] },
    { title: 'Analytics & Heatmap', path: '/analytics', category: 'Intelligence', icon: BarChart3, keywords: ['velocity', 'radar', 'flow state', 'metrics'] },
    { title: 'Boss Raids', path: '/bosses', category: 'Combat', icon: Swords, keywords: ['raid', 'battle', 'boss', 'entropy'] },
    { title: 'Skill Perk Tree', path: '/perks', category: 'Progression', icon: Zap, keywords: ['talents', 'skills', 'upgrades', 'points'] },
    { title: 'Automations Engine', path: '/automations', category: 'Systems', icon: Sliders, keywords: ['rules', 'recipes', 'triggers', 'workflows'] },
    { title: 'Syndicate Guild', path: '/syndicate', category: 'Social', icon: Crown, keywords: ['clan', 'guild', 'roster', 'leaderboard'] },
    { title: 'Biometrics Hub', path: '/integrations', category: 'Hardware', icon: Activity, keywords: ['whoop', 'oura', 'apple health', 'hrv', 'sleep'] },
    { title: 'Swarm Command', path: '/swarm', category: 'Autonomous', icon: Cpu, keywords: ['agents', 'ai fleet', 'delegation'] },
    { title: 'Life Simulator', path: '/simulator', category: 'Modeling', icon: Compass, keywords: ['monte carlo', 'projections', 'financial independence'] },
    { title: 'Legacy Vault', path: '/vault', category: 'Security', icon: ShieldCheck, keywords: ['cold storage', 'backup', 'export', 'credentials'] },
    { title: 'Learn Academy', path: '/learn', category: 'Knowledge', icon: GraduationCap, keywords: ['courses', 'certifications', 'lessons'] },
    { title: 'Language Matrix', path: '/languages', category: 'Knowledge', icon: Globe, keywords: ['spanish', 'japanese', 'vocab', 'srs', 'flashcards'] },
    { title: 'Trading Terminal', path: '/trading', category: 'Finance', icon: TrendingUp, keywords: ['crypto', 'market', 'journal', 'chart', 'replay'] },
    { title: 'AI Strategist', path: '/ai', category: 'Intelligence', icon: Sparkles, keywords: ['coach', 'gemini', 'audit', 'briefing'] },
    { title: 'XP & Achievements', path: '/progress', category: 'Progression', icon: Award, keywords: ['badges', 'level', 'ranks', 'quests'] },
    { title: 'System Settings', path: '/settings', category: 'Preferences', icon: Settings, keywords: ['theme', 'export', 'profile', 'notifications'] },
  ];

  const filtered = commands.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q))
    );
  });

  const handleSelect = (path: RoutePath) => {
    onNavigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, domain, or shortcut..."
            autoFocus
            className="flex-1 bg-transparent border-none text-sm text-neutral-900 dark:text-white placeholder-neutral-400 px-3 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No matching modules or commands found for "{query}".
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:text-emerald-500 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-neutral-400">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 dark:bg-neutral-950 px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Navigate with mouse or keyboard</span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-[10px]">ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
