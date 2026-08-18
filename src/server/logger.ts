export type LogLevel = 'info' | 'warn' | 'error' | 'security';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: 'AUTH' | 'SECURITY' | 'DATABASE' | 'SYNC' | 'AI' | 'BROKER' | 'RATE_LIMIT' | 'SYSTEM';
  message: string;
  context?: Record<string, any>;
}

const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'salt',
  'token',
  'auth_secret',
  'secret',
  'authorization',
  'cookie',
  'gemini_api_key',
  'apikey',
  'key',
]);

function sanitizeContext(data: any, depth = 0): any {
  if (depth > 3 || !data) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.slice(0, 10).map((item) => sanitizeContext(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.has(lowerKey) || lowerKey.includes('secret') || lowerKey.includes('password') || lowerKey.includes('token')) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeContext(val, depth + 1);
    } else if (typeof val === 'string' && val.length > 200) {
      sanitized[key] = `${val.slice(0, 197)}...`;
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export const logger = {
  log(level: LogLevel, category: LogEntry['category'], message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context: context ? sanitizeContext(context) : undefined,
    };

    const formatted = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.message}${
      entry.context ? ' ' + JSON.stringify(entry.context) : ''
    }`;

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'security':
        console.warn(`🔒 ${formatted}`);
        break;
      default:
        console.log(formatted);
        break;
    }
  },

  info(category: LogEntry['category'], message: string, context?: Record<string, any>) {
    this.log('info', category, message, context);
  },

  warn(category: LogEntry['category'], message: string, context?: Record<string, any>) {
    this.log('warn', category, message, context);
  },

  error(category: LogEntry['category'], message: string, context?: Record<string, any>) {
    this.log('error', category, message, context);
  },

  security(category: LogEntry['category'], message: string, context?: Record<string, any>) {
    this.log('security', category, message, context);
  },
};
