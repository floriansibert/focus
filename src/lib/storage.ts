import { db } from './db';
import type { Task, Tag, Person } from '../types/task';

export interface AppData {
  tasks: Task[];
  tags: Tag[];
  people: Person[];
}

export class StorageManager {
  private syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Load all data from IndexedDB
   */
  async loadAll(): Promise<AppData> {
    try {
      console.log('Loading data from IndexedDB...');
      const [tasks, tags, people] = await Promise.all([
        db.tasks.toArray(),
        db.tags.toArray(),
        db.people.toArray(),
      ]);

      console.log('Loaded from DB:', { taskCount: tasks.length, tagCount: tags.length, peopleCount: people.length });
      return { tasks, tags, people };
    } catch (error) {
      console.error('Error loading from IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Debounced save to IndexedDB (300ms delay)
   */
  debouncedSync(data: AppData): void {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    this.syncDebounceTimer = setTimeout(() => {
      this.syncToDB(data);
    }, 300);
  }

  /**
   * Immediate save to IndexedDB
   */
  async syncToDB(data: AppData): Promise<void> {
    try {
      console.log('Syncing to IndexedDB:', { taskCount: data.tasks.length, tagCount: data.tags.length, peopleCount: data.people.length });
      await db.transaction('rw', db.tasks, db.tags, db.people, async () => {
        await db.tasks.clear();
        await db.tags.clear();
        await db.people.clear();
        await db.tasks.bulkPut(data.tasks);
        await db.tags.bulkPut(data.tags);
        await db.people.bulkPut(data.people);
      });
      console.log('Successfully synced to IndexedDB');
    } catch (error) {
      console.error('Error syncing to IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Export data to JSON blob
   */
  async exportToJSON(): Promise<Blob> {
    const data = await this.loadAll();
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Export data to CSV blob
   */
  async exportToCSV(): Promise<Blob> {
    const data = await this.loadAll();

    // CSV headers
    const headers = [
      'ID',
      'Title',
      'Description',
      'Quadrant',
      'Task Type',
      'Parent Task ID',
      'Completed',
      'Starred',
      'Created At',
      'Due Date',
      'Tags',
    ];

    // Convert tasks to CSV rows
    const rows = data.tasks.map((task) => [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      task.quadrant,
      task.taskType || 'standard',
      task.parentTaskId || '',
      task.completed ? 'Yes' : 'No',
      task.isStarred ? 'Yes' : 'No',
      task.createdAt.toISOString(),
      task.dueDate?.toISOString() || '',
      task.tags.join('; '),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    return new Blob([csv], { type: 'text/csv' });
  }

  /**
   * Import data from JSON file
   */
  async importFromJSON(file: File): Promise<AppData> {
    const text = await file.text();
    const data = JSON.parse(text) as AppData;

    // Validate the data structure
    if (!data.tasks || !Array.isArray(data.tasks)) {
      throw new Error('Invalid data format: missing tasks array');
    }

    if (!data.tags || !Array.isArray(data.tags)) {
      throw new Error('Invalid data format: missing tags array');
    }

    // Convert date strings back to Date objects
    data.tasks = data.tasks.map((task) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      recurrence: task.recurrence
        ? {
            ...task.recurrence,
            endDate: task.recurrence.endDate ? new Date(task.recurrence.endDate) : undefined,
            nextOccurrence: task.recurrence.nextOccurrence
              ? new Date(task.recurrence.nextOccurrence)
              : undefined,
          }
        : undefined,
    }));

    return data;
  }

  /**
   * Clear all data from IndexedDB
   */
  async clearAll(): Promise<void> {
    await db.transaction('rw', db.tasks, db.tags, db.people, db.history, async () => {
      await db.tasks.clear();
      await db.tags.clear();
      await db.people.clear();
      await db.history.clear();
    });
  }
}

export const storageManager = new StorageManager();
