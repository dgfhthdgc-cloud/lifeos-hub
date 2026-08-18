import React, { useState, useEffect } from 'react';
import { LifeAutomationRule, AutomationExecutionLog } from '../../types';
import { Storage } from '../../lib/storage';
import { useNotifications } from '../../context/NotificationContext';
import { AutomationRecipeCard } from './AutomationRecipeCard';
import { AutomationRuleModal } from './AutomationRuleModal';
import { AutomationExecutionLogs } from './AutomationExecutionLogs';
import { Button } from '../ui/Button';
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  Sliders,
  History,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function AutomationsMainView() {
  const { showToast } = useNotifications();
  const [rules, setRules] = useState<LifeAutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationExecutionLog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'recipes' | 'logs'>('recipes');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadData = () => {
    setRules(Storage.getAutomations());
    setLogs(Storage.getAutomationLogs());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = (id: string) => {
    const updated = Storage.toggleAutomation(id);
    loadData();
    if (updated) {
      showToast({
        title: updated.enabled ? 'Automation Enabled' : 'Automation Paused',
        description: `"${updated.title}" is now ${updated.enabled ? 'active' : 'dormant'}.`,
        type: 'info',
      });
    }
  };

  const handleDelete = (id: string) => {
    Storage.deleteAutomation(id);
    loadData();
    showToast({
      title: 'Automation Removed',
      description: 'Recipe deleted from pipeline.',
      type: 'warning',
    });
  };

  const handleCreateRule = (newRuleData: Omit<LifeAutomationRule, 'id' | 'runCount' | 'lastTriggeredAt'>) => {
    const created = Storage.createAutomation(newRuleData);
    loadData();
    showToast({
      title: 'Workflow Activated',
      description: `"${created.title}" successfully added to autonomous engine.`,
      type: 'success',
    });
  };

  const handleTestRun = (rule: LifeAutomationRule) => {
    if (rule.action.type === 'deal_boss_damage') {
      const dmg = typeof rule.action.value === 'number' ? rule.action.value : 150;
      Storage.damageActiveBoss(dmg, `Manual Test: "${rule.title}"`, 'automation');
      Storage.logAutomationExecution({
        ruleId: rule.id,
        ruleTitle: rule.title,
        triggerEvent: 'Manual Test Execution Triggered',
        actionTaken: `Dealt ${dmg} DMG to Boss Raid`,
        status: 'success',
        details: 'Dispatched via test console.',
      });
    } else if (rule.action.type === 'replenish_streak_shield') {
      const current = Storage.getStreakData();
      Storage.setStreakData({
        ...current,
        streakShields: Math.min(current.maxShields, current.streakShields + 1),
      });
      Storage.logAutomationExecution({
        ruleId: rule.id,
        ruleTitle: rule.title,
        triggerEvent: 'Manual Test Execution Triggered',
        actionTaken: 'Replenished 1 Streak Shield',
        status: 'success',
        details: 'Shield added to wallet.',
      });
    } else if (rule.action.type === 'award_perk_points') {
      Storage.addPerkPoints(1);
      Storage.logAutomationExecution({
        ruleId: rule.id,
        ruleTitle: rule.title,
        triggerEvent: 'Manual Test Execution Triggered',
        actionTaken: 'Awarded 1 Skill Perk Point',
        status: 'success',
        details: 'Added to perk wallet.',
      });
    }

    loadData();
    showToast({
      title: 'Test Trigger Succeeded',
      description: `Simulated trigger for "${rule.title}".`,
      type: 'success',
    });
  };

  const filteredRules = selectedCategory === 'all'
    ? rules
    : rules.filter((r) => r.category === selectedCategory);

  const activeCount = rules.filter((r) => r.enabled).length;
  const totalFirings = rules.reduce((acc, r) => acc + r.runCount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-amber-500/10 via-neutral-900/5 to-emerald-500/10 dark:from-amber-950/30 dark:via-neutral-900 dark:to-emerald-950/30 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>Autonomous Event Pipeline • Phase 9</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Life Automation Recipes
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xl">
            Autonomous triggers converting your real-world achievements into combat buffs, streak shields, and system safeguards with zero friction.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-center min-w-[100px]">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Active</span>
            <div className="text-lg font-mono font-black text-emerald-500">
              {activeCount} / {rules.length}
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-center min-w-[100px]">
            <span className="text-[10px] font-mono uppercase text-neutral-400">Executions</span>
            <div className="text-lg font-mono font-black text-amber-500">
              {totalFirings}
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-full py-3.5"
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Recipe
          </Button>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setActiveSubTab('recipes')}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-lg transition-all',
              activeSubTab === 'recipes'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            <Sliders className="w-3.5 h-3.5 inline mr-1.5" /> Active Recipes ({rules.length})
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-lg transition-all',
              activeSubTab === 'logs'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            )}
          >
            <History className="w-3.5 h-3.5 inline mr-1.5" /> Execution Logs ({logs.length})
          </button>
        </div>

        {activeSubTab === 'recipes' && (
          <div className="flex items-center gap-1 overflow-x-auto">
            {['all', 'execution', 'discipline', 'trading', 'learning', 'health'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all capitalize',
                  selectedCategory === cat
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content View */}
      {activeSubTab === 'recipes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map((rule) => (
            <AutomationRecipeCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onTestRun={handleTestRun}
            />
          ))}
        </div>
      ) : (
        <AutomationExecutionLogs logs={logs} />
      )}

      {/* Create Modal */}
      <AutomationRuleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRule={handleCreateRule}
      />
    </div>
  );
}
