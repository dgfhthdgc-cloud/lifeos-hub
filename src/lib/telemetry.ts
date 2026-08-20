export interface ClientTelemetryEvent {
  type: 'api_request' | 'db_operation' | 'ai_generation' | 'domain_event' | 'client_error' | 'funnel_step' | 'nba_interaction' | 'user_feedback';
  category?: string;
  durationMs?: number;
  statusCode?: number;
  route?: string;
  status?: 'success' | 'failure' | 'conflict' | 'rate_limited';
  metadata?: Record<string, any>;
  timestamp?: string;
}

class ClientTelemetryTracker {
  private queue: ClientTelemetryEvent[] = [];
  private flushTimer: any = null;
  private isFlushing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flushSync());
    }
  }

  public record(event: ClientTelemetryEvent): void {
    this.queue.push({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });

    if (this.queue.length >= 20) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null;
        this.flush();
      }, 5000);
    }
  }

  public recordNBAInteraction(actionId: string, actionType: string, outcome: 'clicked' | 'dismissed' | 'completed'): void {
    this.record({
      type: 'nba_interaction',
      category: actionType,
      metadata: { actionId, outcome },
    });
  }

  public recordAICoachRating(messageId: string, rating: 'helpful' | 'unhelpful', comments?: string): void {
    this.record({
      type: 'user_feedback',
      category: 'ai_coach',
      metadata: { messageId, rating, comments },
    });
  }

  public async submitFeedback(payload: {
    rating: number; // 1-5
    type: 'csat' | 'nps' | 'ai_coach' | 'nba' | 'general';
    category?: string;
    comment?: string;
  }): Promise<boolean> {
    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('lifeos_auth_token') || localStorage.getItem('auth_token')
        : null;
    try {
      const response = await fetch('/api/telemetry/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;
    const eventsToSend = [...this.queue];
    this.queue = [];

    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('lifeos_auth_token') || localStorage.getItem('auth_token')
        : null;

    try {
      await fetch('/api/telemetry/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ events: eventsToSend }),
      });
    } catch {
      // Put unsent events back in queue
      this.queue.unshift(...eventsToSend.slice(-50));
    } finally {
      this.isFlushing = false;
    }
  }

  private flushSync(): void {
    if (this.queue.length === 0 || typeof navigator === 'undefined' || !navigator.sendBeacon) return;
    try {
      const blob = new Blob([JSON.stringify({ events: this.queue })], { type: 'application/json' });
      navigator.sendBeacon('/api/telemetry/events', blob);
      this.queue = [];
    } catch {
      // Ignore on page unload
    }
  }
}

export const clientTelemetry = new ClientTelemetryTracker();
