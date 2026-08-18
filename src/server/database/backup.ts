import fs from 'fs';
import path from 'path';

export interface BackupResult {
  success: boolean;
  backupPath?: string;
  timestamp: string;
  sizeBytes?: number;
  error?: string;
}

export function createDatabaseBackup(customDbPath?: string): BackupResult {
  const dataDir = path.join(process.cwd(), '.data');
  const backupDir = path.join(dataDir, 'backups');
  const dbPath = customDbPath || path.join(dataDir, 'lifeos.sqlite');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    return {
      success: false,
      timestamp,
      error: 'Primary database file does not exist to back up.',
    };
  }

  try {
    const backupPath = path.join(backupDir, `lifeos_backup_${timestamp}.sqlite`);
    fs.copyFileSync(dbPath, backupPath);
    const stats = fs.statSync(backupPath);

    return {
      success: true,
      backupPath,
      timestamp,
      sizeBytes: stats.size,
    };
  } catch (err: any) {
    return {
      success: false,
      timestamp,
      error: err?.message,
    };
  }
}

export function restoreDatabaseBackup(backupFilename: string, customDbPath?: string): { success: boolean; error?: string } {
  const dataDir = path.join(process.cwd(), '.data');
  const backupDir = path.join(dataDir, 'backups');
  const dbPath = customDbPath || path.join(dataDir, 'lifeos.sqlite');
  const sourcePath = path.join(backupDir, backupFilename);

  if (!fs.existsSync(sourcePath)) {
    return { success: false, error: `Backup file ${backupFilename} does not exist.` };
  }

  try {
    // Create pre-restore safety copy
    if (fs.existsSync(dbPath)) {
      const preRestorePath = path.join(dataDir, `pre_restore_${Date.now()}.sqlite`);
      fs.copyFileSync(dbPath, preRestorePath);
    }
    fs.copyFileSync(sourcePath, dbPath);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
