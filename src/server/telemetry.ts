export interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: 'api_request' | 'db_operation' | 'ai_generation' | 'domain_event' | 'client_error' | 'funnel_step' | 'nba_interaction' | 'user_feedback';
  userId?: string;
  durationMs?: number;
  statusCode?: number;
  route?: string;
  category?: string;
  status?: 'success' | 'failure' | 'conflict' | 'rate_limited';
  metadata?: Record<string, any>;
}

export interface UserFeedbackEntry {
  id: string;
  userId: string;
  timestamp: string;
  rating: number; // 1 to 5
  type: 'csat' | 'nps' | 'ai_coach' | 'nba' | 'general';
  category?: string;
  comment?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface FunnelMetrics {
  signups: number;
  goalsCreated: number;
  tasksCreated: number;
  habitsCreated: number;
  firstTaskCompletions: number;
  firstHabitCompletions: number;
  firstGoalMilestoneCompletions: number;
  conversionRates: {
    signupToGoalPct: number;
    goalToTaskPct: number;
    taskToFirstCompletionPct: number;
    overallActivationPct: number;
  };
}

export interface RetentionCohort {
  d1Active: number;
  d3Active: number;
  d7Active: number;
  d14Active: number;
  d30Active: number;
  d1RatePct: number;
  d3RatePct: number;
  d7RatePct: number;
  d14RatePct: number;
  d30RatePct: number;
}

export interface TelemetryAggregateMetrics {
  uptimeSeconds: number;
  totalRequests: number;
  totalErrors: number;
  errorRatePct: number;
  latencyPercentiles: {
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
  };
  statusCodes: Record<string, number>;
  routeLatencies: Record<string, { count: number; avgMs: number; errorCount: number }>;
  aiMetrics: {
    totalQueries: number;
    successCount: number;
    fallbackCount: number;
    avgLatencyMs: number;
  };
  domainEventMetrics: {
    totalEvents: number;
    byType: Record<string, number>;
  };
  funnel: FunnelMetrics;
  retention: RetentionCohort;
  feedback: {
    totalFeedback: number;
    averageRating: number;
    npsScore: number;
    ratingBreakdown: Record<number, number>;
    recentComments: Array<{ rating: number; type: string; comment: string; timestamp: string }>;
  };
}

const MAX_BUFFER_SIZE = 5000;
const MAX_FEEDBACK_SIZE = 500;

class ServerTelemetryManager {
  private events: TelemetryEvent[] = [];
  private feedbackEntries: UserFeedbackEntry[] = [];
  private startTime = Date.now();

  // Route specific metrics
  private routeStats = new Map<string, { totalMs: number; count: number; errors: number }>();
  private statusCodes: Record<string, number> = {};
  private latencies: number[] = [];

  // Funnel tracking sets
  private usersSignedUp = new Set<string>();
  private usersWithGoals = new Set<string>();
  private usersWithTasks = new Set<string>();
  private usersWithHabits = new Set<string>();
  private usersWithCompletedTasks = new Set<string>();
  private usersWithCompletedHabits = new Set<string>();
  private usersWithCompletedGoals = new Set<string>();

  // Retention tracking (user -> active days Set)
  private userActiveDates = new Map<string, Set<string>>();
  private userSignupDates = new Map<string, string>();

  // AI metrics
  private aiTotal = 0;
  private aiSuccess = 0;
  private aiFallback = 0;
  private aiLatencies: number[] = [];

  // Domain events
  private domainEventsCount = 0;
  private domainEventsByType: Record<string, number> = {};

