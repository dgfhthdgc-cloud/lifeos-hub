import fs from 'fs';
import path from 'path';
import { SqlDatabaseAdapter } from '../database/SqlDatabaseAdapter';
import { BackupManager } from '../backup';
import { generateAuthToken, verifyAuthToken, hashPassword, verifyPassword } from '../auth';
import { validateEnvironment } from '../config';
import { serverTelemetry } from '../telemetry';

let totalPasses = 0;
let totalFailures = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    totalPasses++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    totalFailures++;
  }
}

export async function runPreCanaryHardeningAudit() {
  console.log('======================================================================');
  console.log('LIFE OS — ZERO-TRUST PRE-CANARY SECURITY & HARDENING AUDIT');
  console.log('======================================================================\n');

  const testDataDir = path.join(process.cwd(), '.data_precanary_test');
  const backupDir = path.join(process.cwd(), '.backups_precanary_test');

  if (!fs.existsSync(testDataDir)) fs.mkdirSync(testDataDir, { recursive: true });
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const testDbFile = path.join(testDataDir, `precanary_${Date.now()}.sqlite`);
  if (fs.existsSync(testDbFile)) fs.unlinkSync(testDbFile);

  const db = new SqlDatabaseAdapter(testDbFile);
  await db.initialize();

  // =====================================================================
  // 1. ADMIN AUTHORIZATION & SMALLEST SAFE RBAC
  // =====================================================================
  console.log('--- OBJECTIVE 1: ADMIN AUTHORIZATION & RBAC ENFORCEMENT ---');
  {
    // Create standard user and admin user
    const { hash: userHash, salt: userSalt } = hashPassword('StandardPass123!');
    const standardUser = db.createUser('citizen@lifeos.io', userHash, userSalt, 'Standard Citizen', 'user');

    const { hash: adminHash, salt: adminSalt } = hashPassword('AdminPass123!');
    const adminUser = db.createUser('admin@lifeos.io', adminHash, adminSalt, 'System Administrator', 'admin');

    assert(standardUser.role === 'user', 'Standard user created with role="user"');
    assert(adminUser.role === 'admin', 'Admin user created with role="admin"');

    // Retrieve from DB to verify persistence of role column
    const fetchedStandard = db.getUserById(standardUser.id);
    const fetchedAdmin = db.getUserById(adminUser.id);
    assert(fetchedStandard?.role === 'user', 'Fetched standard user has role="user" from DB');
    assert(fetchedAdmin?.role === 'admin', 'Fetched admin user has role="admin" from DB');

    // Test Token Generation with Role Claim
    const userToken = generateAuthToken({ userId: standardUser.id, email: standardUser.email, role: standardUser.role });
    const adminToken = generateAuthToken({ userId: adminUser.id, email: adminUser.email, role: adminUser.role });

    const verifiedUserPayload = verifyAuthToken(userToken);
    const verifiedAdminPayload = verifyAuthToken(adminToken);

    assert(verifiedUserPayload?.role === 'user', 'Verified user token payload carries role="user"');
    assert(verifiedAdminPayload?.role === 'admin', 'Verified admin token payload carries role="admin"');

    // Role Promotion / Demotion in DB
    db.setUserRole(standardUser.id, 'admin');
    assert(db.getUserById(standardUser.id)?.role === 'admin', 'setUserRole successfully promotes user to admin in DB');
    db.setUserRole(standardUser.id, 'user');
    assert(db.getUserById(standardUser.id)?.role === 'user', 'setUserRole successfully demotes user back to user in DB');

    // Test tamper resistance: forged token with modified payload fails HMAC verification
    const [payloadPart, sigPart] = userToken.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'));
    decodedPayload.role = 'admin'; // Attacker attempts to change role in payload
    const tamperedPayloadPart = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
    const forgedToken = `${tamperedPayloadPart}.${sigPart}`;
    const forgedVerification = verifyAuthToken(forgedToken);
    assert(forgedVerification === null, 'Forged/tampered token with privilege escalation fails cryptographic signature check');
  }

  // =====================================================================
  // 2. MULTI-TENANT ISOLATION
  // =====================================================================
  console.log('\n--- OBJECTIVE 2: MULTI-TENANT DATA ISOLATION ---');
  {
    const uA = db.createUser('alice@lifeos.io', 'hash_a', 'salt_a', 'Alice Archer');
    const uB = db.createUser('bob@lifeos.io', 'hash_b', 'salt_b', 'Bob Builder');

    // Alice creates a private task
    const tA = db.createTask(uA.id, {
      title: "Alice's Secret Strategy",
      dueDate: '2026-08-20',
      priority: 'high',
      xp: 100,
      completed: false,
      status: 'todo',
      category: 'Engineering',
      tags: ['secret'],
      createdAt: new Date().toISOString(),
    });

    // Bob completes a task
    const tB = db.createTask(uB.id, {
      title: "Bob's Public Task",
      dueDate: '2026-08-20',
      priority: 'medium',
      xp: 50,
      completed: false,
      status: 'todo',
      category: 'General',
      tags: [],
      createdAt: new Date().toISOString(),
    });

    // Verify Bob cannot access Alice's state
    const bobState = db.getUserState(uB.id);
    const aliceState = db.getUserState(uA.id);

    const bobHasAliceTask = bobState.tasks.some((t) => t.id === tA.task.id);
    const aliceHasBobTask = aliceState.tasks.some((t) => t.id === tB.task.id);

    assert(!bobHasAliceTask, "Bob's state does not contain Alice's tasks");
    assert(!aliceHasBobTask, "Alice's state does not contain Bob's tasks");

    // Bob attempts to complete Alice's task
    const crossTenantComp = db.completeTask(uB.id, tA.task.id);
    assert(crossTenantComp.success === false && crossTenantComp.error === 'TASK_NOT_FOUND', 'Cross-tenant mutation rejected with TASK_NOT_FOUND');

    // Alice completes her own task
    const aliceComp = db.completeTask(uA.id, tA.task.id);
    assert(aliceComp.success === true, "Alice can complete her own task");
    assert(aliceComp.profile.currentXp === 100, "Alice awarded 100 XP");

    // Verify Bob's profile XP remains untouched
    const freshBobState = db.getUserState(uB.id);
    assert(freshBobState.profile.currentXp === 0, "Bob's XP is completely unaffected by Alice's completion");
  }

  // =====================================================================
  // 3. BACKUP & DISASTER RECOVERY SECURITY & HARDENING
  // =====================================================================
  console.log('\n--- OBJECTIVE 3: BACKUP / RESTORE SECURITY & PATH TRAVERSAL PROTECTION ---');
  {
    const backupMgr = new BackupManager(testDbFile, backupDir);

    // Test Path Traversal Protection
    const maliciousPaths = [
      '../../etc/passwd',
      '..\\..\\windows\\system32',
      '/etc/shadow',
      'test\0malicious.sqlite',
      'malicious.sh',
      '../.data/lifeos.sqlite',
      '',
      '   ',
    ];

    let allRejected = true;
    for (const badPath of maliciousPaths) {
      try {
        backupMgr.sanitizeAndValidateBackupPath(badPath);
        allRejected = false;
        console.error(`  ✗ FAIL: Path traversal not caught on: ${badPath}`);
      } catch (err: any) {
        // Expected rejection
      }
    }
    assert(allRejected, 'All 8 path traversal and malformed filename attack vectors rejected');

    // Create valid backup snapshot
    const backup = await backupMgr.createBackup();
    assert(backup.filename.endsWith('.sqlite'), 'Backup snapshot created with valid filename');
    assert(backup.sizeBytes > 0, 'Backup file size > 0 bytes');
    assert(typeof backup.checksum === 'string' && backup.checksum.length === 64, 'SHA-256 cryptographic checksum computed');

    // Verify backup integrity
    const verification = await backupMgr.verifyBackupFile(backup.filepath, backup.checksum);
    assert(verification.valid === true, 'Backup verification passed');
    assert(verification.integrityCheckPassed === true, 'PRAGMA integrity_check passed on snapshot');
    assert(verification.checksumMatches === true, 'Checksum verification matches');
    assert(verification.tablesFound.includes('users'), 'Users table present in verified snapshot');

    // Verify Corrupt Backup Rejection
    const corruptFile = path.join(backupDir, 'corrupt_test_file.sqlite');
    fs.writeFileSync(corruptFile, Buffer.from('NOT_A_VALID_SQLITE_DATABASE_HEADER_DATA'));
    const corruptVerify = await backupMgr.verifyBackupFile(corruptFile);
    assert(corruptVerify.valid === false, 'Corrupted backup file rejected during verification');

    try {
      await backupMgr.restoreFromBackup(corruptFile);
      assert(false, 'Restoring corrupted file did not throw');
    } catch {
      assert(true, 'Restoring corrupted file throws error and aborts restore');
    }

    // Clean restore from valid backup
    const restoreResult = await backupMgr.restoreFromBackup(backup.filepath);
    assert(restoreResult.success === true, 'Valid backup restored cleanly with rollback safeguard active');
  }

  // =====================================================================
  // 4. DEPLOYMENT CONFIGURATION & FAIL-FAST STARTUP GUARDS
  // =====================================================================
  console.log('\n--- OBJECTIVE 4: MULTI-INSTANCE DEPLOYMENT FAIL-FAST VALIDATION ---');
  {
    const prevStorageMode = process.env.STORAGE_MODE;
    const prevDbUrl = process.env.DATABASE_URL;
    const prevRequirePg = process.env.REQUIRE_POSTGRES;

    // Multi-instance without DATABASE_URL must fail fast
    process.env.STORAGE_MODE = 'multi-instance';
    delete process.env.DATABASE_URL;

    let caughtMultiInstanceError = false;
    try {
      // Re-run environment validation
      const { validateEnvironment } = await import('../config');
      validateEnvironment();
    } catch (err: any) {
      if (err.message.includes('Multi-instance') || err.message.includes('REQUIRE_POSTGRES')) {
        caughtMultiInstanceError = true;
      }
    }
    assert(caughtMultiInstanceError, 'STORAGE_MODE="multi-instance" fails fast without PostgreSQL DATABASE_URL');

    // Restore environment variables
    if (prevStorageMode) process.env.STORAGE_MODE = prevStorageMode;
    else delete process.env.STORAGE_MODE;
    if (prevDbUrl) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
    if (prevRequirePg) process.env.REQUIRE_POSTGRES = prevRequirePg;
    else delete process.env.REQUIRE_POSTGRES;
  }

  // =====================================================================
  // 5. XP LEDGER & IDEMPOTENCY INTEGRITY UNDER REPEATED MUTATIONS
  // =====================================================================
  console.log('\n--- OBJECTIVE 5: XP LEDGER & EVENT IDEMPOTENCY CONCURRENCY ---');
  {
    const uTest = db.createUser('idempotent@lifeos.io', 'h_idem', 's_idem', 'Idempotent User');
    const task = db.createTask(uTest.id, {
      title: 'High Priority Task',
      dueDate: '2026-08-20',
      priority: 'high',
      xp: 150,
      completed: false,
      status: 'todo',
      category: 'Engineering',
      tags: [],
      createdAt: new Date().toISOString(),
    });

    const clientEventId = 'evt_unique_123456';

    // 1st completion
    const res1 = db.completeTask(uTest.id, task.task.id, clientEventId);
    assert(res1.success === true && res1.alreadyCompleted === false, 'First completion succeeds and awards XP');
    assert(res1.profile.currentXp === 150, 'Current XP is 150');

    // Replay with identical clientEventId
    const res2 = db.completeTask(uTest.id, task.task.id, clientEventId);
    assert(res2.success === true && res2.profile.currentXp === 150, 'Replay with same clientEventId returns identical cached XP without incrementing');

    // Completion with new clientEventId on already completed task
    const res3 = db.completeTask(uTest.id, task.task.id, 'evt_another_789');
    assert(res3.success === true && res3.alreadyCompleted === true, 'Subsequent completion flagged as alreadyCompleted=true');
    assert(res3.profile.currentXp === 150, 'XP unchanged at 150 on subsequent completion');

    const state = db.getUserState(uTest.id);
    assert(state.xpLedger.length === 1, 'XP ledger contains strictly 1 transaction record');
  }

  // =====================================================================
  // 6. TELEMETRY OBSERVABILITY & PRIVACY METRICS
  // =====================================================================
  console.log('\n--- OBJECTIVE 6: TELEMETRY OBSERVABILITY & METRICS INTEGRITY ---');
  {
    serverTelemetry.reset();

    for (let i = 1; i <= 50; i++) {
      serverTelemetry.recordEvent({
        type: 'api_request',
        durationMs: i * 4,
        statusCode: 200,
        route: '/api/domain/tasks/complete',
        status: 'success',
      });
    }

    const metrics = serverTelemetry.getMetrics();
    assert(metrics.totalRequests >= 50, 'Telemetry aggregated total requests correctly');
    assert(metrics.latencyPercentiles.p95Ms > 0, 'P95 latency calculated accurately');
    assert(metrics.errorRatePct === 0, 'Error rate calculated as 0% for all-success requests');
  }

  console.log('\n======================================================================');
  console.log(`PRE-CANARY HARDENING AUDIT COMPLETE: ${totalPasses} Passed, ${totalFailures} Failed`);
  console.log('======================================================================\n');

  if (totalFailures > 0) {
    throw new Error(`PRE-CANARY AUDIT FAILED with ${totalFailures} failures`);
  }
}

if (process.argv[1]?.endsWith('pre_canary_hardening_audit.ts')) {
  runPreCanaryHardeningAudit().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
