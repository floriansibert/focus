import { db } from './db';
import type { DataOperation, DataOperationFormat, ImportMode } from '../types/task';

class DataOperationLogger {
  /**
   * Log an import operation
   */
  async logImport(params: {
    filename: string;
    fileSizeBytes: number;
    taskCount: number;
    tagCount: number;
    peopleCount: number;
    importMode: ImportMode;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const entry: Omit<DataOperation, 'id'> = {
        timestamp: new Date(),
        operationType: 'import',
        format: 'json', // Always JSON for imports
        filename: params.filename,
        fileSizeBytes: params.fileSizeBytes,
        taskCount: params.taskCount,
        tagCount: params.tagCount,
        peopleCount: params.peopleCount,
        importMode: params.importMode,
        success: params.success,
        errorMessage: params.errorMessage,
      };

      await db.dataOperations.add(entry);
      console.log('Import operation logged:', entry);
    } catch (error) {
      console.error('Error logging import operation:', error);
    }
  }

  /**
   * Log an export operation
   */
  async logExport(params: {
    filename: string;
    fileSizeBytes: number;
    format: DataOperationFormat;
    taskCount: number;
    tagCount: number;
    peopleCount: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const entry: Omit<DataOperation, 'id'> = {
        timestamp: new Date(),
        operationType: 'export',
        format: params.format,
        filename: params.filename,
        fileSizeBytes: params.fileSizeBytes,
        taskCount: params.taskCount,
        tagCount: params.tagCount,
        peopleCount: params.peopleCount,
        success: params.success,
        errorMessage: params.errorMessage,
      };

      await db.dataOperations.add(entry);
      console.log('Export operation logged:', entry);
    } catch (error) {
      console.error('Error logging export operation:', error);
    }
  }

  /**
   * Get all operations, most recent first
   */
  async getAllOperations(): Promise<DataOperation[]> {
    try {
      return await db.dataOperations
        .orderBy('timestamp')
        .reverse()
        .toArray();
    } catch (error) {
      console.error('Error loading data operations:', error);
      return [];
    }
  }

  /**
   * Get recent operations (last N)
   */
  async getRecentOperations(limit: number = 10): Promise<DataOperation[]> {
    try {
      return await db.dataOperations
        .orderBy('timestamp')
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error loading recent operations:', error);
      return [];
    }
  }

  /**
   * Clear all operation logs
   */
  async clearAll(): Promise<void> {
    await db.dataOperations.clear();
  }
}

export const dataOperationLogger = new DataOperationLogger();
