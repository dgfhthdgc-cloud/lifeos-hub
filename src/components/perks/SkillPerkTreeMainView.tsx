import React, { useState, useEffect } from 'react';
import { Storage } from '../../lib/storage';
import { useNotifications } from '../../context/NotificationContext';
import { SkillPerkNode, SkillDomain, RoutePath } from '../../types';
import { Button } from '../ui/Button';
import {
  Zap,
  Shield,
  BookOpen,
  TrendingUp,
  Lock,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Swords,
  Crown,
  Target,
  Flame,
  Brain,
  Layers,
  GraduationCap,
  ShieldCheck,
  HeartHandshake,
  Compass,
  ArrowRight,
  Info,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SkillPerkTreeMainViewProps {
  onNavigate?: (path: RoutePath) => void;
}

export function SkillPerkTreeMainView({ onNavigate }: SkillPerkTreeMainViewProps) {
  const { showToast } = useNotifications();

  const [perks, setPerks] = useState<SkillPerkNode[]>([]);
  const [perkPoints, setPerkPoints] = useState<number>(4);
  const [selectedDomain, setSelectedDomain] = useState<SkillDomain | 'all'>('all');
  const [activePerkModal, setActivePerkModal] = useState<SkillPerkNode | null>(null);

  useEffect(() => {
    loadPerks();
  }, []);

  const loadPerks = () => {
    setPerks(Storage.getSkillPerks());
    setPerkPoints(Storage.getPerkPoints());
  };

  const handleUnlockPerk = (nodeId: string) => {
    const result = Storage.unlockSkillPerk(nodeId);
    if (result.success && result.perk) {
      showToast({
        title: `✨ Skill Perk Unlocked!`,
        description: `Unlocked: "${result.perk.title}". Passive effect is now permanently active.`,
        type: 'success',
      });
      loadPerks();
      setActivePerkModal(null);
    } else {
      showToast({
        title: 'Unlock Failed',
        description: result.message,
        type: 'warning',
      });
    }
  };

  const handleRespec = () => {
    Storage.resetSkillPerks();
    showToast({
      title: 'Skill Tree Reset',
      description: 'All skill perks have been reset and perk points refunded to your wallet.',
      type: 'info',
    });
    loadPerks();
  };

  const getDomainConfig = (domain: SkillDomain) => {
    switch (domain) {
      case 'execution':
        return {
          title: 'Execution Mastery',
          subtitle: 'Task throughput, focus velocity, and boss damage',
          color: 'emerald',
          icon: Zap,
          border: 'border-emerald-500/30',
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        };
      case 'consistency':
        return {
          title: 'Consistency Engine',
          subtitle: 'Habit streaks, shield recovery, and discipline',
          color: 'amber',
          icon: Flame,
          border: 'border-amber-500/30',
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        };
      case 'knowledge':
        return {
          title: 'Intellectual Mind',
          subtitle: 'Course labs, SRS memory retention, and syllabus mastery',
          color: 'indigo',
          icon: Brain,
          border: 'border-indigo-500/30',
          bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        };
      case 'strategy':
        return {
          title: 'Strategic Edge',
          subtitle: 'Risk management, trade execution, and emotional clarity',
          color: 'purple',
          icon: Compass,
          border: 'border-purple-500/30',
          bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        };
    }
  };

  const renderPerkIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-emerald-500" />;
      case 'Target':
        return <Target className="w-5 h-5 text-emerald-500" />;
      case 'Sword':
        return <Swords className="w-5 h-5 text-emerald-500" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-amber-500" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'Lock':
        return <Lock className="w-5 h-5 text-amber-500" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'BookOpen':
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case 'Brain':
        return <Brain className="w-5 h-5 text-indigo-500" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-indigo-500" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-indigo-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-purple-500" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-5 h-5 text-purple-500" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-500" />;
    }
  };

  const unlockedCount = perks.filter((p) => p.unlocked).length;
  const activePassives = perks.filter((p) => p.unlocked);

  const domains: SkillDomain[] = ['execution', 'consistency', 'knowledge', 'strategy'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-linear-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PHASE 8 • TALENT SPECIALIZATION
            </span>
            <span className="text-neutral-400 text-xs">•</span>
            <span className="text-xs text-neutral-300 font-medium">
              {unlockedCount} / {perks.length} Perks Unlocked
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Zap className="w-7 h-7 text-emerald-400" />
            <span>Skill Perk Tree & Talents</span>
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Spend Skill Perk Points (earned from Boss Raids and leveling up) to unlock permanent passive multipliers across execution, habits, learning, and trading.
          </p>
        </div>

        {/* Perk Points Wallet Card */}
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-center sm:text-left min-w-[160px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">
              Available Perk Points
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>{perkPoints} SP</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRespec}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Tree
          </Button>
        </div>
      </div>

      {/* Active Passives Strip */}
      <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Active Passive Buffs & Multipliers ({activePassives.length})</span>
          </div>
          <span className="text-[10px] text-neutral-400">
            Permanent multipliers currently enhancing your Life OS
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {activePassives.map((p) => (
            <div
              key={p.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold">{p.title}:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{p.passiveEffect}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4-Domain Specialization Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {domains.map((dom) => {
          const cfg = getDomainConfig(dom);
          const domainPerks = perks
            .filter((p) => p.domain === dom)
            .sort((a, b) => a.tier - b.tier);

          const DomIcon = cfg.icon;

          return (
            <div
              key={dom}
              className="p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-xs space-y-4"
            >
              {/* Domain Column Header */}
              <div className="space-y-1 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center border', cfg.bg, cfg.border)}>
                    <DomIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {cfg.title}
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">
                      Tier 1 to 4 Capstone
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  {cfg.subtitle}
                </p>
              </div>

              {/* Tier Nodes Stack with connecting lines */}
              <div className="space-y-3 relative">
                {domainPerks.map((node, nIdx) => {
                  const isUnlocked = node.unlocked;
                  const canUnlock =
                    !isUnlocked &&
                    perkPoints >= node.costPoints &&
                    node.dependencies.every((depId) => perks.find((p) => p.id === depId)?.unlocked);

                  const isLocked = !isUnlocked && !canUnlock;

                  return (
                    <div
                      key={node.id}
                      onClick={() => setActivePerkModal(node)}
                      className={cn(
                        'p-3.5 rounded-xl border transition-all cursor-pointer relative group text-left space-y-2',
                        isUnlocked
                          ? 'bg-neutral-50 dark:bg-neutral-950/80 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/20'
                          : canUnlock
                          ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/50 hover:scale-[1.02] shadow-xs'
                          : 'bg-neutral-100/60 dark:bg-neutral-950/40 border-neutral-200 dark:border-neutral-800/80 opacity-60'
                      )}
                    >
                      {/* Node Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-center">
                            {renderPerkIcon(node.iconName)}
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">
                              Tier {node.tier}
                            </span>
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white leading-tight">
                              {node.title}
                            </h4>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        ) : (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950">
                            {node.costPoints} SP
                          </span>
                        )}
                      </div>

                      {/* Passive effect */}
                      <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
                        <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 leading-snug">
                          {node.passiveEffect}
                        </p>
                      </div>

                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug line-clamp-2">
                        {node.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Perk Detail Modal */}
      {activePerkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                {renderPerkIcon(activePerkModal.iconName)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    Tier {activePerkModal.tier} • {activePerkModal.domain}
                  </span>
                  {activePerkModal.unlocked && (
                    <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                  {activePerkModal.title}
                </h3>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
              Passive Bonus: {activePerkModal.passiveEffect}
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {activePerkModal.description}
            </p>

            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
              <span className="text-neutral-500">Skill Point Cost:</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white">
                {activePerkModal.costPoints} SP
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setActivePerkModal(null)}>
                Close
              </Button>
              {!activePerkModal.unlocked && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleUnlockPerk(activePerkModal.id)}
                  disabled={perkPoints < activePerkModal.costPoints}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Unlock Perk ({activePerkModal.costPoints} SP)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
