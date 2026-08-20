import fs from 'fs';
import path from 'path';
import { DatabaseAdapter } from './DatabaseAdapter';
import { SqlDatabaseAdapter } from './SqlDatabaseAdapter';
import { PostgresDatabaseAdapter } from './PostgresDatabaseAdapter';

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

export async function migrateFromJson(adapter: DatabaseAdapter, customJsonPath?: string): Promise<MigrationSummary> {
  const jsonPath = customJsonPath || path.join(process.cwd(), '.data', 'users.json');
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

    if (adapter instanceof SqlDatabaseAdapter) {
      adapter.ensureInitialized();
    } else if (adapter instanceof PostgresDatabaseAdapter) {
      await adapter.ensureInitialized();
    }

    for (const userId of Object.keys(users)) {
      const user = users[userId];
      const state = states[userId] || {};

      if (!user || !user.id || !user.email) continue;

      const existingUser = await adapter.getUserById(user.id);
      if (!existingUser) {
        // User does not exist in database - insert with preserved password and salt
        try {
          const profile = user.profile || state.profile || {};
          const now = user.createdAt || new Date().toISOString();

          if (adapter instanceof PostgresDatabaseAdapter) {
            const client = await (adapter as any).pool.connect();
            try {
              await client.query('BEGIN');
              await client.query(
                `INSERT INTO users (id, email, password_hash, salt, created_at)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (id) DO NOTHING`,
                [user.id, user.email, user.passwordHash || '', user.salt || '', now]
              );

              await client.query(
                `INSERT INTO user_profiles (
                  user_id, name, title, level, current_xp, next_level_xp, avatar_url,
                  streak_count, focus_hours, win_rate, tasks_completed, settings_json, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (user_id) DO UPDATE SET
                  name = EXCLUDED.name,
                  title = EXCLUDED.title,
                  level = EXCLUDED.level,
                  current_xp = EXCLUDED.current_xp,
                  next_level_xp = EXCLUDED.next_level_xp,
                  avatar_url = EXCLUDED.avatar_url,
                  streak_count = EXCLUDED.streak_count,
                  focus_hours = EXCLUDED.focus_hours,
                  win_rate = EXCLUDED.win_rate,
                  tasks_completed = EXCLUDED.tasks_completed,
                  settings_json = EXCLUDED.settings_json`,
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

              await client.query(
                `INSERT INTO user_state_metadata (user_id, version, last_synced_at)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id) DO UPDATE SET
                   version = EXCLUDED.version,
                   last_synced_at = EXCLUDED.last_synced_at`,
                [user.id, state.version || 1, state.lastSyncedAt || now]
              );

              // Tasks
              if (Array.isArray(state.tasks)) {
                for (const t of state.tasks) {
                  if (!t || !t.id) continue;
                  await client.query(
                    `INSERT INTO tasks (
                      id, user_id, title, description, due_date, time, end_time,
                      priority, status, category, tags_json, xp, completed, completed_at, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    ON CONFLICT (id) DO NOTHING`,
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
                  await client.query(
                    `INSERT INTO habits (
                      id, user_id, name, description, frequency, target, category,
                      difficulty, xp, current_streak, best_streak, history_json, completed_today, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    ON CONFLICT (id) DO NOTHING`,
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
                  await client.query(
                    `INSERT INTO goals (
                      id, user_id, title, description, category, progress, xp_reward, milestones_json, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (id) DO NOTHING`,
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
                  await client.query(
                    `INSERT INTO journal_entries (
                      id, user_id, timestamp, symbol, direction, entry_price, exit_price,
                      size, pnl, pnl_percent, r_multiple, status, notes, setup_strategy, session, emotion, mistakes_json
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                    ON CONFLICT (id) DO NOTHING`,
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
                  await client.query(
                    `INSERT INTO xp_ledger (id, user_id, amount, reason, category, timestamp)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (id) DO NOTHING`,
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
                  await client.query(
                    `INSERT INTO processed_events (client_event_id, user_id, result_json, processed_at)
                     VALUES ($1, $2, $3, $4)
                     ON CONFLICT (client_event_id) DO NOTHING`,
                    [eventId, user.id, JSON.stringify(evt.result || {}), evt.processedAt || now]
                  );
                }
              }

              await client.query('COMMIT');
              summary.usersMigrated++;
            } catch (err: any) {
              await client.query('ROLLBACK');
              console.error(`[Migration] Failed to migrate user ${user.id} to Postgres:`, err?.message);
            } finally {
              client.release();
            }
          } else if (adapter instanceof SqlDatabaseAdapter) {
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
          }
        } catch (err: any) {
          if (adapter instanceof SqlDatabaseAdapter) {
            (adapter as any).db.run('ROLLBACK;');
          }
          console.error(`[Migration] Failed to migrate user ${user.id}:`, err?.message);
        }
      }
    }

    if (adapter instanceof SqlDatabaseAdapter) {
      adapter.saveToDisk();
    }
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
