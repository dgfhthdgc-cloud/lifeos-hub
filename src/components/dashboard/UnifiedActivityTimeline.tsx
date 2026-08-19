import React, { useState } from 'react';
import { UnifiedActivityEvent, RoutePath } from '../../types';
import {
  CheckCircle2,
  Flame,
  Target,
  GraduationCap,
  Globe,
  TrendingUp,
  Trophy,
  Zap,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface UnifiedActivityTimelineProps {
  events: UnifiedActivityEvent[];
  onNavigate: (path: RoutePath) => void;
  maxDisplay?: number;
}

export function UnifiedActivityTimeline({
  events,
  onNavigate,
  maxDisplay = 8,
}: UnifiedActivityTimelineProps) {
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  const filteredEvents = selectedDomain === 'all'
    ? events
    : events.filter((e) => e.domain === selectedDomain);

  const displayedEvents = filteredEvents.slice(0, maxDisplay);

  const getDomainIcon = (domain: UnifiedActivityEvent['domain']) => {
    switch (domain) {
      case 'habits':
        return <Flame className="w-3.5 h-3.5 text-orange-500" />;
      case 'goals':
        return <Target className="w-3.5 h-3.5 text-indigo-500" />;
      case 'learning':
        return <GraduationCap className="w-3.5 h-3.5 text-blue-500" />;
      case 'languages':
        return <Globe className="w-3.5 h-3.5 text-teal-500" />;
      case 'trading':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
      case 'rpg':
        return <Trophy className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  const getDomainBadgeColor = (domain: UnifiedActivityEvent['domain']) => {
    switch (domain) {
      case 'habits':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'goals':
        return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'learning':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'languages':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
      case 'trading':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'rpg':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20';
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header & Domain Filters */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Unified Activity Stream</h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Verified life actions & XP milestones</p>
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {['all', 'execution', 'habits', 'goals', 'learning'].map((dom) => (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom)}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold capitalize transition-all ${
                selectedDomain === dom
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-80 pr-1 scrollbar-thin">
        {displayedEvents.length === 0 ? (
          <div className="py-8 text-center text-neutral-400 dark:text-neutral-500 text-xs">
            No activity recorded in this category yet.
          </div>
        ) : (
          displayedEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => evt.targetPath && onNavigate(evt.targetPath)}
              className="group flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-100 dark:border-neutral-800/60 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-neutral-750 flex items-center justify-center shadow-2xs shrink-0">
                  {getDomainIcon(evt.domain)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {evt.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border capitalize ${getDomainBadgeColor(evt.domain)}`}>
                      {evt.domain}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {evt.relativeTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {evt.xpAwarded > 0 && (
                  <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    +{evt.xpAwarded} XP
                  </span>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer link to full progress ledger */}
      <div className="pt-3 mt-auto border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
        <span className="text-[11px] text-neutral-400">All actions cryptographically logged to XP ledger</span>
        <button
          onClick={() => onNavigate('/progress')}
          className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 text-xs"
        >
          Open Codex & Ledger <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
