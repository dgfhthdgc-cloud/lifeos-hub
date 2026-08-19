import React, { useState, useEffect } from 'react';
import {
  RoutePath,
  TaskSummary,
  HabitSummary,
  GoalSummary,
  CourseSummary,
  WatchlistSummaryItem,
  AIInsightSummary,
  TaskItem,
  HabitItem,
  GoalItem,
  NextBestAction,
  UnifiedActivityEvent,
} from '../../types';
import { Storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { NextBestActionEngine } from '../../lib/nextBestAction';
import { UnifiedActivityTimelineEngine } from '../../lib/activityTimeline';
import { GreetingHeader } from './GreetingHeader';
import { NextBestActionWidget } from './NextBestActionWidget';
import { ProgressOverview } from './ProgressOverview';
import { ScheduleWidget } from './ScheduleWidget';
import { HabitsWidget } from './HabitsWidget';
import { GoalsWidget } from './GoalsWidget';
import { LearningWidget } from './LearningWidget';
import { TradingWatchlistWidget } from './TradingWatchlistWidget';
import { AICoachInsightWidget } from './AICoachInsightWidget';
import { BossRaidQuickCard } from './BossRaidQuickCard';
import { UnifiedActivityTimeline } from './UnifiedActivityTimeline';
import { AddTaskModal } from './AddTaskModal';

interface DashboardViewProps {
  onNavigate: (path: RoutePath) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { user, addXp } = useAuth();
  const { showToast } = useNotifications();

  const [rawTasks, setRawTasks] = useState<TaskItem[]>([]);
  const [rawHabits, setRawHabits] = useState<HabitItem[]>([]);
  const [rawGoals, setRawGoals] = useState<GoalItem[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistSummaryItem[]>([]);
  const [insight, setInsight] = useState<AIInsightSummary | null>(null);
  const [nextBestActions, setNextBestActions] = useState<NextBestAction[]>([]);
  const [activityEvents, setActivityEvents] = useState<UnifiedActivityEvent[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  const loadData = () => {
    setRawTasks(Storage.getTasks());
    setRawHabits(Storage.getHabits());
    setRawGoals(Storage.getGoals());
    setCourses(Storage.getCourses());
    setWatchlist(Storage.getWatchlist());
    setInsight(Storage.getAIInsight());
    setNextBestActions(NextBestActionEngine.computeNextBestActions(3));
    setActivityEvents(UnifiedActivityTimelineEngine.getTimelineEvents(15));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute XP earned today from ledger transactions or completed daily items
  const todayDateStr = new Date().toISOString().split('T')[0];
  const xpTransactions = Storage.getXpTransactions();
  const xpEarnedToday = xpTransactions
    .filter((tx) => tx.timestamp && tx.timestamp.startsWith(todayDateStr))
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  // Map to summaries
  const tasks: TaskSummary[] = rawTasks.map((t) => ({
    id: t.id,
    title: t.title,
    time: t.time,
    dueTime: t.endTime,
    priority: t.priority,
    completed: t.completed,
    category: t.category,
    xp: t.xp,
  }));

  const habits: HabitSummary[] = rawHabits.map((h) => ({
    id: h.id,
    name: h.name,
    category: h.category,
    streak: h.currentStreak,
    completedToday: h.completedToday,
    target: h.target,
    xp: h.xp,
  }));

  const goals: GoalSummary[] = rawGoals.map((g) => ({
    id: g.id,
    title: g.title,
    category: g.category,
    progress: g.progress,
    totalMilestones: g.milestones.length,
    completedMilestones: g.milestones.filter((m) => m.completed).length,
    targetDate: g.deadline || g.quarter || 'Q3 2026',
  }));

  const handleToggleTask = (taskId: string) => {
    const { task, xpAwarded } = Storage.toggleTask(taskId);
    loadData();

    if (task?.completed && xpAwarded > 0) {
      addXp(xpAwarded, `Completed task: ${task.title}`);
      showToast({
        title: 'Task Completed!',
        description: `${task.title} • +${xpAwarded} XP awarded`,
        type: 'xp',
        xpAmount: xpAwarded,
      });
    }
  };

  const handleToggleHabit = (habitId: string) => {
    const { habit, xpAwarded } = Storage.toggleHabitDay(habitId);
    loadData();

    if (habit?.completedToday && xpAwarded > 0) {
      addXp(xpAwarded, `Habit completed: ${habit.name}`);
      showToast({
        title: `Habit Checked: ${habit.name}! 🔥`,
        description: `${habit.currentStreak} day streak maintained. +${xpAwarded} XP awarded`,
        type: 'xp',
        xpAmount: xpAwarded,
      });
    }
  };

  const handleExecutePrimaryAction = (action: NextBestAction) => {
    if (action.type === 'habit' && action.entityId) {
      handleToggleHabit(action.entityId);
    } else if (action.type === 'task' && action.entityId) {
      handleToggleTask(action.entityId);
    } else {
      onNavigate(action.targetPath);
    }
  };

  const handleAddTask = (newTaskData: Omit<TaskSummary, 'id' | 'completed'>) => {
    Storage.createTask({
      title: newTaskData.title,
      dueDate: new Date().toISOString().split('T')[0],
      time: newTaskData.time || '09:00 AM',
      priority: newTaskData.priority,
      status: 'todo',
      category: newTaskData.category,
      tags: ['#today'],
      xp: newTaskData.xp || 25,
      completed: false,
    });
    loadData();
    showToast({
      title: 'Task Scheduled',
      description: `${newTaskData.title} added to execution plan.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Command Center Telemetry Header */}
      <GreetingHeader
        onNavigate={onNavigate}
        onAddTaskClick={() => setIsAddTaskOpen(true)}
        habits={rawHabits}
        goals={rawGoals}
      />

      {/* 2. Deterministic Next Best Action Priority Showcase */}
      <NextBestActionWidget
        actions={nextBestActions}
        onNavigate={onNavigate}
        onExecutePrimary={handleExecutePrimaryAction}
      />

      {/* 3. Progress Overview Metrics (Live XP, Streak Shields, Level Velocity) */}
      <ProgressOverview
        tasks={tasks}
        habits={habits}
        streakDays={user?.streakDays || 24}
        xpEarnedToday={xpEarnedToday}
      />

      {/* 4. AI Strategic Pulse Insight */}
      {insight && (
        <AICoachInsightWidget insight={insight} onNavigate={onNavigate} />
      )}

      {/* 5. Core Execution Dual Grid: Schedule + Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScheduleWidget
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onNavigate={onNavigate}
        />
        <HabitsWidget
          habits={habits}
          onToggleHabit={handleToggleHabit}
          onNavigate={onNavigate}
        />
      </div>

      {/* 6. Strategic Timeline & Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UnifiedActivityTimeline
          events={activityEvents}
          onNavigate={onNavigate}
          maxDisplay={8}
        />
        <GoalsWidget goals={goals} onNavigate={onNavigate} />
      </div>

      {/* 7. Skill Mastery & World Systems Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LearningWidget courses={courses} onNavigate={onNavigate} />
        <BossRaidQuickCard onNavigate={onNavigate} />
        <TradingWatchlistWidget watchlist={watchlist} onNavigate={onNavigate} />
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
      />
    </div>
  );
}
