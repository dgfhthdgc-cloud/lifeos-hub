import assert from 'assert';
import http from 'http';
import fs from 'fs';
import { SqlDatabaseAdapter } from '../src/server/database/SqlDatabaseAdapter';
import { setActiveDatabase } from '../src/server/db';
import { generateAuthToken } from '../src/server/auth';
import { serverTelemetry } from '../src/server/telemetry';

// Prevent server.ts from auto-listening during import
process.env.NODE_ENV = 'test';
process.env.LIFEOS_SKIP_AUTO_START = 'true';

async function makeRequest(
  serverUrl: string,
  method: string,
  path: string,
  options: {
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, serverUrl);
    const postData = options.body !== undefined ? JSON.stringify(options.body) : null;
    const reqHeaders: Record<string, string> = {
      ...(postData ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let parsed: any = rawData;
          try {
            parsed = JSON.parse(rawData);
          } catch {}
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runProductionRouteRegressionSuite() {
  console.log('======================================================================');
  console.log('LIFE OS — PRODUCTION EXPRESS ROUTE & SECURITY REGRESSION SUITE');
  console.log('======================================================================\n');

  const testDbDir = './.data_production_route_test';
  if (fs.existsSync(testDbDir)) {
    fs.rmSync(testDbDir, { recursive: true, force: true });
  }

  const db = new SqlDatabaseAdapter(testDbDir);
  await db.initialize();
  setActiveDatabase(db);

  // Dynamic import of real production app
  const { createApp } = await import('../server');
  const app = await createApp({ skipVite: true });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  console.log(`[TEST RUNNER] Production Express App mounted on ${baseUrl}`);

  try {
    // -------------------------------------------------------------------------
    // SETUP TEST FIXTURES
    // -------------------------------------------------------------------------
    const userA = await db.createUser(
      'user_a@lifeos.internal',
      'hash_a',
      'salt_a',
      'User Alice',
      'user'
    );
    const userB = await db.createUser(
      'user_b@lifeos.internal',
      'hash_b',
      'salt_b',
      'User Bob',
      'user'
    );
    const adminUser = await db.createUser(
      'admin@lifeos.internal',
      'hash_admin',
      'salt_admin',
      'Admin Root',
      'admin'
    );

    const tokenUserA = generateAuthToken({
      userId: userA.id,
      email: userA.email,
      role: 'user',
      tokenVersion: 1,
    });

    const tokenUserB = generateAuthToken({
      userId: userB.id,
      email: userB.email,
      role: 'user',
      tokenVersion: 1,
    });

    const tokenAdmin = generateAuthToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: 'admin',
      tokenVersion: 1,
    });

    // -------------------------------------------------------------------------
    // SECTION 1: ARBITRARY XP ROUTE ELIMINATION
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 1: ARBITRARY XP ROUTE ELIMINATION ---');
    const xpAwardRes = await makeRequest(baseUrl, 'POST', '/api/gamification/award-xp', {
      headers: { Authorization: `Bearer ${tokenUserA}` },
      body: { amount: 5000, reason: 'Exploit attempt' },
    });
    assert.strictEqual(
      xpAwardRes.status,
      404,
      `Expected 404 Not Found for excised award-xp endpoint, got ${xpAwardRes.status}`
    );
    console.log('  ✓ PASS: POST /api/gamification/award-xp returns 404 (route completely excised)');

    // -------------------------------------------------------------------------
    // SECTION 2: SYNCHRONIZATION & DOMAIN MUTATIONS (POST /api/data/sync)
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: SYNCHRONIZATION SECURITY & PROTOCOL ENFORCEMENT ---');

    // 2.1 Legacy bulk state replacement rejected
    const legacySyncRes = await makeRequest(baseUrl, 'POST', '/api/data/sync', {
      headers: { Authorization: `Bearer ${tokenUserA}` },
      body: {
        baseVersion: 1,
        changes: {
          profile: { currentXp: 99999, level: 99 },
        },
      },
    });
    assert.strictEqual(legacySyncRes.status, 400);
    assert.strictEqual(legacySyncRes.body.error, 'OPERATION_BASED_SYNC_REQUIRED');
    console.log('  ✓ PASS: POST /api/data/sync rejects legacy bulk state changes payload (HTTP 400)');

    // 2.2 Missing operations array rejected
    const missingOpsRes = await makeRequest(baseUrl, 'POST', '/api/data/sync', {
      headers: { Authorization: `Bearer ${tokenUserA}` },
      body: { baseVersion: 1 },
    });
    assert.strictEqual(missingOpsRes.status, 400);
    assert.strictEqual(missingOpsRes.body.error, 'OPERATION_BASED_SYNC_REQUIRED');
    console.log('  ✓ PASS: POST /api/data/sync rejects payload missing operations array (HTTP 400)');

    // 2.3 Valid operation executes correctly
    const validOpRes = await makeRequest(baseUrl, 'POST', '/api/data/sync', {
      headers: { Authorization: `Bearer ${tokenUserA}` },
      body: {
        baseVersion: 1,
        operations: [
          {
            operationId: 'op_create_task_1',
            type: 'CREATE_TASK',
            payload: {
              task: {
                id: 'task_alice_1',
                title: 'Review System Metrics',
                priority: 'high',
                category: 'Engineering',
                xp: 100,
              },
            },
            clientEventId: 'evt_alice_task_create_1',
          },
        ],
      },
    });
    assert.strictEqual(validOpRes.status, 200);
    assert.strictEqual(validOpRes.body.success, true);
    assert.strictEqual(validOpRes.body.appliedCount, 1);
    console.log('  ✓ PASS: POST /api/data/sync applies valid domain operations successfully (HTTP 200)');

    // 2.4 Verify task in DB belongs exclusively to User A
    const aliceState = await db.getUserState(userA.id);
    assert.strictEqual(aliceState.tasks.length, 1);
    assert.strictEqual(aliceState.tasks[0].id, 'task_alice_1');
    console.log('  ✓ PASS: State updated canonically in DB for User A');

    // 2.5 Multi-tenant cross-user mutation rejected
    const crossSyncRes = await makeRequest(baseUrl, 'POST', '/api/data/sync', {
      headers: { Authorization: `Bearer ${tokenUserB}` },
      body: {
        baseVersion: 1,
        operations: [
          {
            operationId: 'op_steal_task',
            type: 'COMPLETE_TASK',
            payload: { taskId: 'task_alice_1' },
            clientEventId: 'evt_bob_steal_1',
          },
        ],
      },
    });
    assert.strictEqual(crossSyncRes.status, 200);
    assert.strictEqual(crossSyncRes.body.rejectedCount, 1);
    assert.strictEqual(crossSyncRes.body.operationResults[0].error, 'TASK_NOT_FOUND');
    console.log('  ✓ PASS: User B cannot mutate User A task via sync (Cross-tenant rejection)');

    // 2.6 Stale baseVersion returns conflict (HTTP 409)
    const staleSyncRes = await makeRequest(baseUrl, 'POST', '/api/data/sync', {
      headers: { Authorization: `Bearer ${tokenUserA}` },
      body: {
        baseVersion: 1, // Current server version is 2
        operations: [
          {
            operationId: 'op_stale_1',
            type: 'CREATE_TASK',
            payload: { task: { id: 'task_alice_stale', title: 'Stale' } },
            clientEventId: 'evt_stale_1',
          },
        ],
      },
    });
    assert.strictEqual(staleSyncRes.status, 409);
    assert.strictEqual(staleSyncRes.body.error, 'STATE_CONFLICT');
    assert.strictEqual(staleSyncRes.body.conflict, true);
    console.log('  ✓ PASS: Stale baseVersion returns HTTP 409 STATE_CONFLICT with current state');

    // 2.7 Task completion awards server-authoritative XP and writes to ledger
    const compRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: {
        Authorization: `Bearer ${tokenUserA}`,
        'x-client-event-id': 'evt_alice_comp_1',
      },
      body: {
        taskId: 'task_alice_1',
        clientEventId: 'evt_alice_comp_1',
        baseVersion: aliceState.version,
      },
    });
    assert.strictEqual(compRes.status, 200);
    assert.strictEqual(compRes.body.success, true);
    assert.strictEqual(compRes.body.profile.currentXp, 100);
    console.log('  ✓ PASS: Authoritative task completion awarded +100 XP');

    // 2.8 Duplicate replay with same clientEventId is idempotent (returns cached result)
    const replayRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: {
        Authorization: `Bearer ${tokenUserA}`,
        'x-client-event-id': 'evt_alice_comp_1',
      },
      body: {
        taskId: 'task_alice_1',
        clientEventId: 'evt_alice_comp_1',
        baseVersion: aliceState.version,
      },
    });
    assert.strictEqual(replayRes.status, 200);
    assert.strictEqual(replayRes.body.profile.currentXp, 100);
    assert.strictEqual(replayRes.body.success, true);
    console.log('  ✓ PASS: Duplicate event replay is strictly idempotent (cached response returned)');

    // 2.8b Subsequent completion with new clientEventId on completed task returns alreadyCompleted
    const secondCompRes = await makeRequest(baseUrl, 'POST', '/api/domain/tasks/complete', {
      headers: {
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: {
        taskId: 'task_alice_1',
        clientEventId: 'evt_alice_comp_2',
      },
    });
    assert.strictEqual(secondCompRes.status, 200);
    assert.strictEqual(secondCompRes.body.alreadyCompleted, true);
    assert.strictEqual(secondCompRes.body.profile.currentXp, 100);
    console.log('  ✓ PASS: Completed task re-execution safely returns alreadyCompleted flag (no XP inflation)');

    // 2.9 Verify XP Ledger Mathematical Integrity Proof in DB
    const finalAliceState = await db.getUserState(userA.id);
    const ledgerTx = finalAliceState.xpLedger;
    const ledgerSum = ledgerTx.reduce((acc, t) => acc + t.amount, 0);
    assert.strictEqual(ledgerTx.length, 1);
    assert.strictEqual(ledgerSum, 100);
    assert.strictEqual(finalAliceState.profile.currentXp, 100);
    console.log('  ✓ PASS: DB XP ledger sum strictly equals user profile currentXp (100 XP)');

    // -------------------------------------------------------------------------
    // SECTION 3: TELEMETRY SECURITY & USER IDENTITY DERIVATION
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: TELEMETRY IDENTITY SPOOFING & SANITIZATION ---');

    // 3.1 Anonymous request submitting spoofed userId
    const anonTelemRes = await makeRequest(baseUrl, 'POST', '/api/telemetry/events', {
      body: {
        events: [
          {
            type: 'domain_event',
            userId: 'admin_victim_spoof',
            category: 'view_dashboard',
          },
        ],
      },
    });
    assert.strictEqual(anonTelemRes.status, 200);
    assert.strictEqual(anonTelemRes.body.received, 1);
    assert.strictEqual(anonTelemRes.body.userId, 'anonymous');

    const latestEvents = serverTelemetry.getRecentEvents(10);
    const recordedAnon = latestEvents.find((e) => e.category === 'view_dashboard');
    assert.ok(recordedAnon, 'Recorded telemetry event must exist');
    assert.strictEqual(
      recordedAnon.userId,
      'anonymous',
      `Expected 'anonymous' user for unauthenticated telemetry, got ${recordedAnon.userId}`
    );
    console.log('  ✓ PASS: Unauthenticated telemetry resolves strictly to "anonymous", ignoring client-submitted userId');

    // 3.2 Authenticated User A submitting spoofed User B id
    const authTelemRes = await makeRequest(baseUrl, 'POST', '/api/telemetry/events', {
      headers: { Authorization: `Bearer ${tokenUserA}` },
      body: {
        events: [
          {
            type: 'domain_event',
            userId: userB.id,
            category: 'feature_click',
          },
        ],
      },
    });
    assert.strictEqual(authTelemRes.status, 200);
    assert.strictEqual(authTelemRes.body.received, 1);
    assert.strictEqual(authTelemRes.body.userId, userA.id);

    const latestEvents2 = serverTelemetry.getRecentEvents(10);
    const recordedAuth = latestEvents2.find((e) => e.category === 'feature_click');
    assert.ok(recordedAuth, 'Recorded telemetry event must exist');
    assert.strictEqual(
      recordedAuth.userId,
      userA.id,
      `Expected verified JWT userId (${userA.id}), got ${recordedAuth.userId}`
    );
    console.log('  ✓ PASS: Authenticated telemetry derives identity exclusively from verified JWT, ignoring client-submitted userId');

    // -------------------------------------------------------------------------
    // SECTION 4: AUTHENTICATION & RBAC GUARDS
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 4: AUTHENTICATION & RBAC GUARDS ---');

    // 4.1 Anonymous request to protected endpoint
    const unauthRes = await makeRequest(baseUrl, 'GET', '/api/auth/me');
    assert.strictEqual(unauthRes.status, 401);
    assert.strictEqual(unauthRes.body.error, 'UNAUTHORIZED');
    console.log('  ✓ PASS: Anonymous request to protected route returns 401 UNAUTHORIZED');

    // 4.2 Malformed token
    const malformedRes = await makeRequest(baseUrl, 'GET', '/api/auth/me', {
      headers: { Authorization: 'Bearer not.a.valid.jwt' },
    });
    assert.strictEqual(malformedRes.status, 401);
    assert.strictEqual(malformedRes.body.error, 'INVALID_TOKEN');
    console.log('  ✓ PASS: Malformed token string returns 401 INVALID_TOKEN');

    // 4.3 Tampered signature
    const [payloadPart] = tokenUserA.split('.');
    const forgedToken = `${payloadPart}.invalidsignature1234567890`;
    const tamperedRes = await makeRequest(baseUrl, 'GET', '/api/auth/me', {
      headers: { Authorization: `Bearer ${forgedToken}` },
    });
    assert.strictEqual(tamperedRes.status, 401);
    assert.strictEqual(tamperedRes.body.error, 'INVALID_TOKEN');
    console.log('  ✓ PASS: Tampered token signature returns 401 INVALID_TOKEN');

    // 4.4 Forged admin role in payload without valid secret
    const forgedAdminPayload = Buffer.from(
      JSON.stringify({ userId: userA.id, email: userA.email, role: 'admin', exp: Date.now() + 100000 })
    ).toString('base64url');
    const forgedAdminToken = `${forgedAdminPayload}.fakeAdminSig`;
    const forgedAdminRes = await makeRequest(baseUrl, 'GET', '/api/admin/ready', {
      headers: { Authorization: `Bearer ${forgedAdminToken}` },
    });
    assert.strictEqual(forgedAdminRes.status, 401);
    console.log('  ✓ PASS: Forged admin role token strictly rejected with 401');

    // 4.5 Standard user attempting to access admin route
    const standardUserAdminRes = await makeRequest(baseUrl, 'GET', '/api/admin/ready', {
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    assert.strictEqual(standardUserAdminRes.status, 403);
    assert.strictEqual(standardUserAdminRes.body.error, 'FORBIDDEN');
    console.log('  ✓ PASS: Standard user accessing admin route returns 403 FORBIDDEN');

    // 4.6 Verified admin accessing admin route
    const adminRes = await makeRequest(baseUrl, 'GET', '/api/admin/ready', {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.strictEqual(adminRes.status, 200);
    assert.strictEqual(adminRes.body.status, 'ready');
    console.log('  ✓ PASS: Verified admin user granted access to admin endpoint (HTTP 200)');

    // 4.7 Session revocation / token version freshness
    await db.invalidateUserSessions(userA.id);
    const revokedTokenRes = await makeRequest(baseUrl, 'GET', '/api/auth/me', {
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    assert.strictEqual(revokedTokenRes.status, 401);
    assert.strictEqual(revokedTokenRes.body.error, 'SESSION_REVOKED');
    console.log('  ✓ PASS: Invalidated session token_version returns 401 SESSION_REVOKED');

    console.log('\n======================================================================');
    console.log('ALL PRODUCTION ROUTE INTEGRATION TESTS PASSED 100%');
    console.log('======================================================================\n');
  } finally {
    server.close();
    await db.close();
    if (fs.existsSync(testDbDir)) {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    }
  }
}

runProductionRouteRegressionSuite().catch((err) => {
  console.error('PRODUCTION ROUTE INTEGRATION TEST FAILURE:', err);
  process.exit(1);
});
