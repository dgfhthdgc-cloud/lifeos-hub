import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Storage } from '../../lib/storage';
import {
  QuestItem,
  AchievementBadge,
  StreakSystemData,
  XpTransaction,
} from '../../types';
import { LevelProgressHero } from './LevelProgressHero';
import { QuestBoard } from './QuestBoard';
import { BadgeVault } from './BadgeVault';
import { StreakShieldManager } from './StreakShieldManager';
import { XpLedgerStream } from './XpLedgerStream';
import { LevelTierRoadmapModal } from './LevelTierRoadmapModal';
import { BossRaidMainView } from '../bosses/BossRaidMainView';
import { SkillPerkTreeMainView } from '../perks/SkillPerkTreeMainView';
import { Target, Award, Flame, Zap, Swords } from 'lucide-react';
import { cn } from '../../lib/utils';

export function GamificationView() {
  const { user, addXp } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'quests' | 'bosses' | 'perks' | 'badges' | 'streak' | 'ledger'>('quests');
  const [quests, setQuests] = useState<QuestItem[]>([]);
  const [badges, setBadges] = useState<AchievementBadge[]>([]);
  const [streakData, setStreakData] = useState<StreakSystemData | null>(null);
  const [transactions, setTransactions] = useState<XpTransaction[]>([]);
  const [showRankMatrixModal, setShowRankMatrixModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setQuests(Storage.getQuests());
    setBadges(Storage.getBadges());
    setStreakData(Storage.getStreakData());
    setTransactions(Storage.getXpTransactions());
  };

  const handleClaimQuest = (questId: string) => {
    const result = Storage.claimQuest(questId);
    if (result.xpAwarded > 0 && result.quest) {
      Storage.updateQuestProgress('xp_earned', result.xpAwarded);
      addXp(result.xpAwarded, `Claimed Quest: ${result.quest.title}`);
      showToast({
        title: `+${result.xpAwarded} XP Claimed! 🎉`,
        description: `Successfully completed: "${result.quest.title}"`,
        type: 'xp',
        xpAmount: result.xpAwarded,
      });
      loadData();
    }
  };

  if (!user || !streakData) {
    return (
      <div className="p-8 text-center text-xs text-neutral-500">
        Loading Gamification Engine...
      </div>
    );
  }

  const claimableQuestsCount = quests.filter(
    (q) => !q.claimed && q.currentCount >= q.targetCount
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <LevelProgressHero
        user={user}
        onOpenRankMatrix={() => setShowRankMatrixModal(true)}
      />

      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('quests')}
          className={cn(
            'flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'quests'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          <Target className="w-4 h-4 text-amber-500" />
          <span>Quests & Missions</span>
          {claimableQuestsCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-mono font-black flex items-center justify-center animate-pulse-subtle">
              {claimableQuestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bosses')}
          className={cn(
            'flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'bosses'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          <Swords className="w-4 h-4 text-amber-500" />
          <span>Boss Raids</span>
        </button>

        <button
          onClick={() => setActiveTab('perks')}
          className={cn(
            'flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'perks'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          <Zap className="w-4 h-4 text-emerald-500" />
          <span>Skill Perk Tree</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={cn(
            'flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'badges'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          <Award className="w-4 h-4 text-yellow-500" />
          <span>Achievement Vault</span>
          <span className="text-[10px] font-mono text-neutral-400 font-normal">
            ({badges.filter((b) => b.unlocked).length}/{badges.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('streak')}
          className={cn(
            'flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'streak'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          <Flame className="w-4 h-4 text-orange-500" />
          <span>Streak & Shields</span>
          <span className="text-[10px] font-mono text-orange-500 font-bold">
            {streakData.currentStreak}d ({streakData.multiplier}x)
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={cn(
            'flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'ledger'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>XP Ledger & Audit</span>
        </button>
      </div>

      {activeTab === 'quests' && (
        <QuestBoard
          quests={quests}
          onClaimQuest={handleClaimQuest}
          onRefreshQuests={loadData}
        />
      )}

      {activeTab === 'bosses' && (
        <BossRaidMainView />
      )}

      {activeTab === 'perks' && (
        <SkillPerkTreeMainView />
      )}

      {activeTab === 'badges' && (
        <BadgeVault badges={badges} />
      )}

      {activeTab === 'streak' && (
        <StreakShieldManager
          streakData={streakData}
          onUpdate={(updated) => setStreakData(updated)}
        />
      )}

      {activeTab === 'ledger' && (
        <XpLedgerStream transactions={transactions} />
      )}

      <LevelTierRoadmapModal
        isOpen={showRankMatrixModal}
        onClose={() => setShowRankMatrixModal(false)}
        currentLevel={user.level}
      />
    </div>
  );
}
