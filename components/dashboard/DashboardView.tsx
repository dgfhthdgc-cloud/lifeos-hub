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
import { Phase9QuickCard } from './Phase9QuickCard';
import { Phase10QuickCard } from './Phase10QuickCard';
import { AddTaskModal } from './AddTaskModal';

interface DashboardViewProps {
  onNavigate: (path: RoutePath) => void;
}

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

  const xpEarnedToday = Storage.getXpTransactions()
    .filter((tx) => getLocalDateString(new Date(tx.timestamp)) === getLocalDateString())
    .reduce((sum, tx) => sum + Math.max(0, tx.amount), 0);

  const handleToggleTask = (taskId: string) => {
    const { task, xpAwarded } = Storage.toggleTask(taskId);
    loadData();

    if (task?.completed && xpAwarded > 0) {
      Storage.updateQuestProgress('tasks_completed', 1);
      Storage.updateQuestProgress('xp_earned', xpAwarded);
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
      Storage.updateQuestProgress('habits_checked', 1);
      Storage.updateQuestProgress('xp_earned', xpAwarded);
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
      dueDate: getLocalDateString(),
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
      <GreetingHeader
        onNavigate={onNavigate}
        onAddTaskClick={() => setIsAddTaskOpen(true)}
      />

      {insight && (
        <AICoachInsightWidget insight={insight} onNavigate={onNavigate} />
      )}

      <ProgressOverview
        tasks={tasks}
        habits={habits}
        streakDays={user?.streakDays || 0}
        xpEarnedToday={xpEarnedToday}
      />

      <BossRaidQuickCard onNavigate={onNavigate} />

      <Phase9QuickCard onNavigate={onNavigate} />

      <Phase10QuickCard onNavigate={onNavigate} />

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GoalsWidget goals={goals} onNavigate={onNavigate} />
        <LearningWidget courses={courses} onNavigate={onNavigate} />
        <TradingWatchlistWidget watchlist={watchlist} onNavigate={onNavigate} />
      </div>

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
      />
    </div>
  );
}
