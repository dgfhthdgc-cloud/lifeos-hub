import fs from 'fs';
import path from 'path';
import { SqlDatabaseAdapter } from '../database/SqlDatabaseAdapter';
import { serverTelemetry } from '../telemetry';
import { BackupManager } from '../backup';
import { domainBus } from '../../lib/domainBus';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${label}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${label}`);
  }
}

export async function runPhase8LaunchObservability() {
  console.log('======================================================================');
  console.log('LIFE OS — PHASE 8: LAUNCH, OBSERVABILITY & REAL-WORLD VALIDATION');
  console.log('======================================================================\n');

  const testDir = path.join(process.cwd(), '.data_phase8_test');
  const backupDir = path.join(process.cwd(), '.backups_phase8_test');

  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const testDbPath = path.join(testDir, `lifeos_test_${Date.now()}.sqlite`);
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  // Initialize test database
  const db = new SqlDatabaseAdapter(testDbPath);
  await db.initialize();

  // Reset telemetry manager for pristine test state
  serverTelemetry.reset();

  console.log('--- TEST GROUP 1: Production Telemetry & Latency Calculation ---');
  {
    // Simulate 100 API request telemetry events with known latencies
    for (let i = 1; i <= 100; i++) {
      serverTelemetry.recordEvent({
        type: 'api_request',
        durationMs: i * 2, // 2ms to 200ms
        statusCode: i % 20 === 0 ? 500 : 200, // 5 errors out of 100
        route: i % 2 === 0 ? '/api/domain/tasks/complete' : '/api/domain/habits/complete',
      });
    }

    const metrics = serverTelemetry.getMetrics();
    assert(metrics.totalRequests === 100, 'Total requests count matches 100 recorded requests');
    assert(metrics.totalErrors === 5, 'Total errors count matches 5 recorded HTTP 500 responses');
    assert(metrics.errorRatePct === 5.0, 'Error rate correctly computed as 5.0%');
    assert(metrics.latencyPercentiles.p50Ms > 90 && metrics.latencyPercentiles.p50Ms < 110, `P50 latency correctly calculated (~100ms, actual: ${metrics.latencyPercentiles.p50Ms}ms)`);
    assert(metrics.latencyPercentiles.p95Ms >= 180, `P95 latency correctly calculated (>=180ms, actual: ${metrics.latencyPercentiles.p95Ms}ms)`);
    assert(metrics.routeLatencies['/api/domain/tasks/complete']?.count === 50, 'Route telemetry recorded 50 calls for tasks route');
  }

  console.log('\n--- TEST GROUP 2: Activation Funnel Progression Telemetry ---');
  {
    // Simulate 10 users through different funnel stages
    // 10 Signups
    for (let u = 1; u <= 10; u++) {
      serverTelemetry.recordFunnelStep(`user_${u}`, 'signup');
    }

    // 8 Users created goals (80% conversion)
    for (let u = 1; u <= 8; u++) {
      serverTelemetry.recordFunnelStep(`user_${u}`, 'goal_created');
    }

    // 6 Users created tasks (75% of goal creators)
    for (let u = 1; u <= 6; u++) {
      serverTelemetry.recordFunnelStep(`user_${u}`, 'task_created');
    }

    // 5 Users completed tasks (83.3% of task creators -> 50% overall activation)
    for (let u = 1; u <= 5; u++) {
      serverTelemetry.recordFunnelStep(`user_${u}`, 'task_completed');
    }

    const metrics = serverTelemetry.getMetrics();
    assert(metrics.funnel.signups === 10, 'Funnel tracked 10 signups');
    assert(metrics.funnel.goalsCreated === 8, 'Funnel tracked 8 goal creations');
    assert(metrics.funnel.tasksCreated === 6, 'Funnel tracked 6 task creations');
    assert(metrics.funnel.firstTaskCompletions === 5, 'Funnel tracked 5 task completions');
    assert(metrics.funnel.conversionRates.signupToGoalPct === 80.0, 'Signup to Goal conversion is 80.0%');
    assert(metrics.funnel.conversionRates.overallActivationPct === 50.0, 'Overall Activation rate is 50.0%');
  }

  console.log('\n--- TEST GROUP 3: Retention Tracking (D1, D3, D7, D14, D30) ---');
  {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);
    const subDays = (d: Date, days: number) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000);

    const testUser = 'user_retention_test';
    const signupDate = subDays(today, 35);

    // Record signup in past
    serverTelemetry.recordUserActivity(testUser, formatDate(signupDate));

    // Record activity on D1, D3, D7, D14, D30
    serverTelemetry.recordUserActivity(testUser, formatDate(subDays(today, 34))); // D1
    serverTelemetry.recordUserActivity(testUser, formatDate(subDays(today, 32))); // D3
    serverTelemetry.recordUserActivity(testUser, formatDate(subDays(today, 28))); // D7
    serverTelemetry.recordUserActivity(testUser, formatDate(subDays(today, 21))); // D14
    serverTelemetry.recordUserActivity(testUser, formatDate(subDays(today, 5)));  // D30

    const metrics = serverTelemetry.getMetrics();
    assert(metrics.retention.d1Active >= 1, 'D1 retention cohort activity identified');
    assert(metrics.retention.d7Active >= 1, 'D7 retention cohort activity identified');
    assert(metrics.retention.d30Active >= 1, 'D30 retention cohort activity identified');
  }

  console.log('\n--- TEST GROUP 4: User Voice & CSAT/NPS Aggregation ---');
  {
    // Submit feedback: 3 Promoters (5 stars), 1 Passive (3 stars), 1 Detractor (1 star)
    serverTelemetry.recordFeedback({ userId: 'u1', rating: 5, type: 'csat', comment: 'Fast and responsive' });
    serverTelemetry.recordFeedback({ userId: 'u2', rating: 5, type: 'ai_coach', comment: 'Insightful AI coach' });
    serverTelemetry.recordFeedback({ userId: 'u3', rating: 4, type: 'nba', comment: 'Next Best Action is great' });
    serverTelemetry.recordFeedback({ userId: 'u4', rating: 3, type: 'general', comment: 'Good overall' });
    serverTelemetry.recordFeedback({ userId: 'u5', rating: 1, type: 'general', comment: 'Needs more features' });

    const metrics = serverTelemetry.getMetrics();
    assert(metrics.feedback.totalFeedback === 5, 'Total feedback count matches 5 entries');
    assert(metrics.feedback.averageRating === 3.6, `Average feedback rating computed accurately (actual: ${metrics.feedback.averageRating})`);
    assert(metrics.feedback.ratingBreakdown[5] === 2, 'Rating distribution counts 2 five-star ratings');
    assert(metrics.feedback.npsScore === 40, `NPS Score computed correctly ((3 promoters - 1 detractor)/5 = 40%, actual: ${metrics.feedback.npsScore})`);
    assert(metrics.feedback.recentComments.length === 5, 'Recent feedback comments captured with commentary');
  }

  console.log('\n--- TEST GROUP 5: Point-in-Time Database Backup & SHA-256 Checksum ---');
  const backupMgr = new BackupManager(testDbPath, backupDir);
  let backupFile = '';
  let backupHash = '';

  {
    // Create a real user in DB before snapshot
    await db.createUser('backup_user@lifeos.io', 'hash123', 'salt123', 'Backup Test User');

    const metadata = await backupMgr.createBackup();
    backupFile = metadata.filepath;
    backupHash = metadata.checksum;

    assert(fs.existsSync(backupFile), 'Backup file successfully created on filesystem');
    assert(metadata.sizeBytes > 0, 'Backup snapshot has positive byte size');
    assert(metadata.checksum.length === 64, 'SHA-256 checksum generated with 64 hex characters');
    assert(metadata.userCount >= 1, 'Backup inspection confirmed presence of users table and active records');

    // Verify snapshot integrity
    const verification = await backupMgr.verifyBackupFile(backupFile, backupHash);
    assert(verification.valid === true, 'Backup verification passed SQLite PRAGMA integrity check');
    assert(verification.checksumMatches === true, 'Cryptographic SHA-256 checksum verified against expected value');
    assert(verification.tablesFound.includes('users'), 'Backup contains core users table');
    assert(verification.tablesFound.includes('user_profiles'), 'Backup contains user_profiles table');
  }

  console.log('\n--- TEST GROUP 6: Corrupted Backup Detection ---');
  {
    // Create a damaged/corrupt file
    const corruptPath = path.join(backupDir, 'corrupt_backup.sqlite');
    fs.writeFileSync(corruptPath, Buffer.from('NOT A VALID SQLITE DATABASE HEADER'));

    const verification = await backupMgr.verifyBackupFile(corruptPath);
    assert(verification.valid === false, 'Backup verifier correctly identified corrupted file');
    assert(verification.integrityCheckPassed === false, 'Integrity check failed on invalid file');
  }

  console.log('\n--- TEST GROUP 7: Disaster Recovery Restore (RPO/RTO) ---');
  {
    // Add a second user, then restore to previous snapshot
    await db.createUser('transient_user@lifeos.io', 'hash999', 'salt999', 'Transient User');
    let userRecord = await db.getUserByEmail('transient_user@lifeos.io');
    assert(userRecord !== null, 'Transient user created before restore');

    // Perform atomic restore from verified snapshot
    const restoreResult = await backupMgr.restoreFromBackup(backupFile);
    assert(restoreResult.success === true, 'Database restore from backup succeeded');

    // Re-initialize adapter to point to restored database
    const restoredDb = new SqlDatabaseAdapter(testDbPath);
    await restoredDb.initialize();

    // Verify original user exists and transient user does not exist
    const restoredUser = await restoredDb.getUserByEmail('backup_user@lifeos.io');
    assert(restoredUser !== null, 'Original user from backup snapshot is intact in restored database');

    const nonExistentUser = await restoredDb.getUserByEmail('transient_user@lifeos.io');
    assert(nonExistentUser === null, 'Restored database reflects exact point-in-time state without post-snapshot transient writes');
  }

  console.log('\n======================================================================');
  console.log(`LIFE OS PHASE 8 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    throw new Error(`Phase 8 verification failed with ${failed} failed assertions.`);
  }

  return { passed, failed };
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase8LaunchObservability().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
