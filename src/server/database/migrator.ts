import fs from 'fs';
import path from 'path';
import { SqlDatabaseAdapter } from './SqlDatabaseAdapter';

export interface MigrationSummary {
  success: boolean;
  usersMigrated: number;
  tasksMigrated: number;
  habitsMigrated: number;
  goalsMigrated: number;
  xpRecordsMigrated: number;
  journalEntriesMigrated: number;
  error?: string;
}

export async function migrateFromJson(adapter: SqlDatabaseAdapter): Promise<MigrationSummary> {
  const jsonPath = path.join(process.cwd(), '.data', 'users.json');
  const summary: MigrationSummary = {
    success: true,
    usersMigrated: 0,
    tasksMigrated: 0,
    habitsMigrated: 0,
    goalsMigrated: 0,
    xpRecordsMigrated: 0,
    journalEntriesMigrated: 0,
  };

  if (!fs.existsSync(jsonPath)) {
    return summary;
  }

  try {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    if (!raw.trim()) return summary;

    const data = JSON.parse(raw);
    const users = data.users || {};
    const states = data.states || {};

    adapter.ensureInitialized();

    for (const userId of Object.keys(users)) {
      const user = users[userId];
      const state = states[userId] || {};

      if (!user || !user.id || !user.email) continue;

      const existingUser = adapter.getUserById(user.id);
      if (!existingUser) {
        // User does not exist in SQL - insert with preserved password and salt
        try {
          const profile = user.profile || state.profile || {};
          const now = user.createdAt || new Date().toISOString();

          (adapter as any).db.run('BEGIN TRANSACTION;');

          (adapter as any).db.run(
            `INSERT OR IGNORE INTO users (id, email, password_hash, salt, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [user.id, user.email, user.passwordHash || '', user.salt || '', now]
          );

          (adapter as any).db.run(
            `INSERT OR REPLACE INTO user_profiles (
              user_id, name, title, level, current_xp, next_level_xp, avatar_url,
              streak_count, focus_hours, win_rate, tasks_completed, settings_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              user.id,
              profile.name || 'LifeOS User',
              profile.title || 'Initiate Apprentice',
              profile.level || 1,
              profile.currentXp || 0,
              profile.nextLevelXp || 1000,
              profile.avatarUrl || null,
              profile.streakCount || 0,
              profile.focusHours || 0,
              profile.winRate || 0,
              profile.tasksCompleted || 0,
              JSON.stringify(profile.settings || {}),
              profile.createdAt || now,
            ]
          );

          (adapter as any).db.run(
            `INSERT OR REPLACE INTO user_state_metadata (user_id, version, last_synced_at)
             VALUES (?, ?, ?)`,
            [user.id, state.version || 1, state.lastSyncedAt || now]
          );

          // Tasks
          if (Array.isArray(state.tasks)) {
            for (const t of state.tasks) {
              if (!t || !t.id) continue;
              (adapter as any).db.run(
                `INSERT OR IGNORE INTO tasks (
                  id, user_id, title, description, due_date, time, end_time,
                  priority, status, category, tags_json, xp, completed, completed_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  t.id,
                  user.id,
                  t.title || 'Untitled',
                  t.description || '',
                  t.dueDate || '',
                  t.time || '',
                  t.endTime || null,
                  t.priority || 'medium',
                  t.status || 'todo',
                  t.category || 'Engineering',
                  JSON.stringify(t.tags || []),
                  t.xp || 50,
                  t.completed ? 1 : 0,
                  t.completedAt || null,
                  t.createdAt || now,
                ]
              );
              summary.tasksMigrated++;
            }
          }

          // Habits
          if (Array.isArray(state.habits)) {
            for (const h of state.habits) {
              if (!h || !h.id) continue;
              (adapter as any).db.run(
                `INSERT OR IGNORE INTO habits (
                  id, user_id, name, description, frequency, target, category,
                  difficulty, xp, current_streak, best_streak, history_json, completed_today, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  h.id,
                  user.id,
                  h.name || 'Untitled Habit',
                  h.description || '',
                  h.frequency || 'daily',
                  h.target || '',
                  h.category || 'Skill',
                  h.difficulty || 'medium',
                  h.xp || 35,
                  h.currentStreak || 0,
                  h.bestStreak || 0,
                  JSON.stringify(h.history || []),
                  h.completedToday ? 1 : 0,
                  h.createdAt || now,
                ]
              );
              summary.habitsMigrated++;
            }
          }

          // Goals
          if (Array.isArray(state.goals)) {
            for (const g of state.goals) {
              if (!g || !g.id) continue;
              (adapter as any).db.run(
                `INSERT OR IGNORE INTO goals (
                  id, user_id, title, description, category, progress, xp_reward, milestones_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  g.id,
                  user.id,
                  g.title || 'Untitled Goal',
                  g.description || '',
                  g.category || 'Career & Skills',
                  g.progress || 0,
                  g.xpReward || 500,
                  JSON.stringify(g.milestones || []),
                  g.createdAt || now,
                ]
              );
              summary.goalsMigrated++;
            }
          }

          // Journal
          if (Array.isArray(state.journal)) {
            for (const j of state.journal) {
              if (!j || !j.id) continue;
              (adapter as any).db.run(
                `INSERT OR IGNORE INTO journal_entries (
                  id, user_id, timestamp, symbol, direction, entry_price, exit_price,
                  size, pnl, pnl_percent, r_multiple, status, notes, setup_strategy, session, emotion, mistakes_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  j.id,
                  user.id,
                  j.timestamp || now,
                  j.symbol || 'N/A',
                  j.direction || 'long',
                  j.entryPrice || 0,
                  j.exitPrice || 0,
                  j.size || 1,
                  j.pnl || 0,
                  j.pnlPercent || 0,
                  j.rMultiple || 0,
                  j.status || 'breakeven',
                  j.notes || '',
                  j.setupStrategy || '',
                  j.session || '',
                  j.emotion || '',
                  JSON.stringify(j.mistakes || []),
                ]
              );
              summary.journalEntriesMigrated++;
            }
          }

          // XP Ledger
          if (Array.isArray(state.xpLedger)) {
            for (const x of state.xpLedger) {
              if (!x || !x.id) continue;
              (adapter as any).db.run(
                `INSERT OR IGNORE INTO xp_ledger (id, user_id, amount, reason, category, timestamp)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [x.id, user.id, x.amount || 0, x.reason || 'XP Award', x.category || 'general', x.timestamp || now]
              );
              summary.xpRecordsMigrated++;
            }
          }

          // Processed Events (Idempotency cache)
          if (state.processedEvents && typeof state.processedEvents === 'object') {
            for (const eventId of Object.keys(state.processedEvents)) {
              const evt = state.processedEvents[eventId];
              if (!evt) continue;
              (adapter as any).db.run(
                `INSERT OR IGNORE INTO processed_events (client_event_id, user_id, result_json, processed_at)
                 VALUES (?, ?, ?, ?)`,
                [eventId, user.id, JSON.stringify(evt.result || {}), evt.processedAt || now]
              );
            }
          }

          (adapter as any).db.run('COMMIT;');
          summary.usersMigrated++;
        } catch (err: any) {
          (adapter as any).db.run('ROLLBACK;');
          console.error(`[Migration] Failed to migrate user ${user.id}:`, err?.message);
        }
      }
    }

    adapter.saveToDisk();
    console.log(
      `[Migration] Completed: ${summary.usersMigrated} users, ${summary.tasksMigrated} tasks, ${summary.habitsMigrated} habits, ${summary.goalsMigrated} goals, ${summary.xpRecordsMigrated} XP records.`
    );
    return summary;
  } catch (err: any) {
    console.error('[Migration] Failed to process users.json:', err?.message);
    summary.success = false;
    summary.error = err?.message;
    return summary;
  }
}
