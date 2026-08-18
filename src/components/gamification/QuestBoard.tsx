import React, { useState } from 'react';
import { QuestItem, QuestCategory } from '../../types';
import { Target, Zap, CheckCircle2, Clock, Award, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { Progress } from '../ui/Progress';

interface QuestBoardProps {
  quests: QuestItem[];
  onClaimQuest: (questId: string) => void;
  onRefreshQuests: () => void;
}

export function QuestBoard({ quests, onClaimQuest, onRefreshQuests }: QuestBoardProps) {
  const [filterCategory, setFilterCategory] = useState<QuestCategory | 'all'>('all');

  const filteredQuests = filterCategory === 'all'
    ? quests
    : quests.filter((q) => q.category === filterCategory);

  const getCategoryBadge = (category: QuestCategory) => {
    switch (category) {
      case 'daily':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'weekly':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'epic':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'special':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-neutral-900 dark:text-white">Active Directives & Quests</h2>
          <p className="text-xs text-neutral-400">Complete operations to acquire compounding XP yields</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'daily', 'weekly', 'epic', 'special'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/20'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={onRefreshQuests}
            className="p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors shrink-0"
            title="Refresh Quest Registry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuests.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-neutral-400 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            No active quests found in this category.
          </div>
        ) : (
          filteredQuests.map((quest) => {
            const isReadyToClaim = !quest.claimed && quest.currentCount >= quest.targetCount;
            const progressPercent = Math.min(100, Math.round((quest.currentCount / quest.targetCount) * 100));

            return (
              <div
                key={quest.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  quest.claimed
                    ? 'bg-neutral-50/50 dark:bg-neutral-950/40 border-neutral-200/50 dark:border-neutral-800/50 opacity-60'
                    : isReadyToClaim
                    ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadge(quest.category)}`}>
                      {quest.category}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-500 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      +{quest.xpReward} XP
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                      {quest.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      {quest.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-400">Progress</span>
                      <span className="text-neutral-700 dark:text-neutral-300 font-bold">
                        {quest.currentCount} / {quest.targetCount} ({progressPercent}%)
                      </span>
                    </div>
                    <Progress value={progressPercent} />
                  </div>

                  {quest.claimed ? (
                    <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Reward Claimed</span>
                    </div>
                  ) : isReadyToClaim ? (
                    <button
                      onClick={() => onClaimQuest(quest.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-98 animate-pulse-subtle"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Claim +{quest.xpReward} XP</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Expires: {quest.expiresAt}</span>
                      </span>
                      <span className="font-semibold text-neutral-500">In Progress</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