  public recordEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): void {
    const fullEvent: TelemetryEvent = {
      id: event.id || `telem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: event.timestamp || new Date().toISOString(),
      ...event,
    };

    this.events.push(fullEvent);
    if (this.events.length > MAX_BUFFER_SIZE) {
      this.events.splice(0, this.events.length - MAX_BUFFER_SIZE);
    }

    // Process specialized event aggregations
    if (fullEvent.type === 'api_request') {
      const duration = fullEvent.durationMs || 0;
      this.latencies.push(duration);
      if (this.latencies.length > 5000) {
        this.latencies.splice(0, 1000);
      }

      if (fullEvent.statusCode) {
        const codeKey = String(fullEvent.statusCode);
        this.statusCodes[codeKey] = (this.statusCodes[codeKey] || 0) + 1;
      }

      if (fullEvent.route) {
        const existing = this.routeStats.get(fullEvent.route) || { totalMs: 0, count: 0, errors: 0 };
        existing.totalMs += duration;
        existing.count += 1;
        if (fullEvent.statusCode && fullEvent.statusCode >= 400) {
          existing.errors += 1;
        }
        this.routeStats.set(fullEvent.route, existing);
      }
    }

    if (fullEvent.type === 'ai_generation') {
      this.aiTotal += 1;
      if (fullEvent.status === 'success') {
        this.aiSuccess += 1;
      } else {
        this.aiFallback += 1;
      }
      if (fullEvent.durationMs) {
        this.aiLatencies.push(fullEvent.durationMs);
        if (this.aiLatencies.length > 1000) {
          this.aiLatencies.splice(0, 200);
        }
      }
    }

    if (fullEvent.type === 'domain_event') {
      this.domainEventsCount += 1;
      const cat = fullEvent.category || 'unknown';
      this.domainEventsByType[cat] = (this.domainEventsByType[cat] || 0) + 1;
    }

    // Funnel events
    if (fullEvent.userId) {
      this.recordUserActivity(fullEvent.userId, fullEvent.timestamp);
    }
  }

  public recordFunnelStep(userId: string, step: 'signup' | 'goal_created' | 'task_created' | 'habit_created' | 'task_completed' | 'habit_completed' | 'goal_completed'): void {
    const today = new Date().toISOString().slice(0, 10);
    this.recordUserActivity(userId);

    switch (step) {
      case 'signup':
        this.usersSignedUp.add(userId);
        if (!this.userSignupDates.has(userId)) {
          this.userSignupDates.set(userId, today);
        }
        break;
      case 'goal_created':
        this.usersWithGoals.add(userId);
        break;
      case 'task_created':
        this.usersWithTasks.add(userId);
        break;
      case 'habit_created':
        this.usersWithHabits.add(userId);
        break;
      case 'task_completed':
        this.usersWithCompletedTasks.add(userId);
        break;
      case 'habit_completed':
        this.usersWithCompletedHabits.add(userId);
        break;
      case 'goal_completed':
        this.usersWithCompletedGoals.add(userId);
        break;
    }

    this.recordEvent({
      type: 'funnel_step',
      userId,
      category: step,
      status: 'success',
      metadata: { step },
    });
  }

  public recordUserActivity(userId: string, timestampStr?: string): void {
    const dateStr = (timestampStr ? new Date(timestampStr) : new Date()).toISOString().slice(0, 10);
    let dates = this.userActiveDates.get(userId);
    if (!dates) {
      dates = new Set<string>();
      this.userActiveDates.set(userId, dates);
    }
    dates.add(dateStr);

    if (!this.userSignupDates.has(userId)) {
      this.userSignupDates.set(userId, dateStr);
    }
  }

  public recordFeedback(entry: Omit<UserFeedbackEntry, 'id' | 'timestamp'>): UserFeedbackEntry {
    const newEntry: UserFeedbackEntry = {
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.feedbackEntries.unshift(newEntry);
    if (this.feedbackEntries.length > MAX_FEEDBACK_SIZE) {
      this.feedbackEntries.pop();
    }

    this.recordEvent({
      type: 'user_feedback',
      userId: entry.userId,
      category: entry.type,
      metadata: { rating: entry.rating, category: entry.category },
    });

    return newEntry;
  }

  public getFeedback(): UserFeedbackEntry[] {
    return [...this.feedbackEntries];
  }

  public getMetrics(): TelemetryAggregateMetrics {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const totalRequests = this.latencies.length;
    
    // Status codes & errors
    let totalErrors = 0;
    for (const [code, count] of Object.entries(this.statusCodes)) {
      if (Number(code) >= 400) {
        totalErrors += count;
      }
    }
    const errorRatePct = totalRequests > 0 ? Number(((totalErrors / totalRequests) * 100).toFixed(2)) : 0;

    // Percentiles
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const avgMs = sorted.length > 0 ? Number((sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(1)) : 0;
    const p50Ms = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.5)] : 0;
    const p95Ms = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] : 0;
    const p99Ms = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.99)] : 0;

    // Route latencies
    const routeLatencies: Record<string, { count: number; avgMs: number; errorCount: number }> = {};
    for (const [route, stats] of this.routeStats.entries()) {
      routeLatencies[route] = {
        count: stats.count,
        avgMs: stats.count > 0 ? Number((stats.totalMs / stats.count).toFixed(1)) : 0,
        errorCount: stats.errors,
      };
    }

    // AI Metrics
    const aiAvgLatency = this.aiLatencies.length > 0
      ? Number((this.aiLatencies.reduce((a, b) => a + b, 0) / this.aiLatencies.length).toFixed(1))
      : 0;

    // Funnel Calculations
    const signups = Math.max(1, this.usersSignedUp.size);
    const goals = this.usersWithGoals.size;
    const tasks = this.usersWithTasks.size;
    const completions = this.usersWithCompletedTasks.size;

    const funnel: FunnelMetrics = {
      signups: this.usersSignedUp.size,
      goalsCreated: this.usersWithGoals.size,
      tasksCreated: this.usersWithTasks.size,
      habitsCreated: this.usersWithHabits.size,
      firstTaskCompletions: this.usersWithCompletedTasks.size,
      firstHabitCompletions: this.usersWithCompletedHabits.size,
      firstGoalMilestoneCompletions: this.usersWithCompletedGoals.size,
      conversionRates: {
        signupToGoalPct: Number(((goals / signups) * 100).toFixed(1)),
        goalToTaskPct: goals > 0 ? Number(((tasks / goals) * 100).toFixed(1)) : 0,
        taskToFirstCompletionPct: tasks > 0 ? Number(((completions / tasks) * 100).toFixed(1)) : 0,
        overallActivationPct: Number(((completions / signups) * 100).toFixed(1)),
      },
    };

    // Retention Calculations (D1, D3, D7, D14, D30)
    let d1Count = 0;
    let d3Count = 0;
    let d7Count = 0;
    let d14Count = 0;
    let d30Count = 0;

    const totalTrackedUsers = Math.max(1, this.userSignupDates.size);

    for (const [userId, signupDate] of this.userSignupDates.entries()) {
      const activeDates = this.userActiveDates.get(userId);
      if (!activeDates) continue;

      const signupMs = new Date(signupDate).getTime();
      for (const activeDate of activeDates) {
        const diffDays = Math.floor((new Date(activeDate).getTime() - signupMs) / (1000 * 60 * 60 * 24));
        if (diffDays >= 1) d1Count++;
        if (diffDays >= 3) d3Count++;
        if (diffDays >= 7) d7Count++;
        if (diffDays >= 14) d14Count++;
        if (diffDays >= 30) d30Count++;
      }
    }

    const retention: RetentionCohort = {
      d1Active: d1Count,
      d3Active: d3Count,
      d7Active: d7Count,
      d14Active: d14Count,
      d30Active: d30Count,
      d1RatePct: Number(((d1Count / totalTrackedUsers) * 100).toFixed(1)),
      d3RatePct: Number(((d3Count / totalTrackedUsers) * 100).toFixed(1)),
      d7RatePct: Number(((d7Count / totalTrackedUsers) * 100).toFixed(1)),
      d14RatePct: Number(((d14Count / totalTrackedUsers) * 100).toFixed(1)),
      d30RatePct: Number(((d30Count / totalTrackedUsers) * 100).toFixed(1)),
    };

    // Feedback calculations
    const feedbackCount = this.feedbackEntries.length;
    const avgRating = feedbackCount > 0
      ? Number((this.feedbackEntries.reduce((sum, f) => sum + f.rating, 0) / feedbackCount).toFixed(2))
      : 5.0;

    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let promoters = 0;
    let detractors = 0;

    for (const fb of this.feedbackEntries) {
      ratingBreakdown[fb.rating] = (ratingBreakdown[fb.rating] || 0) + 1;
      if (fb.rating >= 4) promoters++;
      if (fb.rating <= 2) detractors++;
    }

    const npsScore = feedbackCount > 0
      ? Math.round(((promoters - detractors) / feedbackCount) * 100)
      : 100;

    const recentComments = this.feedbackEntries
      .filter((f) => f.comment && f.comment.trim().length > 0)
      .slice(0, 5)
      .map((f) => ({
        rating: f.rating,
        type: f.type,
        comment: f.comment!,
        timestamp: f.timestamp,
      }));

    return {
      uptimeSeconds,
      totalRequests,
      totalErrors,
      errorRatePct,
      latencyPercentiles: { avgMs, p50Ms, p95Ms, p99Ms },
      statusCodes: this.statusCodes,
      routeLatencies,
      aiMetrics: {
        totalQueries: this.aiTotal,
        successCount: this.aiSuccess,
        fallbackCount: this.aiFallback,
        avgLatencyMs: aiAvgLatency,
      },
      domainEventMetrics: {
        totalEvents: this.domainEventsCount,
        byType: this.domainEventsByType,
      },
      funnel,
      retention,
      feedback: {
        totalFeedback: feedbackCount,
        averageRating: avgRating,
        npsScore,
        ratingBreakdown,
        recentComments,
      },
    };
  }

  public reset(): void {
    this.events = [];
    this.feedbackEntries = [];
    this.latencies = [];
    this.routeStats.clear();
    this.statusCodes = {};
    this.usersSignedUp.clear();
    this.usersWithGoals.clear();
    this.usersWithTasks.clear();
    this.usersWithHabits.clear();
    this.usersWithCompletedTasks.clear();
    this.usersWithCompletedHabits.clear();
    this.usersWithCompletedGoals.clear();
    this.userActiveDates.clear();
    this.userSignupDates.clear();
    this.aiTotal = 0;
    this.aiSuccess = 0;
    this.aiFallback = 0;
    this.aiLatencies = [];
    this.domainEventsCount = 0;
    this.domainEventsByType = {};
  }
}

export const serverTelemetry = new ServerTelemetryManager();
