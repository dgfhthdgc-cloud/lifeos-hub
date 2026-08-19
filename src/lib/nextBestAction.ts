import { NextBestAction, TaskItem, HabitItem, GoalItem, CourseSummary } from '../types';
import { Storage } from './storage';

export class NextBestActionEngine {
  /**
   * Deterministically computes the top Next Best Actions for the user
   * by analyzing goals, deadlines, streak risks, pending tasks, and learning courses.
   */
  public static computeNextBestActions(limit: number = 3): NextBestAction[] {
    const tasks = Storage.getTasks();
    const habits = Storage.getHabits();
    const goals = Storage.getGoals();
    const courses = Storage.getCourses();
    const user = Storage.getUser();
    const activeBoss = Storage.getBossBattles().find((b) => !b.defeated);

    const candidates: NextBestAction[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const hoursRemainingInDay = Math.max(1, 24 - currentHour);

    // -------------------------------------------------------------
    // 1. EVALUATE HABIT STREAK RISKS
    // -------------------------------------------------------------
    const pendingHabits = habits.filter((h) => !h.completedToday);
    // Sort by highest streak first (most at risk of losing momentum)
    pendingHabits.sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));

    for (const habit of pendingHabits) {
      const streak = habit.currentStreak || 0;
      const urgency = streak >= 5 ? 'critical' : streak >= 1 ? 'high' : 'medium';
      const priorityScore = 85 + Math.min(14, streak * 2);

      candidates.push({
        id: `nba-habit-${habit.id}`,
        type: 'habit',
        title: `Execute Habit: ${habit.name}`,
        subtitle: `${habit.target} • ${habit.category}`,
        urgency,
        priorityScore,
        why: streak > 0
          ? `Your ${streak}-day streak is at risk of breaking if not checked today (${hoursRemainingInDay}h remaining).`
          : `Daily consistency ritual pending for ${habit.name}.`,
        strategicImpact: `Secures ${streak + 1}-day streak momentum • +${habit.xp} XP • 75 Boss Damage`,
        targetPath: '/habits',
        entityId: habit.id,
        estimatedMinutes: 15,
        xpReward: habit.xp || 30,
        bossDamage: 75,
        streakRisk: {
          habitName: habit.name,
          currentStreak: streak,
          hoursRemaining: hoursRemainingInDay,
        },
        aiRationale: `Maintaining habit density is the single highest predictor of quarterly goal attainment. Checking ${habit.name} immediately reinforces identity consistency and protects streak shields.`,
      });
    }

    // -------------------------------------------------------------
    // 2. EVALUATE HIGH-PRIORITY & GOAL-LINKED TASKS
    // -------------------------------------------------------------
    const pendingTasks = tasks.filter((t) => !t.completed);
    
    // Sort pending tasks: High priority first, then linked to goals
    pendingTasks.sort((a, b) => {
      const pScore = (p: string) => (p === 'high' ? 3 : p === 'medium' ? 2 : 1);
      return pScore(b.priority) - pScore(a.priority);
    });

    for (const task of pendingTasks) {
      const linkedGoal = goals.find((g) => g.id === task.goalId);
      const isHighPriority = task.priority === 'high';
      
      let baseScore = isHighPriority ? 80 : task.priority === 'medium' ? 65 : 45;
      if (linkedGoal) baseScore += 12;

      const urgency = isHighPriority ? 'critical' : task.priority === 'medium' ? 'high' : 'medium';

      candidates.push({
        id: `nba-task-${task.id}`,
        type: 'task',
        title: task.title,
        subtitle: `${task.time || 'Scheduled'} • ${task.category}`,
        urgency,
        priorityScore: baseScore,
        why: linkedGoal
          ? `Direct milestone dependency for strategic goal "${linkedGoal.title}".`
          : isHighPriority
          ? `High-priority tactical deliverable slated for today's focus block.`
          : `Standard scheduled task in ${task.category}.`,
        strategicImpact: `+${task.xp} XP • ${isHighPriority ? '120' : '60'} Boss Raid Damage • Reduces schedule debt`,
        targetPath: '/planner',
        entityId: task.id,
        goalId: linkedGoal?.id,
        goalTitle: linkedGoal?.title,
        estimatedMinutes: 45,
        xpReward: task.xp || 50,
        bossDamage: isHighPriority ? 120 : 60,
        aiRationale: linkedGoal
          ? `Completing "${task.title}" directly unblocks progression on ${linkedGoal.title} (${linkedGoal.progress}% complete). Focus deep cognitive energy here.`
          : `Executing high-gravity tasks early in your day prevents decision fatigue and triggers dopamine momentum.`,
      });
    }

