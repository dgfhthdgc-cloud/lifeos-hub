import { isValidPostgresUrl, sanitizeDatabaseUrl, initDatabase } from '../src/server/db';
import { validateEnvironment } from '../src/server/config';

async function runPostgresReadinessTests() {
  console.log('======================================================================');
  console.log('LIFE OS — POSTGRESQL PRODUCTION READINESS & FAIL-FAST GUARDS TEST');
  console.log('======================================================================');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
    }
  }

  // 1. URL Validation & Credential Redaction Tests
  assert(isValidPostgresUrl('postgresql://user:pass@ep-staging-123.us-east-1.aws.neon.tech/lifeos?sslmode=require'), 'Valid postgresql:// URL passes validation');
  assert(isValidPostgresUrl('postgres://user:pass@localhost:5432/lifeos'), 'Valid postgres:// URL passes validation');
  assert(!isValidPostgresUrl(''), 'Empty string fails URL validation');
  assert(!isValidPostgresUrl(undefined), 'Undefined URL fails validation');
  assert(!isValidPostgresUrl('mysql://localhost:3306/db'), 'Non-postgres URL fails validation');
  assert(!isValidPostgresUrl('https://example.com'), 'HTTP URL fails validation');

  const sanitized = sanitizeDatabaseUrl('postgresql://postgres_admin:SuperSecretPass123!@db.production.cluster.local:5432/lifeos_db');
  assert(sanitized.includes('***') && !sanitized.includes('SuperSecretPass123!'), 'Database credentials correctly redacted in logs');

  // 2. Fail-Fast Guard: Missing DATABASE_URL when REQUIRE_POSTGRES=true
  {
    const prevEnv = { ...process.env };
    try {
      process.env.NODE_ENV = 'production';
      process.env.REQUIRE_POSTGRES = 'true';
      process.env.AUTH_SECRET = 'a-super-secret-auth-key-16-bytes';
      delete process.env.DATABASE_URL;

      let threw = false;
      try {
        await initDatabase();
      } catch (err: any) {
        threw = true;
        assert(err.message.includes('FATAL DATABASE CONFIGURATION'), 'initDatabase() throws when REQUIRE_POSTGRES=true and DATABASE_URL is missing');
      }
      assert(threw, 'Missing DATABASE_URL with REQUIRE_POSTGRES=true blocked execution');
    } finally {
      process.env = prevEnv;
    }
  }

  // 3. Fail-Fast Guard: Invalid DATABASE_URL when STORAGE_MODE=multi-instance
  {
    const prevEnv = { ...process.env };
    try {
      process.env.NODE_ENV = 'production';
      process.env.STORAGE_MODE = 'multi-instance';
      process.env.DATABASE_URL = 'sqlite://invalid/path.db';
      process.env.AUTH_SECRET = 'a-super-secret-auth-key-16-bytes';

      let threw = false;
      try {
        await initDatabase();
      } catch (err: any) {
        threw = true;
        assert(err.message.includes('FATAL DATABASE CONFIGURATION'), 'initDatabase() throws when STORAGE_MODE=multi-instance and DATABASE_URL is invalid');
      }
      assert(threw, 'Invalid DATABASE_URL with STORAGE_MODE=multi-instance blocked execution');
    } finally {
      process.env = prevEnv;
    }
  }

  // 4. Fail-Fast Guard: Multi-instance config validation
  {
    const prevEnv = { ...process.env };
    try {
      process.env.NODE_ENV = 'production';
      process.env.STORAGE_MODE = 'multi-instance';
      process.env.AUTH_SECRET = 'a-super-secret-auth-key-16-bytes';
      delete process.env.DATABASE_URL;

      let threw = false;
      try {
        validateEnvironment();
      } catch (err: any) {
        threw = true;
        assert(err.message.includes('Multi-instance or REQUIRE_POSTGRES mode requires a valid PostgreSQL'), 'validateEnvironment() throws when multi-instance is active without valid postgres URL');
      }
      assert(threw, 'validateEnvironment blocks multi-instance without postgres URL');
    } finally {
      process.env = prevEnv;
    }
  }

  // 5. Valid PostgreSQL Configuration Recognition
  {
    const prevEnv = { ...process.env };
    try {
      process.env.NODE_ENV = 'production';
      process.env.STORAGE_MODE = 'multi-instance';
      process.env.DATABASE_URL = 'postgresql://user:pass@db.staging.internal:5432/lifeos_prod';
      process.env.AUTH_SECRET = 'a-super-secret-auth-key-16-bytes';

      const config = validateEnvironment();
      assert(config.isPostgres === true, 'validateEnvironment accurately recognizes valid PostgreSQL databaseUrl');
      assert(config.isMultiInstance === true, 'validateEnvironment recognizes multi-instance topology');
    } finally {
      process.env = prevEnv;
    }
  }

  console.log('======================================================================');
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('======================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runPostgresReadinessTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
