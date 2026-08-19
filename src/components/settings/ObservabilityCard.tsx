import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { clientTelemetry } from '../../lib/telemetry';
import {
  Activity,
  Server,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
  TrendingUp,
  MessageSquare,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Star,
  Layers,
} from 'lucide-react';

export function ObservabilityCard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackType, setFeedbackType] = useState<'csat' | 'nps' | 'ai_coach' | 'nba' | 'general'>('general');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const fetchTelemetry = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/telemetry/metrics', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackups = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/admin/backup/list', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBackups(data.backups || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        await fetchBackups();
      }
    } catch {
      // ignore
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await clientTelemetry.submitFeedback({
      rating: feedbackRating,
      type: feedbackType,
      comment: feedbackComment,
    });
    if (success) {
      setFeedbackSubmitted(true);
      setFeedbackComment('');
      setTimeout(() => setFeedbackSubmitted(false), 3000);
      fetchTelemetry();
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Operational Metrics & Funnel Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>System Telemetry & Observability</CardTitle>
                <CardDescription>
                  Phase 8 real-time latency percentiles, error rates, activation funnel, and database health.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTelemetry}
              disabled={isLoading}
              className="text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800">
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                System Uptime
              </div>
              <div className="text-lg font-black text-neutral-900 dark:text-white mt-1">
                {metrics ? `${Math.floor(metrics.uptimeSeconds / 60)}m ${metrics.uptimeSeconds % 60}s` : '—'}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Ready
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800">
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Avg / P95 Latency
              </div>
              <div className="text-lg font-black text-neutral-900 dark:text-white mt-1">
                {metrics ? `${metrics.latencyPercentiles.avgMs}ms / ${metrics.latencyPercentiles.p95Ms}ms` : '—'}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                {metrics ? `${metrics.totalRequests} calls tracked` : 'Tracking active'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800">
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Activation Funnel
              </div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {metrics ? `${metrics.funnel.conversionRates.overallActivationPct}%` : '—'}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Signup → Complete
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800">
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                AI Coach Latency
              </div>
              <div className="text-lg font-black text-neutral-900 dark:text-white mt-1">
                {metrics ? `${metrics.aiMetrics.avgLatencyMs}ms` : '—'}
              </div>
              <div className="text-[11px] text-amber-500 mt-0.5">
                {metrics ? `${metrics.aiMetrics.totalQueries} inferences` : 'Grounded'}
              </div>
            </div>
          </div>

          {/* Funnel Progress Breakdown */}
          {metrics?.funnel && (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
              <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>User Activation Funnel Telemetry</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700">
                  <div className="text-xs text-neutral-500">1. Signups</div>
                  <div className="font-black text-sm text-neutral-900 dark:text-white">
                    {metrics.funnel.signups}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700">
                  <div className="text-xs text-neutral-500">2. Goal Created</div>
                  <div className="font-black text-sm text-neutral-900 dark:text-white">
                    {metrics.funnel.goalsCreated} ({metrics.funnel.conversionRates.signupToGoalPct}%)
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700">
                  <div className="text-xs text-neutral-500">3. Tasks Created</div>
                  <div className="font-black text-sm text-neutral-900 dark:text-white">
                    {metrics.funnel.tasksCreated} ({metrics.funnel.conversionRates.goalToTaskPct}%)
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700">
                  <div className="text-xs text-neutral-500">4. Activated</div>
                  <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                    {metrics.funnel.firstTaskCompletions} ({metrics.funnel.conversionRates.overallActivationPct}%)
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disaster Recovery & Point-in-time Database Backups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Disaster Recovery & Snapshots (RPO/RTO)</CardTitle>
                <CardDescription>
                  Cryptographic SHA256 verified SQLite point-in-time snapshots.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="text-xs"
            >
              <Download className={`w-3.5 h-3.5 mr-1 ${isCreatingBackup ? 'animate-bounce' : ''}`} />
              {isCreatingBackup ? 'Snapshotting...' : 'Create Snapshot'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-xs text-neutral-500 text-center py-4">
              No manual snapshots created yet. Live state is durably persisted to disk.
            </div>
          ) : (
            <div className="space-y-2">
              {backups.slice(0, 3).map((b) => (
                <div
                  key={b.filename}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        {b.filename}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        SHA256: {b.checksum.slice(0, 12)}... | Size: {(b.sizeBytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {new Date(b.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Voice & Direct Feedback Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>User Feedback & CSAT/NPS Rating</CardTitle>
              <CardDescription>
                Help improve LIFE OS with instant feedback on intelligence, speed, and reliability.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Overall Rating (1-5 Stars)
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className={`p-1.5 rounded-md transition-all ${
                        feedbackRating >= star
                          ? 'text-amber-500 scale-110'
                          : 'text-neutral-300 dark:text-neutral-700 hover:text-amber-400'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                  Category
                </div>
                <select
                  value={feedbackType}
                  onChange={(e: any) => setFeedbackType(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white"
                >
                  <option value="general">General Experience</option>
                  <option value="ai_coach">AI Coach Intelligence</option>
                  <option value="nba">Next Best Action</option>
                  <option value="csat">System Performance</option>
                </select>
              </div>
            </div>

            <div>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share your thoughts, suggestions, or issues..."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between">
              {feedbackSubmitted ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Thank you for your feedback!
                </span>
              ) : (
                <span className="text-[11px] text-neutral-500">
                  Telemetry and feedback are anonymously aggregated.
                </span>
              )}
              <Button type="submit" variant="primary" size="sm" className="text-xs">
                Submit Feedback
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
