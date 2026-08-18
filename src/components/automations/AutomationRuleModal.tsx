import React, { useState } from 'react';
import {
  LifeAutomationRule,
  AutomationTriggerType,
  AutomationActionType,
} from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Zap, ArrowRight, Plus, Sparkles } from 'lucide-react';

interface AutomationRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRule: (rule: Omit<LifeAutomationRule, 'id' | 'runCount' | 'lastTriggeredAt'>) => void;
}

export function AutomationRuleModal({
  isOpen,
  onClose,
  onCreateRule,
}: AutomationRuleModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'execution' | 'discipline' | 'trading' | 'learning' | 'health'>('execution');
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>('task_completed');
  const [triggerLabel, setTriggerLabel] = useState('Task is marked completed');
  const [hasCondition, setHasCondition] = useState(true);
  const [conditionField, setConditionField] = useState('priority');
  const [conditionOperator, setConditionOperator] = useState<'equals' | 'gte' | 'lte' | 'contains'>('equals');
  const [conditionValue, setConditionValue] = useState('high');
  const [conditionLabel, setConditionLabel] = useState('Task Priority is High');
  const [actionType, setActionType] = useState<AutomationActionType>('deal_boss_damage');
  const [actionLabel, setActionLabel] = useState('Deal 150 DMG to Active Boss');
  const [actionValue, setActionValue] = useState<number | string>(150);
  const [iconName, setIconName] = useState('Zap');

  const handleTriggerChange = (type: AutomationTriggerType) => {
    setTriggerType(type);
    switch (type) {
      case 'task_completed':
        setTriggerLabel('Task Marked Completed');
        setConditionField('priority');
        setConditionValue('high');
        setConditionLabel('Priority is High');
        break;
      case 'habit_streak_reached':
        setTriggerLabel('Habit Streak Milestone Reached');
        setConditionField('streak');
        setConditionValue(7);
        setConditionLabel('Streak is at least 7 days');
        break;
      case 'trade_logged':
        setTriggerLabel('Journaled Trade Recorded');
        setConditionField('pnl');
        setConditionValue(0);
        setConditionLabel('Trade Result is Loss (< 0)');
        break;
      case 'lesson_passed':
        setTriggerLabel('Course Lab Quiz Completed');
        setConditionField('score');
        setConditionValue(100);
        setConditionLabel('Score equals 100%');
        break;
      case 'biometric_threshold':
        setTriggerLabel('Morning Biometric Sync Finished');
        setConditionField('sleepScore');
        setConditionValue(85);
        setConditionLabel('Sleep Score >= 85%');
        break;
      case 'scheduled_time':
        setTriggerLabel('Every day at 21:00');
        setHasCondition(false);
        break;
    }
  };

  const handleActionChange = (type: AutomationActionType) => {
    setActionType(type);
    switch (type) {
      case 'deal_boss_damage':
        setActionLabel('Deal 150 Critical DMG to Boss');
        setActionValue(150);
        setIconName('Swords');
        break;
      case 'replenish_streak_shield':
        setActionLabel('Replenish 1 Streak Shield');
        setActionValue(1);
        setIconName('ShieldCheck');
        break;
      case 'award_perk_points':
        setActionLabel('Grant 1 Skill Perk Point');
        setActionValue(1);
        setIconName('Zap');
        break;
      case 'grant_xp':
        setActionLabel('Grant +100 Bonus XP');
        setActionValue(100);
        setIconName('Activity');
        break;
      case 'trigger_ai_safeguard':
        setActionLabel('Deploy AI Risk Protocol');
        setActionValue('safeguard_lock');
        setIconName('AlertTriangle');
        break;
      case 'send_push_notification':
        setActionLabel('Dispatch Instant Notification');
        setActionValue('instant_alert');
        setIconName('Clock');
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateRule({
      title: title.trim(),
      description: description.trim() || `Auto-triggers ${actionLabel} whenever ${triggerLabel}.`,
      enabled: true,
      category,
      trigger: {
        type: triggerType,
        label: triggerLabel,
      },
      condition: hasCondition
        ? {
            field: conditionField,
            operator: conditionOperator,
            value: conditionValue,
            label: conditionLabel,
          }
        : undefined,
      action: {
        type: actionType,
        label: actionLabel,
        value: actionValue,
      },
      iconName,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Life Automation Recipe" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <Input
            label="Recipe Name"
            placeholder="e.g., Deep Focus Boss Finisher"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              Category
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['execution', 'discipline', 'trading', 'learning', 'health'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all ${
                    category === cat
                      ? 'bg-amber-500 text-neutral-950 border-amber-500'
                      : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pipeline Config */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>Event Pipeline Construction</span>
            </div>

            {/* 1. Trigger */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                1. When this Trigger Event happens (IF):
              </label>
              <select
                value={triggerType}
                onChange={(e) => handleTriggerChange(e.target.value as AutomationTriggerType)}
                className="w-full text-xs font-medium rounded-xl p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
              >
                <option value="task_completed">Task Completed</option>
                <option value="habit_streak_reached">Habit Streak Milestone</option>
                <option value="trade_logged">Trading Journal Entry Saved</option>
                <option value="lesson_passed">Course Lab Quiz Passed</option>
                <option value="biometric_threshold">Morning Biometric Wearable Sync</option>
                <option value="scheduled_time">Scheduled Time / Daily Cron</option>
              </select>
            </div>

            {/* 2. Action */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                2. Execute this Autonomous Action (THEN):
              </label>
              <select
                value={actionType}
                onChange={(e) => handleActionChange(e.target.value as AutomationActionType)}
                className="w-full text-xs font-medium rounded-xl p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
              >
                <option value="deal_boss_damage">Deal Real Combat Damage to Boss Raid</option>
                <option value="replenish_streak_shield">Replenish Streak Shield</option>
                <option value="award_perk_points">Award Skill Perk Points</option>
                <option value="grant_xp">Grant Bonus XP</option>
                <option value="trigger_ai_safeguard">Deploy AI Safety Protocol & Lock Terminal</option>
                <option value="send_push_notification">Send Push Notification</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            <Plus className="w-4 h-4 mr-1.5" /> Deploy Automation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
