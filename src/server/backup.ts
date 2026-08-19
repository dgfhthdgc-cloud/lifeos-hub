import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import initSqlJs, { SqlJsStatic } from 'sql.js';

export interface BackupMetadata {
  filename: string;
  filepath: string;
  sizeBytes: number;
  checksum: string;
  createdAt: string;
  userCount: number;
  tableCount: number;
}

export interface BackupVerificationResult {
  valid: boolean;
  checksumMatches: boolean;
  integrityCheckPassed: boolean;
  tablesFound: string[];
  userCount: number;
  error?: string;
}

export class BackupManager {
  private backupDir: string;
  private dbPath: string;

  constructor(customDbPath?: string, customBackupDir?: string) {
    const rootDataDir = path.join(process.cwd(), '.data');
    this.dbPath = customDbPath || path.join(rootDataDir, 'lifeos.sqlite');
    this.backupDir = customBackupDir || path.join(process.cwd(), '.backups');

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Strictly validate and sanitize backup filepaths against path traversal attacks.
   */
  public sanitizeAndValidateBackupPath(inputPath: string): string {
    if (!inputPath || typeof inputPath !== 'string' || inputPath.trim().length === 0) {
      throw new Error('INVALID_PATH: Backup filepath must be a non-empty string');
    }

    const trimmed = inputPath.trim();

    // Reject null bytes and path traversal patterns
    if (trimmed.includes('\0') || trimmed.includes('..')) {
      throw new Error('PATH_TRAVERSAL_DETECTED: Path traversal sequences are strictly prohibited');
    }

    const normalizedBackupDir = path.resolve(this.backupDir);
    let resolvedTarget: string;

    if (path.isAbsolute(trimmed)) {
      resolvedTarget = path.resolve(trimmed);
      const isInsideBackupDir = resolvedTarget.startsWith(normalizedBackupDir + path.sep) || resolvedTarget === normalizedBackupDir;
      const isLiveDb = resolvedTarget === path.resolve(this.dbPath);
      const isTestDataDir = resolvedTarget.includes(path.join(process.cwd(), '.data')) || resolvedTarget.includes(path.join(process.cwd(), '.backups'));

      if (!isInsideBackupDir && !isLiveDb && !isTestDataDir) {
        throw new Error('PATH_TRAVERSAL_DETECTED: Target path is outside authorized backup directories');
      }
    } else {
      // Relative filename - validate strict filename pattern
      const filename = path.basename(trimmed);
      if (!/^[a-zA-Z0-9_\-\.]+\.sqlite$/.test(filename)) {
        throw new Error('INVALID_FILENAME: Backup filename must end in .sqlite and contain only alphanumeric, dash, or underscore characters');
      }
      resolvedTarget = path.resolve(this.backupDir, filename);
      if (!resolvedTarget.startsWith(normalizedBackupDir)) {
        throw new Error('PATH_TRAVERSAL_DETECTED: Resolved path escapes backup directory');
      }
    }

    return resolvedTarget;
  }

  /**
   * Create an instantaneous, point-in-time snapshot of the database
   */
  public async createBackup(): Promise<BackupMetadata> {
    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`Cannot create backup: database file not found at ${this.dbPath}`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `lifeos_backup_${timestamp}.sqlite`;
    const targetPath = path.join(this.backupDir, filename);

    // Read source database buffer
    const dbBuffer = fs.readFileSync(this.dbPath);

    // Compute cryptographic SHA256 checksum
    const hash = crypto.createHash('sha256').update(dbBuffer).digest('hex');

    // Write backup file
    fs.writeFileSync(targetPath, dbBuffer);

    // Verify snapshot and extract table/user stats
    const verification = await this.verifyBackupFile(targetPath, hash);

    const metadata: BackupMetadata = {
      filename,
      filepath: targetPath,
      sizeBytes: dbBuffer.length,
      checksum: hash,
      createdAt: new Date().toISOString(),
      userCount: verification.userCount,
      tableCount: verification.tablesFound.length,
    };

    // Also write a sidecar .meta.json for instant offline inspection
    const metaPath = targetPath + '.meta.json';
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

    return metadata;
  }

  /**
   * Verify backup file integrity and structure
   */
  public async verifyBackupFile(backupFilePath: string, expectedChecksum?: string): Promise<BackupVerificationResult> {
    let sanitizedPath: string;
    try {
      sanitizedPath = this.sanitizeAndValidateBackupPath(backupFilePath);
    } catch (err: any) {
      return {
        valid: false,
        checksumMatches: false,
        integrityCheckPassed: false,
        tablesFound: [],
        userCount: 0,
        error: err?.message || 'Invalid backup filepath',
      };
    }

    if (!fs.existsSync(sanitizedPath)) {
      return {
        valid: false,
        checksumMatches: false,
        integrityCheckPassed: false,
        tablesFound: [],
        userCount: 0,
        error: 'Backup file does not exist on disk',
      };
    }

    try {
      const fileBuffer = fs.readFileSync(sanitizedPath);
      const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const checksumMatches = expectedChecksum ? computedHash === expectedChecksum : true;
      if (expectedChecksum && !checksumMatches) {
        return {
          valid: false,
          checksumMatches: false,
          integrityCheckPassed: false,
          tablesFound: [],
          userCount: 0,
          error: 'SHA256 checksum mismatch detected. Backup is corrupt.',
        };
      }

      // Initialize temporary SQLite instance to check integrity
      const SQL = await initSqlJs();
      const testDb = new SQL.Database(fileBuffer);

      // Check SQLite integrity PRAGMA
      const integrityStmt = testDb.prepare('PRAGMA integrity_check;');
      integrityStmt.step();
      const integrityRow = integrityStmt.getAsObject();
      integrityStmt.free();

      const integrityCheckPassed = integrityRow.integrity_check === 'ok';

      // Check tables
      const tableStmt = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
      const tables: string[] = [];
      while (tableStmt.step()) {
        const row = tableStmt.getAsObject();
        if (row.name) tables.push(String(row.name));
      }
      tableStmt.free();

      // Check user count if users table exists
      let userCount = 0;
      if (tables.includes('users')) {
        const userStmt = testDb.prepare('SELECT COUNT(*) as count FROM users');
        if (userStmt.step()) {
          userCount = Number(userStmt.getAsObject().count) || 0;
        }
        userStmt.free();
      }

      testDb.close();

      return {
        valid: integrityCheckPassed,
        checksumMatches: true,
        integrityCheckPassed,
        tablesFound: tables,
        userCount,
      };
    } catch (err: any) {
      return {
        valid: false,
        checksumMatches: false,
        integrityCheckPassed: false,
        tablesFound: [],
        userCount: 0,
        error: err?.message || 'Failed to inspect backup file',
      };
    }
  }

  /**
   * Restore database from a verified backup file with pre-restore snapshot and rollback guard
   */
  public async restoreFromBackup(backupFilePath: string): Promise<{ success: boolean; restoredTables: number; userCount: number }> {
    const sanitizedPath = this.sanitizeAndValidateBackupPath(backupFilePath);
    const verification = await this.verifyBackupFile(sanitizedPath);
    if (!verification.valid || !verification.integrityCheckPassed) {
      throw new Error(`Cannot restore corrupted backup: ${verification.error || 'Integrity check failed'}`);
    }

    // Safety: take pre-restore snapshot of current database if exists
    let preRestorePath: string | null = null;
    if (fs.existsSync(this.dbPath)) {
      preRestorePath = `${this.dbPath}.pre_restore_${Date.now()}`;
      fs.copyFileSync(this.dbPath, preRestorePath);
    }

    try {
      // Copy backup buffer to live database path
      fs.copyFileSync(sanitizedPath, this.dbPath);

      // Post-restore integrity verification
      const postVerification = await this.verifyBackupFile(this.dbPath);
      if (!postVerification.valid || !postVerification.integrityCheckPassed) {
        throw new Error('Post-restore live database integrity verification failed');
      }

      return {
        success: true,
        restoredTables: verification.tablesFound.length,
        userCount: verification.userCount,
      };
    } catch (err: any) {
      // Rollback to pre-restore snapshot if available
      if (preRestorePath && fs.existsSync(preRestorePath)) {
        fs.copyFileSync(preRestorePath, this.dbPath);
      }
      throw new Error(`Restore failed and was rolled back: ${err?.message}`);
    }
  }

  /**
   * List available backups sorted descending by creation time
   */
  public listBackups(): BackupMetadata[] {
    if (!fs.existsSync(this.backupDir)) return [];

    const files = fs.readdirSync(this.backupDir);
    const backups: BackupMetadata[] = [];

    for (const file of files) {
      if (file.endsWith('.sqlite')) {
        const fullPath = path.join(this.backupDir, file);
        const metaPath = fullPath + '.meta.json';
        const stat = fs.statSync(fullPath);

        let metadata: Partial<BackupMetadata> = {};
        if (fs.existsSync(metaPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          } catch {
            // ignore
          }
        }

        backups.push({
          filename: file,
          filepath: fullPath,
          sizeBytes: stat.size,
          checksum: metadata.checksum || 'unknown',
          createdAt: metadata.createdAt || stat.birthtime.toISOString(),
          userCount: metadata.userCount || 0,
          tableCount: metadata.tableCount || 0,
        });
      }
    }

    return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const backupManager = new BackupManager();
