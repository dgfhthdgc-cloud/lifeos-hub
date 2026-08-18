import React, { useState, useEffect } from 'react';
import { GuildSyndicate, SyndicateLeaderboardEntry } from '../../types';
import { Storage } from '../../lib/storage';
import { useNotifications } from '../../context/NotificationContext';
import { GuildOverviewCard } from './GuildOverviewCard';
import { GuildWorldRaidCard } from './GuildWorldRaidCard';
import { GuildMembersRoster } from './GuildMembersRoster';
import { SyndicateLeaderboard } from './SyndicateLeaderboard';
import { Shield, Crown, Trophy, Users, Swords, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SyndicateMainView() {
  const { showToast } = useNotifications();
  const [guilds, setGuilds] = useState<GuildSyndicate[]>([]);
  const [leaderboard, setLeaderboard] = useState<SyndicateLeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'headquarters' | 'world_raid' | 'leaderboard'>('headquarters');

  const loadData = () => {
    setGuilds(Storage.getGuilds());
    setLeaderboard(Storage.getSyndicateLeaderboard());
  };

  useEffect(() => {
    loadData();
  }, []);

  const userGuild = guilds.find((g) => g.isUserMember) || guilds[0];

  const handleSwitchGuild = (guildId: string) => {
    const updated = Storage.joinGuild(guildId);
    loadData();
    if (updated) {
      showToast({
        title: 'Syndicate Allegiance Pledged',
        description: `You are now a member of ${updated.name} [${updated.tag}].`,
        type: 'success',
      });
    }
  };

  const handleAttackWorldRaid = (dmg: number) => {
    const res = Storage.contributeWorldRaidDamage(dmg);
    loadData();
    showToast({
      title: 'World Raid Strike Landed!',
      description: `You dealt ${dmg} critical damage to ${userGuild.activeWorldRaid.name}.`,
      type: 'success',
    });
  };

  if (!userGuild) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Overview */}
      <GuildOverviewCard
        guild={userGuild}
        allGuilds={guilds}
        onSwitchGuild={handleSwitchGuild}
      />

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('headquarters')}
          className={cn(
            'flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'headquarters'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          <Crown className="w-4 h-4 text-amber-500" />
          <span>Headquarters & Roster</span>
        </button>

        <button
          onClick={() => setActiveTab('world_raid')}
          className={cn(
            'flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'world_raid'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          <Swords className="w-4 h-4 text-red-500" />
          <span>Cooperative World Raid</span>
          <span className="text-[10px] font-mono text-red-500 font-bold">
            (Tier IV)
          </span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={cn(
            'flex-1 min-w-[150px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
            activeTab === 'leaderboard'
              ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
          )}
        >
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span>Global Leaderboard</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'headquarters' && (
        <div className="space-y-6">
          <GuildMembersRoster members={userGuild.members} />
        </div>
      )}

      {activeTab === 'world_raid' && (
        <GuildWorldRaidCard
          raid={userGuild.activeWorldRaid}
          onAttack={handleAttackWorldRaid}
        />
      )}

      {activeTab === 'leaderboard' && (
        <SyndicateLeaderboard entries={leaderboard} />
      )}
    </div>
  );
}
