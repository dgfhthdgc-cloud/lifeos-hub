import { validateEnvironment } from '../config';
import { logger } from '../logger';
import {
  generateAuthToken,
  verifyAuthToken,
  hashPassword,
  verifyPassword,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from '../auth';
import { SqlDatabaseAdapter } from '../database/SqlDatabaseAdapter';
import { BrokerManager } from '../../lib/broker/BrokerManager';
import fs from 'fs';
import path from 'path';

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

async function runPhase3Tests() {
  console.log('==================================================');
  console.log('LIFEOS HUB — PHASE 3 PRODUCTION HARDENING TEST SUITE');
  console.log('==================================================\n');

  // DOMAIN 1: CONFIGURATION & ENVIRONMENT VALIDATION
  console.log('TEST GROUP 1: Production Configuration Safety');
  const config = validateEnvironment();
  assert(config.port === 3000, 'Port is bound strictly to 3000');
  assert(config.enableLiveTrading === false, 'Live trading is locked to false in configuration');
  assert(typeof config.nodeEnv === 'string', 'NODE_ENV is resolved');

  // DOMAIN 2: STRUCTURED LOGGING & REDACTION
  console.log('\nTEST GROUP 2: Structured Logging & Secret Redaction');
  let loggedOutput = '';
  const originalLog = console.log;
  console.log = (msg: string) => {
    loggedOutput += msg;
  };
  logger.info('AUTH', 'User signed in', {
    password: 'SuperSecretPassword123!',
    token: 'jwt.token.secret',
    userEmail: 'pilot@lifeos.internal',
  });
  console.log = originalLog;
  assert(loggedOutput.includes('[REDACTED]'), 'Sensitive fields (password, token) are redacted in log output');
  assert(!loggedOutput.includes('SuperSecretPassword123!'), 'Plaintext password is never leaked to logs');

  // DOMAIN 3: AUTHENTICATION & TOKEN LIFECYCLE
  console.log('\nTEST GROUP 3: Authentication & Password Reset Tokens');
  const { hash, salt } = hashPassword('TestPassword123!');
  assert(verifyPassword('TestPassword123!', hash, salt) === true, 'Password verification succeeds with correct password');
  assert(verifyPassword('WrongPassword', hash, salt) === false, 'Password verification fails with incorrect password');

  const authToken = generateAuthToken({ userId: 'usr_test_1', email: 'test@lifeos.internal' });
  const verifiedAuth = verifyAuthToken(authToken);
  assert(verifiedAuth !== null && verifiedAuth.userId === 'usr_test_1', 'Auth token generated and verified accurately');

  // Password reset token test
  const resetToken = generatePasswordResetToken('usr_test_1', 'test@lifeos.internal', hash);
  const verifiedReset = verifyPasswordResetToken(resetToken, hash);
  assert(verifiedReset !== null && verifiedReset.userId === 'usr_test_1', 'Password reset token is verified with matching password hash');

  // Reset token invalidated after password change
  const { hash: newHash } = hashPassword('NewPassword456!');
  const invalidReset = verifyPasswordResetToken(resetToken, newHash);
  assert(invalidReset === null, 'Password reset token is automatically invalidated when password changes');

  // DOMAIN 4: DATABASE READINESS & CONCURRENCY
  console.log('\nTEST GROUP 4: Database Readiness & Lifecycle');
  const testDbDir = path.join(process.cwd(), '.data_test');
  if (!fs.existsSync(testDbDir)) fs.mkdirSync(testDbDir, { recursive: true });
  const testDbPath = path.join(testDbDir, 'test_lifeos.sqlite');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const testDb = new SqlDatabaseAdapter(testDbPath);
  await testDb.initialize();
  assert(testDb.isReady() === true, 'Database isReady() returns true after initialization');

  const createdUser = testDb.createUser('agent@lifeos.internal', hash, salt, 'Agent Matrix');
  assert(createdUser.id.length > 0, 'Database creates user record');

  const initialStats = testDb.getStats();
  assert(initialStats.userCount >= 1, 'Database getStats() returns correct user count');

  // Authoritative task complete
  const createdTask = testDb.createTask(createdUser.id, {
    title: 'Harden production release',
    priority: 'high',
    status: 'todo',
    category: 'Engineering',
    tags: ['p0', 'security'],
    dueDate: '2026-08-18',
    xp: 50,
    completed: false,
    createdAt: new Date().toISOString(),
  });
  assert(createdTask.success === true, 'Task created successfully in SQLite');

  const completeResult = testDb.completeTask(createdUser.id, createdTask.task.id, 'event-complete-01');
  assert(completeResult.success === true, 'Task completed with authoritative XP award');
  assert(completeResult.profile?.currentXp! > 0, 'User XP incremented on task completion');

  // Test idempotency
  const dupResult = testDb.completeTask(createdUser.id, createdTask.task.id, 'event-complete-01');
  assert(dupResult.success === true, 'Duplicate event with same clientEventId returns cached result');
  assert(dupResult.version === completeResult.version, 'Duplicate event does not increment state version');

  // Clean close
  await testDb.close();
  assert(testDb.isReady() === false, 'Database is marked unready after close()');

  // Cleanup test database
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  try {
    if (fs.existsSync(testDbDir)) fs.rmSync(testDbDir, { recursive: true, force: true });
  } catch {}

  // DOMAIN 5: PAPER TRADING SAFETY ENFORCEMENT
  console.log('\nTEST GROUP 5: Trading Safety & Live Execution Rejection');
  const brokerAccount = await BrokerManager.getAccount();
  assert(brokerAccount.mode === 'PAPER', 'BrokerManager initializes in PAPER mode');
  assert(BrokerManager.isLiveExecutionAvailable() === false, 'isLiveExecutionAvailable() returns false');

  // Attempt submitting paper order
  const orderResult = await BrokerManager.submitOrder(
    {
      symbol: 'SPY',
      direction: 'long',
      orderType: 'market',
      quantity: 10,
      mode: 'PAPER',
    },
    520.5
  );
  assert(orderResult.success === true && !!orderResult.order, 'Paper order executes successfully in simulation engine');

  // Verify that live mode rejects execution
  BrokerManager.setMode('LIVE');
  const liveOrderResult = await BrokerManager.submitOrder(
    {
      symbol: 'SPY',
      direction: 'long',
      orderType: 'market',
      quantity: 10,
      mode: 'PAPER',
    },
    520.5
  );
  assert(liveOrderResult.success === false, 'Live order submission is strictly blocked and rejected');
  BrokerManager.setMode('PAPER'); // Restore safely


  // SUMMARY REPORT
  console.log('\n==================================================');
  console.log(`PHASE 3 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
