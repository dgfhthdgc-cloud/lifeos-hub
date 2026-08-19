export interface AppConfig {
  nodeEnv: string;
  port: number;
  authSecret: string;
  geminiApiKey: string | null;
  databaseUrl: string | null;
  isPostgres: boolean;
  requirePostgres: boolean;
  isMultiInstance: boolean;
  enableLiveTrading: boolean;
}

let validatedConfig: AppConfig | null = null;

export function validateEnvironment(): AppConfig {
  if (validatedConfig) return validatedConfig;

  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = 3000; // Hardcoded port 3000 as mandated by platform
  const authSecret = process.env.AUTH_SECRET?.trim() || '';
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim() || null;
  const databaseUrl = process.env.DATABASE_URL?.trim() || null;
  const requirePostgres = process.env.REQUIRE_POSTGRES === 'true';
  const isMultiInstance =
    process.env.STORAGE_MODE === 'multi-instance' ||
    process.env.DEPLOYMENT_MODE === 'multi_instance' ||
    process.env.MULTI_INSTANCE === 'true' ||
    process.env.CLUSTER_MODE === 'true';

  // Live trading is permanently disabled in architecture
  const enableLiveTrading = false;

  // Production Auth Secret Enforcement
  if (nodeEnv === 'production') {
    if (!authSecret || authSecret.length < 16) {
      throw new Error(
        'FATAL PRODUCTION CONFIGURATION: AUTH_SECRET must be set and contain at least 16 characters in production environment.'
      );
    }
  }

  // Database URL Validation
  let isPostgres = false;
  if (databaseUrl) {
    if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
      try {
        const parsed = new URL(databaseUrl);
        if (parsed.hostname && parsed.hostname !== 'base' && !parsed.hostname.includes(' ')) {
          isPostgres = true;
        }
      } catch {
        isPostgres = false;
      }
    }
  }

  if ((requirePostgres || isMultiInstance) && !isPostgres) {
    throw new Error(
      'FATAL CONFIGURATION: Multi-instance or REQUIRE_POSTGRES mode requires a valid PostgreSQL DATABASE_URL. SQLite is strictly single-instance only.'
    );
  }

  validatedConfig = {
    nodeEnv,
    port,
    authSecret,
    geminiApiKey,
    databaseUrl,
    isPostgres,
    requirePostgres,
    isMultiInstance,
    enableLiveTrading,
  };

  return validatedConfig;
}

export function getConfig(): AppConfig {
  if (!validatedConfig) {
    return validateEnvironment();
  }
  return validatedConfig;
}