    // -------------------------------------------------------------
    // 3. EVALUATE STRATEGIC GOAL MILESTONES
    // -------------------------------------------------------------
    const activeGoals = goals.filter((g) => !g.completed && g.progress < 100);
    for (const goal of activeGoals) {
      const pendingMilestones = goal.milestones.filter((m) => !m.completed);
      if (pendingMilestones.length > 0) {
        const nextMilestone = pendingMilestones[0];
        candidates.push({
          id: `nba-milestone-${goal.id}-${nextMilestone.id}`,
          type: 'milestone',
          title: `Advance Goal: ${nextMilestone.title}`,
          subtitle: `${goal.title} (${goal.progress}% complete)`,
          urgency: goal.progress < 30 ? 'high' : 'medium',
          priorityScore: 72 + Math.round((100 - goal.progress) * 0.15),
          why: `Quarterly target "${goal.title}" has ${pendingMilestones.length} milestones remaining.`,
          strategicImpact: `Advances "${goal.title}" by +${Math.round(100 / (goal.milestones.length || 1))}% • +${nextMilestone.xpReward || 75} XP • 250 Boss Damage`,
          targetPath: '/goals',
          entityId: goal.id,
          goalId: goal.id,
          goalTitle: goal.title,
          estimatedMinutes: 60,
          xpReward: nextMilestone.xpReward || 75,
          bossDamage: 250,
          aiRationale: `Milestone momentum compounds. Advancing ${nextMilestone.title} moves ${goal.title} closer to completion and triggers high-tier progression bonuses.`,
        });
      }
    }

    // -------------------------------------------------------------
    // 4. EVALUATE ACTIVE LEARNING / COURSES
    // -------------------------------------------------------------
    const inProgressCourses = courses.filter((c) => c.progress < 100);
    for (const course of inProgressCourses) {
      candidates.push({
        id: `nba-learn-${course.id}`,
        type: 'learning',
        title: `Study Session: ${course.title}`,
        subtitle: `${course.category} • ${course.progress}% Completed`,
        urgency: 'medium',
        priorityScore: 55 + Math.round(course.progress * 0.2),
        why: `Active skill track in ${course.category}. Maintaining study cadence accelerates mastery.`,
        strategicImpact: `+60 XP • 100 Boss Raid Damage • Unlocks advanced skill perks`,
        targetPath: '/learn',
        entityId: course.id,
        estimatedMinutes: 30,
        xpReward: 60,
        bossDamage: 100,
        aiRationale: `Deliberate practice creates high neural retention. A 30-minute study block in ${course.title} keeps cognitive velocity sharp.`,
      });
    }

    // -------------------------------------------------------------
    // 5. SORT BY HIGHEST PRIORITY SCORE & RETURN TOP ACTIONS
    // -------------------------------------------------------------
    candidates.sort((a, b) => b.priorityScore - a.priorityScore);

    if (candidates.length === 0) {
      // Fallback: If everything is completed
      return [
        {
          id: 'nba-all-clear',
          type: 'review',
          title: 'Daily Objectives Clear: Review & Strategize',
          subtitle: 'All immediate tasks & habits are accomplished!',
          urgency: 'normal',
          priorityScore: 100,
          why: 'You have cleared all active obligations and secured all daily streaks for today.',
          strategicImpact: 'Strategic reflection • Plan tomorrow in Planner or consult AI Coach',
          targetPath: '/ai',
          estimatedMinutes: 10,
          xpReward: 50,
          bossDamage: 50,
          aiRationale: 'Exceptional execution velocity. Use this calm window to reflect with your AI Coach or queue tomorrow’s high-impact milestones.',
        },
      ];
    }

    return candidates.slice(0, limit);
  }

  /**
   * Primary top Next Best Action
   */
  public static getPrimaryAction(): NextBestAction {
    const actions = this.computeNextBestActions(1);
    return actions[0];
  }
}
