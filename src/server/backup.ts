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
    if (!fs.existsSync(backupFilePath)) {
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
      const fileBuffer = fs.readFileSync(backupFilePath);
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
   * Restore database from a verified backup file
   */
  public async restoreFromBackup(backupFilePath: string): Promise<{ success: boolean; restoredTables: number; userCount: number }> {
    const verification = await this.verifyBackupFile(backupFilePath);
    if (!verification.valid || !verification.integrityCheckPassed) {
      throw new Error(`Cannot restore corrupted backup: ${verification.error || 'Integrity check failed'}`);
    }

    // Safety: take pre-restore snapshot of current database if exists
    if (fs.existsSync(this.dbPath)) {
      const preRestorePath = `${this.dbPath}.pre_restore_${Date.now()}`;
      fs.copyFileSync(this.dbPath, preRestorePath);
    }

    // Copy backup buffer to live database path
    fs.copyFileSync(backupFilePath, this.dbPath);

    return {
      success: true,
      restoredTables: verification.tablesFound.length,
      userCount: verification.userCount,
    };
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
