import React, { useState, useEffect } from 'react';
import { Storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { BossBattle, RoutePath } from '../../types';
import { Button } from '../ui/Button';
import {
  Swords,
  Shield,
  Zap,
  Flame,
  Skull,
  Award,
  Clock,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Gift,
  Target,
  Globe,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface BossRaidMainViewProps {
  onNavigate?: (path: RoutePath) => void;
}

export function BossRaidMainView({ onNavigate }: BossRaidMainViewProps) {
  const { addXp } = useAuth();
  const { showToast } = useNotifications();

  const [bosses, setBosses] = useState<BossBattle[]>([]);
  const [selectedBossId, setSelectedBossId] = useState<string>('boss-1');
  const [focusMinutes, setFocusMinutes] = useState<number>(30);
  const [strikeReason, setStrikeReason] = useState<string>('Deep Work Sprint on Architecture');
  const [isStriking, setIsStriking] = useState(false);
  const [lastDamageDealt, setLastDamageDealt] = useState<number | null>(null);

  useEffect(() => {
    loadBosses();
  }, []);

  const loadBosses = () => {
    const list = Storage.getBossBattles();
    setBosses(list);
  };

  const currentBoss = bosses.find((b) => b.id === selectedBossId) || bosses[0];

  const handleFocusStrike = () => {
    if (!currentBoss || currentBoss.defeated) return;

    setIsStriking(true);
    // Calculate damage: 5 DMG per focused minute + 50 base
    const damageAmount = focusMinutes * 5 + 50;

    setTimeout(() => {
      const result = Storage.damageActiveBoss(
        damageAmount,
        `Focus Strike: ${focusMinutes}m Sprint ("${strikeReason}")`,
        'task'
      );

      setLastDamageDealt(damageAmount);
      setIsStriking(false);

      if (result.isDefeated) {
        // Award massive XP and perk points
        addXp(currentBoss.rewards.xp, `Defeated Boss: ${currentBoss.name}`, 'quest');
        showToast({
          title: `⚔️ BOSS DEFEATED: ${currentBoss.name}!`,
          description: `You shattered the boss! +${currentBoss.rewards.xp} XP & +${currentBoss.rewards.perkPoints} Skill Perk Points earned!`,
          type: 'xp',
          xpAmount: currentBoss.rewards.xp,
        });
      } else {
        showToast({
          title: `⚔️ Direct Hit! -${damageAmount} HP`,
          description: `Boss health reduced to ${result.newHp.toLocaleString()} / ${currentBoss.maxHp.toLocaleString()} HP.`,
          type: 'success',
        });
      }

      loadBosses();
    }, 400);
  };

  const handleResetBoss = (bossId: string) => {
    Storage.resetBoss(bossId);
    showToast({
      title: 'Boss Summoned Again',
      description: 'The boss HP has been restored for new combat challenges.',
      type: 'info',
    });
    loadBosses();
  };

  if (!currentBoss) {
    return (
      <div className="p-8 text-center text-xs text-neutral-500">
        Loading Boss Battle Arena...
      </div>
    );
  }

  const hpPercent = Math.round((currentBoss.currentHp / currentBoss.maxHp) * 100);

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Heroic':
        return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';
      case 'Mythic':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'Ascendant':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
  };

  const renderBossIcon = (iconName: string) => {
    switch (iconName) {
      case 'Skull':
        return <Skull className="w-10 h-10 text-amber-400" />;
      case 'Flame':
        return <Flame className="w-10 h-10 text-red-400" />;
      case 'Globe':
        return <Globe className="w-10 h-10 text-cyan-400" />;
      default:
        return <Swords className="w-10 h-10 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-linear-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              PHASE 8 • EPIC BOSS RAIDS
            </span>
            <span className="text-neutral-400 text-xs">•</span>
            <span className="text-xs text-neutral-300 font-medium">
              Real-World Output into Boss Damage
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Swords className="w-7 h-7 text-amber-400" />
            <span>Boss Raid Combat Arena</span>
          </h1>
          <p className="text-xs text-neutral-400 max-w-xl">
            Slay cognitive monsters through actual life execution. Completing tasks, checking habits, passing course labs, and executing disciplined trades deal real combat damage.
          </p>
        </div>

        {onNavigate && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('/analytics')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Life Analytics
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('/perks')}
              className="text-xs"
            >
              <Zap className="w-3.5 h-3.5 mr-1" /> Skill Perk Tree
            </Button>
          </div>
        )}
      </div>

      {/* Boss Selection Carousel Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {bosses.map((b) => {
          const isSelected = b.id === currentBoss.id;
          const bHpPercent = Math.round((b.currentHp / b.maxHp) * 100);

          return (
            <button
              key={b.id}
              onClick={() => setSelectedBossId(b.id)}
              className={cn(
                'p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between space-y-2',
                isSelected
                  ? 'bg-neutral-900 text-white dark:bg-neutral-800/90 border-amber-500/60 shadow-sm ring-1 ring-amber-500/30'
                  : 'bg-white dark:bg-neutral-900/80 border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700'
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                    getDifficultyBadge(b.difficulty)
                  )}
                >
                  {b.difficulty}
                </span>

                {b.defeated ? (
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> DEFEATED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-400">
                    {b.deadlineDays}d left
                  </span>
                )}
              </div>

              <div>
                <h4 className={cn('text-sm font-bold truncate', isSelected ? 'text-white' : 'text-neutral-900 dark:text-white')}>
                  {b.name}
                </h4>
                <p className="text-[11px] text-neutral-400 truncate">{b.subtitle}</p>
              </div>

              {/* Mini HP bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                  <span>HP</span>
                  <span>
                    {b.currentHp.toLocaleString()} / {b.maxHp.toLocaleString()} ({bHpPercent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      b.defeated
                        ? 'bg-neutral-500'
                        : bHpPercent < 25
                        ? 'bg-red-500'
                        : bHpPercent < 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    )}
                    style={{ width: `${bHpPercent}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Boss Combat Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Boss Visual & HP Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-6 relative overflow-hidden">
            {/* Boss Lore Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 dark:bg-neutral-950 border border-neutral-800 flex items-center justify-center shrink-0 shadow-inner">
                {renderBossIcon(currentBoss.avatarIcon)}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                    {currentBoss.name}
                  </h3>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                      getDifficultyBadge(currentBoss.difficulty)
                    )}
                  >
                    {currentBoss.difficulty}
                  </span>
                </div>
                <p className="text-xs font-semibold text-amber-500 dark:text-amber-400">
                  {currentBoss.subtitle}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed pt-1">
                  {currentBoss.lore}
                </p>
              </div>
            </div>

            {/* Boss Health Bar Display */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200/80 dark:border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Skull className="w-4 h-4 text-red-500" /> Boss Vitality
                </span>
                <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                  {currentBoss.currentHp.toLocaleString()} / {currentBoss.maxHp.toLocaleString()} HP ({hpPercent}%)
                </span>
              </div>

              <div className="w-full h-4 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden p-0.5 border border-neutral-300 dark:border-neutral-700 relative">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    currentBoss.defeated
                      ? 'bg-neutral-500'
                      : hpPercent < 25
                      ? 'bg-linear-to-r from-red-600 to-rose-500 animate-pulse'
                      : hpPercent < 60
                      ? 'bg-linear-to-r from-amber-500 to-orange-400'
                      : 'bg-linear-to-r from-emerald-500 to-teal-400'
                  )}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                <span>Starts: {new Date(currentBoss.startDate).toLocaleDateString()}</span>
                <span>Deadline: {new Date(currentBoss.endDate).toLocaleDateString()} ({currentBoss.deadlineDays}d remaining)</span>
              </div>
            </div>

            {/* Active Modifiers & Vulnerabilities */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Battle Modifiers & Weakness Matrix</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentBoss.activeModifiers.map((mod, mIdx) => (
                  <div
                    key={mIdx}
                    className="p-3 rounded-xl bg-neutral-50/80 dark:bg-neutral-950/50 border border-neutral-200/80 dark:border-neutral-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {mod.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {mod.damageMultiplier}x
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                      {mod.effect}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Victory Loot Card */}
            <div className="p-4 rounded-xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    Victory Spoils & Bounty
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    +{currentBoss.rewards.xp} XP
                  </span>
                  <span className="text-neutral-400">•</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{currentBoss.rewards.perkPoints} Perk Points
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {currentBoss.rewards.lootDescription}
              </p>
            </div>

            {currentBoss.defeated && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> This Boss has been conquered!
                </span>
                <Button variant="outline" size="sm" onClick={() => handleResetBoss(currentBoss.id)}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-summon Boss Challenge
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Combat Strike Console & Damage Stream */}
        <div className="lg:col-span-5 space-y-6">
          {/* Interactive Deep Work Focus Strike */}
          <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Focus Strike Console
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                Direct Cognitive Strike
              </span>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Log a focused work session or study sprint right now to deal immediate critical damage to the boss!
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Focus Sprint Duration (Minutes)
                </label>
                <div className="flex items-center gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setFocusMinutes(mins)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border',
                        focusMinutes === mins
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-xs'
                          : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                      )}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Sprint Objective
                </label>
                <input
                  type="text"
                  value={strikeReason}
                  onChange={(e) => setStrikeReason(e.target.value)}
                  placeholder="e.g. Deep coding session on compiler module"
                  className="w-full px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-500">Estimated Attack Power:</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                  {focusMinutes * 5 + 50} Critical DMG
                </span>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleFocusStrike}
                disabled={isStriking || currentBoss.defeated}
                className="w-full bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-neutral-950 font-black shadow-sm"
              >
                {isStriking ? (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 animate-spin" /> Striking Boss...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Swords className="w-4 h-4" /> Unleash Focus Strike (-{focusMinutes * 5 + 50} HP)
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Combat Damage Log */}
          <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Combat Damage Log
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                {currentBoss.damageLog.length} Strikes
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
              {currentBoss.damageLog.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-400">
                  No strikes recorded yet. Complete tasks or check habits to deal damage!
                </div>
              ) : (
                currentBoss.damageLog.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <p className="font-semibold text-neutral-900 dark:text-white truncate">
                        {log.reason}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Category: {log.category}
                      </p>
                    </div>
                    <span className="font-mono font-black text-rose-500 shrink-0">
                      -{log.damage} HP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
