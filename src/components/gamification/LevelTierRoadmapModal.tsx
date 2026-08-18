import React from 'react';
import { X, Award, CheckCircle2, Lock, Sparkles, ChevronRight, Zap } from 'lucide-react';

interface LevelTierRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
}

interface RankTier {
  tier: string;
  levelRange: string;
  title: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  borderColor: string;
  perks: string[];
}

const RANK_TIERS: RankTier[] = [
  {
    tier: 'Tier I',
    levelRange: 'Levels 1 - 4',
    title: 'Initiate Apprentice',
    minLevel: 1,
    maxLevel: 4,
    color: 'text-neutral-400 bg-neutral-500/10',
    borderColor: 'border-neutral-500/30',
    perks: [
      'Basic Task & Daily Habit Tracking',
      'Standard 1.0x XP Base Accrual',
      'Daily Quest Board Access',
      'Local Life OS Persistence',
    ],
  },
  {
    tier: 'Tier II',
    levelRange: 'Levels 5 - 14',
    title: 'Practitioner Specialist',
    minLevel: 5,
    maxLevel: 14,
    color: 'text-blue-400 bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    perks: [
      '+10% XP Multiplier on Language & Code Curricula',
      'Access to Level 1 Boss Raids & Combat Modifiers',
      'Unlock 2 Simultaneous Streak Shields',
      'Automated SRS Flashcard Priority Engine',
    ],
  },
  {
    tier: 'Tier III',
    levelRange: 'Levels 15 - 29',
    title: 'Specialist Systems Architect',
    minLevel: 15,
    maxLevel: 29,
    color: 'text-purple-400 bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    perks: [
      '+25% XP Multiplier on All Domain Directives',
      'Heroic Difficulty Boss Raids & Custom Relics',
      'Unlock Sovereign Swarm Autonomous Advisors',
      'Advanced Risk Allocation & Monte Carlo Simulator',
    ],
  },
  {
    tier: 'Tier IV',
    levelRange: 'Levels 30 - 49',
    title: 'Master Polymath Synthesist',
    minLevel: 30,
    maxLevel: 49,
    color: 'text-amber-400 bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    perks: [
      '+50% XP Multiplier Across All Pillars',
      'Mythic World Boss Raids & Guild Syndicate Lead',
      'Autonomous Habit Synthesis & Swarm Auto-Execution',
      'Full Biometric Readiness Multiplier Boost',
    ],
  },
  {
    tier: 'Tier V',
    levelRange: 'Levels 50 - 79',
    title: 'Grandmaster Sovereign',
    minLevel: 50,
    maxLevel: 79,
    color: 'text-rose-400 bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    perks: [
      '+75% Global XP Compound Engine',
      'Ascendant Boss Challenges & Immortal Relics',
      'Epoch Milestone Proof-of-Execution Signatures',
      'Permanent Freeze Shield Safeguards',
    ],
  },
  {
    tier: 'Tier VI',
    levelRange: 'Levels 80 - 100',
    title: 'Ascendant Polymath Deity',
    minLevel: 80,
    maxLevel: 100,
    color: 'text-cyan-400 bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    perks: [
      '2.0x Continuous Exponential XP Acceleration',
      'Unrestricted Autonomous Agentic Authority',
      'Complete Sovereign Life OS Master Key',
      'Universal Mastery Immortality Badge',
    ],
  },
];

export function LevelTierRoadmapModal({ isOpen, onClose, currentLevel }: LevelTierRoadmapModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900 dark:text-white">
                Rank Tier & Mastery Progression Roadmap
              </h2>
              <p className="text-xs text-neutral-400">
                You are currently <strong className="text-neutral-900 dark:text-white">Level {currentLevel}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {RANK_TIERS.map((tier) => {
            const isUnlocked = currentLevel >= tier.minLevel;
            const isCurrent = currentLevel >= tier.minLevel && currentLevel <= tier.maxLevel;

            return (
              <div
                key={tier.tier}
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? `bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/40 ring-2 ring-amber-500/20 shadow-md`
                    : isUnlocked
                    ? `bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800`
                    : `bg-neutral-50/50 dark:bg-neutral-950/40 border-neutral-200/50 dark:border-neutral-800/50 opacity-60`
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${tier.color} ${tier.borderColor}`}>
                        {tier.tier} • {tier.levelRange}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950 animate-pulse">
                          Current Rank
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      {tier.title}
                    </h3>
                  </div>

                  <div className="shrink-0">
                    {isUnlocked ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {tier.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold transition-all hover:opacity-90"
          >
            Close Roadmap
          </button>
        </div>
      </div>
    </div>
  );
}
