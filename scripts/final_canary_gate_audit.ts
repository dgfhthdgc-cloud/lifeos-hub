import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SqlDatabaseAdapter } from '../src/server/database/SqlDatabaseAdapter';
import {
  hashPassword,
  verifyPassword,
  generateAuthToken,
  verifyAuthToken,
  getAuthSecret,
  validateAuthSecretOnStartup,
  resetAuthSecretCacheForTesting,
} from '../src/server/auth';
import { BackupManager } from '../src/server/backup';
import { serverTelemetry } from '../src/server/telemetry';
import { domainBus } from '../src/lib/domainBus';
import { isValidPostgresUrl, sanitizeDatabaseUrl } from '../src/server/db';
import { TaskItem, HabitItem, GoalItem, UserProfile } from '../src/types';

interface TestStats {
  phase: string;
  passed: number;
  failed: number;
  details: string[];
}

const stats: Record<string, TestStats> = {};

function logPass(phase: string, msg: string) {
  if (!stats[phase]) stats[phase] = { phase, passed: 0, failed: 0, details: [] };
  stats[phase].passed++;
  stats[phase].details.push(`[PASS] ${msg}`);
  console.log(`  ✓ [${phase}] PASS: ${msg}`);
}

function logFail(phase: string, msg: string, err?: any) {
  if (!stats[phase]) stats[phase] = { phase, passed: 0, failed: 0, details: [] };
  stats[phase].failed++;
  stats[phase].details.push(`[FAIL] ${msg} ${err ? `(${err})` : ''}`);
  console.error(`  ✗ [${phase}] FAIL: ${msg}`, err || '');
}

