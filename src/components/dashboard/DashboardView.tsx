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
} from '../../types';
import { Storage } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { GreetingHeader } from './GreetingHeader';
import { ProgressOverview } from './ProgressOverview';
import { ScheduleWidget } from './ScheduleWidget';
import { HabitsWidget } from './HabitsWidget';
import { GoalsWidget } from './GoalsWidget';
import { LearningWidget } from './LearningWidget';
import { TradingWatchlistWidget } from './TradingWatchlistWidget';
import { AICoachInsightWidget } from './AICoachInsightWidget';
import { BossRaidQuickCard } from './BossRaidQuickCard';
import { CurrentFocus } from './CurrentFocus';
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
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  const loadData = () => {
    setRawTasks(Storage.getTasks());
    setRawHabits(Storage.getHabits());
    setRawGoals(Storage.getGoals());
    setCourses(Storage.getCourses());
    setWatchlist(Storage.getWatchlist());
    setInsight(Storage.getAIInsight());
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
    targetDate: g.deadline,
  }));

  const handleToggleTask = (taskId: string) => {
    const { task, xpAwarded } = Storage.toggleTask(taskId);
    loadData();

    if (task?.completed && xpAwarded > 0) {
      addXp(xpAwarded, `Completed task: ${task.title}`);
      showToast({
        title: 'Task Completed!',
        description: task.title,
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
        description: `${habit.currentStreak} day streak maintained.`,
        type: 'xp',
        xpAmount: xpAwarded,
      });
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
      {/* 1. Greeting & Date Banner */}
      <GreetingHeader
        onNavigate={onNavigate}
        onAddTaskClick={() => setIsAddTaskOpen(true)}
      />

      {/* 2. AI Coach Proactive Insight */}
      {insight && (
        <AICoachInsightWidget insight={insight} onNavigate={onNavigate} />
      )}

      {/* 3. Progress Overview Metrics (Live XP & Streaks) */}
      <ProgressOverview
        tasks={tasks}
        habits={habits}
        streakDays={user?.streakDays || 24}
        xpEarnedToday={xpEarnedToday}
      />

      {/* 4. Current Focus: Highest Priority Incomplete Objective */}
      <CurrentFocus
        tasks={rawTasks}
        goals={rawGoals}
        onToggleTask={handleToggleTask}
        onNavigate={onNavigate}
        onAddTaskClick={() => setIsAddTaskOpen(true)}
      />

      {/* 5. Core Execution Grid: Schedule + Habits */}
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

      {/* 6. Strategic Grid: Goals + Learning + Trading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GoalsWidget goals={goals} onNavigate={onNavigate} />
        <LearningWidget courses={courses} onNavigate={onNavigate} />
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