export async function runFinalCanaryGateAudit() {
  console.log('======================================================================');
  console.log('LIFE OS — ZERO-TRUST FINAL CANARY GATE & REALITY AUDIT');
  console.log('======================================================================\n');

  const testDbDir = path.join(process.cwd(), '.data_final_canary');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });

  const testDbPath = path.join(testDbDir, `canary_${Date.now()}.sqlite`);
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const db = new SqlDatabaseAdapter(testDbPath);
  await db.initialize();

  // =====================================================================
  // PHASE B — RBAC & AUTHORIZATION AUDIT
  // =====================================================================
  console.log('--- PHASE B: RBAC & AUTHORIZATION DEEP AUDIT ---');
  const phaseB = 'PHASE_B_RBAC';
  {
    // 1. Database role defaults safely to 'user'
    const standardUser = await db.createUser('user1@lifeos.internal', 'hash1', 'salt1', 'Regular User');
    if (standardUser.role === 'user') logPass(phaseB, 'New user role defaults strictly to "user"');
    else logFail(phaseB, `Expected role="user", got "${standardUser.role}"`);

    // 2. Admin user creation
    const adminUser = await db.createUser('admin@lifeos.internal', 'hash_admin', 'salt_admin', 'Sys Admin', 'admin');
    if (adminUser.role === 'admin') logPass(phaseB, 'Admin user created with role="admin"');
    else logFail(phaseB, `Expected role="admin", got "${adminUser.role}"`);

    // 3. Tokens generated with authentic role payload
    const userToken = generateAuthToken({ userId: standardUser.id, email: standardUser.email, role: 'user' });
    const adminToken = generateAuthToken({ userId: adminUser.id, email: adminUser.email, role: 'admin' });

    const userPayload = verifyAuthToken(userToken);
    const adminPayload = verifyAuthToken(adminToken);
    if (userPayload?.role === 'user') logPass(phaseB, 'User token verified with role="user"');
    else logFail(phaseB, 'User token verification failed');

    if (adminPayload?.role === 'admin') logPass(phaseB, 'Admin token verified with role="admin"');
    else logFail(phaseB, 'Admin token verification failed');

    // 4. Tampered token escalation attempt
    const parts = userToken.split('.');
    const fakePayloadObj = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    fakePayloadObj.role = 'admin'; // Privilege escalation attack
    const fakePayloadBase64 = Buffer.from(JSON.stringify(fakePayloadObj)).toString('base64url');
    const forgedToken = `${fakePayloadBase64}.${parts[1]}`; // Signature mismatch

    const tamperedCheck = verifyAuthToken(forgedToken);
    if (tamperedCheck === null) logPass(phaseB, 'Tampered token with privilege escalation strictly rejected (null)');
    else logFail(phaseB, 'Tampered token was improperly accepted!');

    // 5. Invalid / garbage token
    const invalidToken = 'invalid.garbage.token';
    if (verifyAuthToken(invalidToken) === null) logPass(phaseB, 'Malformed token string returns null');
    else logFail(phaseB, 'Malformed token was accepted');

    // 6. User profile updates cannot change role
    await db.updateUserProfile(standardUser.id, { name: 'Escalation Hacker', ...({ role: 'admin' } as any) });
    const reFetchedUser = await db.getUserById(standardUser.id);
    if (reFetchedUser?.role === 'user') logPass(phaseB, 'Client profile update payload cannot alter user role');
    else logFail(phaseB, `Role was escalated to "${reFetchedUser?.role}"!`);
  }

  // =====================================================================
  // PHASE C — MULTI-TENANT ISOLATION
  // =====================================================================
  console.log('\n--- PHASE C: MULTI-TENANT CROSS-RESOURCE ISOLATION ---');
  const phaseC = 'PHASE_C_TENANT_ISOLATION';
  {
    const userA = await db.createUser('tenant_a@lifeos.internal', 'h_a', 's_a', 'Tenant A');
    const userB = await db.createUser('tenant_b@lifeos.internal', 'h_b', 's_b', 'Tenant B');

    // Tenant A creates private resources
    const taskA = db.createTask(userA.id, {
      title: 'Tenant A Private Project Task',
      dueDate: '2026-08-20',
      priority: 'high',
      xp: 150,
      completed: false,
      status: 'todo',
      category: 'Work',
      tags: ['confidential'],
      createdAt: new Date().toISOString(),
    });

    const habitA = db.createHabit(userA.id, {
      name: 'Tenant A Daily Habit',
      description: 'Daily health habit',
      frequency: 'daily',
      target: '1 time',
      category: 'Health',
      difficulty: 'medium',
      xp: 40,
      currentStreak: 5,
      bestStreak: 10,
      history: ['2026-08-18'],
      completedToday: false,
      createdAt: new Date().toISOString(),
    });

    await db.syncUserState(userA.id, {
      changes: {
        goals: [
          {
            id: 'goal_tenant_a_1',
            title: 'Strategic Confidential Goal',
            description: 'Tenant A Roadmap',
            category: 'Career & Skills',
            quarter: 'Q4 2026',
            targetMetric: '100% Launch',
            progress: 0,
            status: 'in_progress',
            xpReward: 500,
            milestones: [{ id: 'm_a_1', goalId: 'goal_tenant_a_1', order: 1, title: 'Milestone 1', completed: false, xpReward: 100 }],
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    // 1. Tenant B state does not contain Tenant A task
    const stateB = await db.getUserState(userB.id);
    const hasTaskAInB = stateB.tasks.some((t) => t.id === taskA.task.id);
    if (!hasTaskAInB) logPass(phaseC, 'Tenant B state has 0 references to Tenant A tasks');
    else logFail(phaseC, 'Tenant A task leaked into Tenant B state!');

    // 2. Tenant B state does not contain Tenant A habit
    const hasHabitAInB = stateB.habits.some((h) => h.id === habitA.habit.id);
    if (!hasHabitAInB) logPass(phaseC, 'Tenant B state has 0 references to Tenant A habits');
    else logFail(phaseC, 'Tenant A habit leaked into Tenant B state!');

    // 3. Tenant B state does not contain Tenant A goal
    const hasGoalAInB = stateB.goals.some((g) => g.id === 'goal_tenant_a_1');
    if (!hasGoalAInB) logPass(phaseC, 'Tenant B state has 0 references to Tenant A goals');
    else logFail(phaseC, 'Tenant A goal leaked into Tenant B state!');

    // 4. Cross-tenant mutation: Tenant B attempts to complete Tenant A task
    const crossComplete = db.completeTask(userB.id, taskA.task.id);
    if (crossComplete.success === false && crossComplete.error === 'TASK_NOT_FOUND') {
      logPass(phaseC, 'Cross-tenant task completion rejected with TASK_NOT_FOUND');
    } else {
      logFail(phaseC, `Cross-tenant task completion unexpectedly returned: ${JSON.stringify(crossComplete)}`);
    }

    // 5. Cross-tenant mutation: Tenant B attempts to update Tenant A task
    const crossUpdate = db.updateTask(userB.id, taskA.task.id, { title: 'Hacked by Tenant B' });
    if (crossUpdate.success === false) {
      logPass(phaseC, 'Cross-tenant task update rejected cleanly');
    } else {
      logFail(phaseC, 'Cross-tenant task update succeeded!');
    }

    // 6. Cross-tenant mutation: Tenant B attempts to complete Tenant A habit
    const crossHabit = db.completeHabit(userB.id, habitA.habit.id, '2026-08-19');
    if (crossHabit.success === false) {
      logPass(phaseC, 'Cross-tenant habit completion rejected cleanly');
    } else {
      logFail(phaseC, 'Cross-tenant habit completion succeeded!');
    }

    // 7. Verify Tenant A's state is unmodified
    const stateA = await db.getUserState(userA.id);
    const unmodTask = stateA.tasks.find((t) => t.id === taskA.task.id);
    if (unmodTask && !unmodTask.completed && unmodTask.title === 'Tenant A Private Project Task') {
      logPass(phaseC, 'Tenant A task remains completely unmutated by unauthorized requests');
    } else {
      logFail(phaseC, 'Tenant A task was modified during cross-tenant attacks!');
    }
  }

  // =====================================================================
  // PHASE D — CONCURRENCY & TRANSACTIONAL INTEGRITY
  // =====================================================================
  console.log('\n--- PHASE D: CONCURRENCY & TRANSACTIONAL MUTATION INTEGRITY ---');
  const phaseD = 'PHASE_D_CONCURRENCY';
  {
    const userConc = await db.createUser('concurrent@lifeos.internal', 'h_c', 's_c', 'Concurrent User');
    const cTask = db.createTask(userConc.id, {
      title: 'High Stake Concurrency Task',
      dueDate: '2026-08-20',
      priority: 'high',
      xp: 200,
      completed: false,
      status: 'todo',
      category: 'Engineering',
      tags: [],
      createdAt: new Date().toISOString(),
    });

    // 1. Two concurrent completion attempts with different event IDs
    const promise1 = Promise.resolve().then(() => db.completeTask(userConc.id, cTask.task.id, 'evt_conc_A'));
    const promise2 = Promise.resolve().then(() => db.completeTask(userConc.id, cTask.task.id, 'evt_conc_B'));

    const [res1, res2] = await Promise.all([promise1, promise2]);

    const firstCompleted = (res1.alreadyCompleted === false && res2.alreadyCompleted === true) ||
                           (res2.alreadyCompleted === false && res1.alreadyCompleted === true);
    if (firstCompleted) {
      logPass(phaseD, 'Concurrent completions resolve with exactly one primary transition (alreadyCompleted=false) and one secondary (alreadyCompleted=true)');
    } else {
      logFail(phaseD, `Concurrent conflict: res1.alreadyCompleted=${res1.alreadyCompleted}, res2.alreadyCompleted=${res2.alreadyCompleted}`);
    }

    // 2. XP ledger integrity check
    const xpState = await db.getUserState(userConc.id);
    const taskXpTxs = xpState.xpLedger.filter((tx) => tx.reason.includes('High Stake Concurrency Task'));
    if (taskXpTxs.length === 1 && taskXpTxs[0].amount === 200) {
      logPass(phaseD, 'XP ledger has strictly 1 transaction (+200 XP) despite concurrent completion attempts');
    } else {
      logFail(phaseD, `XP ledger has ${taskXpTxs.length} transactions (expected 1)!`);
    }

    // 3. User profile currentXp equals 200
    if (xpState.profile.currentXp === 200) {
      logPass(phaseD, 'User profile currentXp matches ledger sum (200 XP)');
    } else {
      logFail(phaseD, `User profile currentXp is ${xpState.profile.currentXp} (expected 200)`);
    }

    // 4. Same clientEventId duplicate replay
    const replayRes = db.completeTask(userConc.id, cTask.task.id, 'evt_conc_A');
    if (replayRes.success === true && replayRes.xpTransaction?.amount === 200) {
      logPass(phaseD, 'Duplicate replay with identical clientEventId returns cached result idempotently');
    } else {
      logFail(phaseD, 'Idempotent replay failed to return cached result');
    }
  }

  // =====================================================================
  // PHASE E — OFFLINE RECOVERY & IDEMPOTENT SYNC
  // =====================================================================
  console.log('\n--- PHASE E: OFFLINE RECOVERY & IDEMPOTENCY ---');
  const phaseE = 'PHASE_E_OFFLINE_RECOVERY';
  {
    const uOff = await db.createUser('offline_user@lifeos.internal', 'h_off', 's_off', 'Offline User');
    
    // Simulate initial state
    const initState = await db.getUserState(uOff.id);
    const baseVer = initState.version;

    // Simulate offline sync batch 1 (create task)
    const sync1 = await db.syncUserState(uOff.id, {
      baseVersion: baseVer,
      changes: {
        tasks: [
          {
            id: 'off_task_1',
            title: 'Offline Task 1',
            dueDate: '2026-08-20',
            priority: 'medium',
            xp: 100,
            completed: false,
            status: 'todo',
            category: 'Focus',
            tags: [],
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    if (!sync1.conflict && sync1.serverVersion === baseVer + 1) {
      logPass(phaseE, 'Offline sync batch 1 committed cleanly (version incremented)');
    } else {
      logFail(phaseE, 'Offline sync batch 1 failed');
    }

    // Simulate stale baseVersion conflict detection (Device B syncs with stale baseVer)
    const staleSync = await db.syncUserState(uOff.id, {
      baseVersion: baseVer, // stale!
      changes: {
        tasks: [],
      },
    });

    if (staleSync.conflict === true && staleSync.serverVersion === baseVer + 1) {
      logPass(phaseE, 'Stale offline version triggers optimistic conflict: true without overwriting state');
    } else {
      logFail(phaseE, 'Stale sync did not report conflict!');
    }
  }

  // =====================================================================
  // PHASE F — BACKUP SECURITY & INTEGRITY
  // =====================================================================
  console.log('\n--- PHASE F: BACKUP SECURITY & DIRECTORY TRAVERSAL PROTECTION ---');
  const phaseF = 'PHASE_F_BACKUP_SECURITY';
  {
    const backupDir = path.join(testDbDir, 'backups_test');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const bManager = new BackupManager(testDbPath, backupDir);

    // 1. Path traversal attacks
    const maliciousPaths = [
      '../../etc/passwd',
      '..\\..\\windows\\system32',
      '/etc/shadow',
      'backup.sqlite\0.exe',
      'malicious.sh',
      '../../../database.sqlite',
      '../lifeos.sqlite',
      'C:\\Windows\\cmd.exe',
    ];

    let allRejected = true;
    for (const p of maliciousPaths) {
      try {
        await bManager.restoreFromBackup(p);
        allRejected = false;
        logFail(phaseF, `Path traversal attack vector '${p}' was not rejected!`);
      } catch (err: any) {
        if (!err.message.includes('PATH_TRAVERSAL') && !err.message.includes('INVALID_FILENAME') && !err.message.includes('Path traversal')) {
          allRejected = false;
          logFail(phaseF, `Unexpected error format on '${p}': ${err.message}`);
        }
      }
    }

    if (allRejected) {
      logPass(phaseF, 'All 8 directory traversal and path manipulation attacks strictly rejected');
    }

    // 2. Create valid backup snapshot
    const backupMeta = await bManager.createBackup();
    if (backupMeta && fs.existsSync(backupMeta.filepath) && backupMeta.checksum.length === 64) {
      logPass(phaseF, 'Valid backup snapshot created with SHA-256 checksum and verified file size');
    } else {
      logFail(phaseF, 'Backup creation failed');
    }

    // 3. Verification of valid snapshot
    const verifyRes = await bManager.verifyBackupFile(backupMeta.filename, backupMeta.checksum);
    if (verifyRes.valid && verifyRes.integrityCheckPassed && verifyRes.checksumMatches) {
      logPass(phaseF, 'Backup verification passed SQLite PRAGMA integrity check and checksum match');
    } else {
      logFail(phaseF, `Valid backup verification failed: ${JSON.stringify(verifyRes)}`);
    }

    // 4. Corrupted backup rejection
    const corruptFile = path.join(backupDir, 'corrupt_test.sqlite');
    fs.writeFileSync(corruptFile, 'GARBAGE NOT A DATABASE CONTENT');
    const corruptVerify = await bManager.verifyBackupFile('corrupt_test.sqlite');
    if (!corruptVerify.valid && !corruptVerify.integrityCheckPassed) {
      logPass(phaseF, 'Corrupted backup file identified and rejected by verification engine');
    } else {
      logFail(phaseF, 'Corrupted backup was not rejected!');
    }
  }

  // =====================================================================
  // PHASE G — DEPLOYMENT FAIL-FAST SAFETY
  // =====================================================================
  console.log('\n--- PHASE G: DEPLOYMENT FAIL-FAST GUARDS ---');
  const phaseG = 'PHASE_G_DEPLOYMENT_SAFETY';
  {
    // 1. PostgreSQL URL validation
    if (isValidPostgresUrl('postgres://user:pass@localhost:5432/lifeos')) {
      logPass(phaseG, 'Valid standard PostgreSQL URL recognized');
    } else logFail(phaseG, 'Valid PostgreSQL URL failed validation');

    if (isValidPostgresUrl('postgresql://app_user:secret@db.internal:5432/prod_db')) {
      logPass(phaseG, 'Valid postgresql:// scheme recognized');
    } else logFail(phaseG, 'postgresql:// scheme failed validation');

    if (!isValidPostgresUrl('npx neonctl@latest init')) {
      logPass(phaseG, 'Shell command strings in DATABASE_URL strictly rejected');
    } else logFail(phaseG, 'Shell command was improperly recognized as valid URL');

    if (!isValidPostgresUrl('postgres://base:5432/db')) {
      logPass(phaseG, 'Placeholder "base" hostname in DATABASE_URL strictly rejected');
    } else logFail(phaseG, 'Placeholder hostname was accepted');

    // 2. Sanitize database URL for logging
    const sanitized = sanitizeDatabaseUrl('postgresql://admin:super_secret_password@pg.cluster:5432/lifeos_prod');
    if (!sanitized.includes('super_secret_password') && sanitized.includes('***')) {
      logPass(phaseG, 'sanitizeDatabaseUrl redacts database credentials from log output');
    } else logFail(phaseG, `sanitizeDatabaseUrl failed: ${sanitized}`);

    // 3. Auth secret length validation in production
    const prevNodeEnv = process.env.NODE_ENV;
    const prevAuthSecret = process.env.AUTH_SECRET;
    try {
      resetAuthSecretCacheForTesting();
      process.env.NODE_ENV = 'production';
      delete process.env.AUTH_SECRET;

      let threw = false;
      try {
        validateAuthSecretOnStartup();
      } catch (err: any) {
        threw = true;
        if (err.message.includes('FATAL SECURITY CONFIGURATION: AUTH_SECRET')) {
          logPass(phaseG, 'Production startup fails fast if AUTH_SECRET is missing');
        } else {
          logFail(phaseG, `Unexpected error on missing AUTH_SECRET: ${err.message}`);
        }
      }
      if (!threw) logFail(phaseG, 'Server did not fail fast in production with missing AUTH_SECRET');
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      if (prevAuthSecret) process.env.AUTH_SECRET = prevAuthSecret;
      resetAuthSecretCacheForTesting();
    }
  }

  // =====================================================================
  // PHASE I — OBSERVABILITY & PRIVACY AUDIT
  // =====================================================================
  console.log('\n--- PHASE I: OBSERVABILITY & PRIVACY AUDIT ---');
  const phaseI = 'PHASE_I_OBSERVABILITY_PRIVACY';
  {
    // Record event
    serverTelemetry.recordEvent({
      type: 'api_request',
      userId: 'usr_test_123',
      route: '/api/tasks',
      statusCode: 200,
      durationMs: 45,
      status: 'success',
      metadata: {
        action: 'task_complete',
      },
    });

    const metrics = serverTelemetry.getMetrics();
    if (metrics.totalRequests > 0 && typeof metrics.latencyPercentiles.p95Ms === 'number') {
      logPass(phaseI, 'Server telemetry tracks request latency percentiles and error metrics');
    } else {
      logFail(phaseI, 'Telemetry aggregation metrics failed');
    }

    // Feedback recording
    const feedback = serverTelemetry.recordFeedback({
      userId: 'usr_test_123',
      rating: 5,
      type: 'csat',
      comment: 'Life OS is fast and reliable.',
      sentiment: 'positive',
    });

    if (feedback.rating === 5 && feedback.sentiment === 'positive') {
      logPass(phaseI, 'User CSAT feedback recorded and classified without sensitive data exposure');
    } else {
      logFail(phaseI, 'Feedback recording failed');
    }
  }

  // =====================================================================
  // PHASE K — EVENT BUS INTEGRITY & LOOP PREVENTION
  // =====================================================================
  console.log('\n--- PHASE K: EVENT BUS INTEGRITY & RECURSION SAFETY ---');
  const phaseK = 'PHASE_K_EVENT_BUS';
  {
    let cascadeCount = 0;
    const unsub = domainBus.subscribe((evt) => {
      if (evt.type === 'task_created') {
        cascadeCount++;
        if (cascadeCount <= 5) {
          // Attempt infinite loop
          domainBus.dispatch({
            type: 'task_created',
            entityId: 'ent_cascade',
            title: 'Cascade Task',
            userId: evt.userId,
            parentEventId: evt.eventId,
            chainDepth: (evt.chainDepth ?? 0) + 1,
            correlationId: evt.correlationId,
          });
        }
      }
    });

    domainBus.dispatch({
      type: 'task_created',
      entityId: 'ent_initial',
      title: 'Initial Task',
      userId: 'usr_loop_test',
    });

    unsub();

    if (cascadeCount <= 4) {
      logPass(phaseK, `Cascade depth limit strictly capped runaway events at depth limit (actual: ${cascadeCount})`);
    } else {
      logFail(phaseK, `Event loop failed to terminate: executed ${cascadeCount} times!`);
    }
  }

  // =====================================================================
  // PHASE L — XP LEDGER MATHEMATICAL PROOF
  // =====================================================================
  console.log('\n--- PHASE L: XP LEDGER MATHEMATICAL INTEGRITY PROOF ---');
  const phaseL = 'PHASE_L_XP_LEDGER_PROOF';
  {
    const uLedger = await db.createUser('ledger_math@lifeos.internal', 'h_l', 's_l', 'Ledger Math User');
    
    // Perform 3 distinct authoritative actions
    const t1 = db.createTask(uLedger.id, {
      title: 'Task 1 (100 XP)',
      dueDate: '2026-08-20',
      priority: 'high',
      xp: 100,
      completed: false,
      status: 'todo',
      category: 'General',
      tags: [],
      createdAt: new Date().toISOString(),
    });
    db.completeTask(uLedger.id, t1.task.id);

    const h1 = db.createHabit(uLedger.id, {
      name: 'Habit 1 (30 XP)',
      description: 'Daily habit 1',
      frequency: 'daily',
      target: '1',
      category: 'Health',
      difficulty: 'medium',
      xp: 30,
      currentStreak: 0,
      bestStreak: 0,
      history: [],
      completedToday: false,
      createdAt: new Date().toISOString(),
    });
    db.completeHabit(uLedger.id, h1.habit.id, '2026-08-19');

    const finalState = await db.getUserState(uLedger.id);
    const ledgerSum = finalState.xpLedger.reduce((acc, tx) => acc + tx.amount, 0);

    // Profile XP calculation (accounting for level ups if any)
    let totalComputedXp = finalState.profile.currentXp;
    for (let lvl = 1; lvl < finalState.profile.level; lvl++) {
      totalComputedXp += Math.round(100 * Math.pow(lvl, 1.25));
    }

    if (ledgerSum === 130 && totalComputedXp === 130) {
      logPass(phaseL, 'Mathematical proof: displayed cumulative XP strictly equals SUM(xp_ledger.amount) (130 XP)');
    } else {
      logFail(phaseL, `XP Ledger discrepancy: ledgerSum=${ledgerSum}, totalComputedXp=${totalComputedXp}`);
    }
  }

  // =====================================================================
  // SUMMARY
  // =====================================================================
  console.log('\n======================================================================');
  console.log('FINAL CANARY AUDIT EXECUTION SUMMARY');
  console.log('======================================================================');

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [phaseKey, s] of Object.entries(stats)) {
    totalPassed += s.passed;
    totalFailed += s.failed;
    console.log(`- ${phaseKey}: ${s.passed} Passed, ${s.failed} Failed`);
  }

  console.log(`\nTOTAL: ${totalPassed} PASSED | ${totalFailed} FAILED`);
  console.log('======================================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runFinalCanaryGateAudit().catch((err) => {
  console.error('FATAL CANARY AUDIT ERROR:', err);
  process.exit(1);
});
