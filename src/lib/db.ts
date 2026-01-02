import Dexie, { type Table } from 'dexie';
import type { Task, Tag, Person, HistoryEntry, DataOperation } from '../types/task';
import { TaskType } from '../types/task';

export class FocusDatabase extends Dexie {
  tasks!: Table<Task, string>;
  tags!: Table<Tag, string>;
  people!: Table<Person, string>;
  history!: Table<HistoryEntry, number>;
  dataOperations!: Table<DataOperation, number>;

  constructor() {
    super('FocusDB');

    // Log database opening
    this.on('ready', () => {
      console.log('IndexedDB ready, version:', this.verno);
    });

    this.on('versionchange', (event) => {
      console.log('Database version changing from', event.oldVersion, 'to', event.newVersion);
    });

    this.version(1).stores({
      tasks: 'id, quadrant, completed, createdAt, dueDate, *tags, parentTaskId',
      tags: 'id, name',
      timeEntries: 'id, taskId, startTime',
      history: '++timestamp, action',
    });

    this.version(2).stores({
      tasks: 'id, quadrant, completed, createdAt, dueDate, *tags, parentTaskId',
      tags: 'id, name',
      // timeEntries removed
      history: '++timestamp, action',
    });

    this.version(3).stores({
      tasks: 'id, quadrant, completed, createdAt, dueDate, *tags, parentTaskId, taskType',
      tags: 'id, name',
      history: '++timestamp, action',
    }).upgrade(tx => {
      // Migration logic: set taskType for existing tasks
      return tx.table('tasks').toCollection().modify((task: Record<string, unknown>) => {
        if (!task.taskType) {
          // Determine task type based on existing fields
          if (task.isRecurring && !task.parentTaskId) {
            task.taskType = TaskType.RECURRING_PARENT;
          } else if (task.parentTaskId) {
            // Assume recurring instance (subtasks don't exist yet in old data)
            task.taskType = TaskType.RECURRING_INSTANCE;
          } else {
            task.taskType = TaskType.STANDARD;
          }
        }
      });
    });

    this.version(4).stores({
      tasks: 'id, quadrant, completed, createdAt, dueDate, *tags, parentTaskId, taskType, isStarred',
      tags: 'id, name',
      history: '++timestamp, action',
    }).upgrade(tx => {
      // Set isStarred = false for all existing tasks
      return tx.table('tasks').toCollection().modify((task: Record<string, unknown>) => {
        if (task.isStarred === undefined) {
          task.isStarred = false;
        }
      });
    });

    this.version(5).stores({
      tasks: 'id, quadrant, completed, createdAt, dueDate, *tags, parentTaskId, taskType, isStarred',
      tags: 'id, name',
      history: null,  // Drop history table (incompatible primary key change)
    });

    this.version(6).stores({
      tasks: 'id, quadrant, completed, createdAt, dueDate, *tags, parentTaskId, taskType, isStarred',
      tags: 'id, name',
      history: '++id, timestamp, action, taskId',  // Recreate with new schema
    });

    this.version(7).stores({
      tasks: 'id, quadrant, completed, createdAt, dueDate, *tags, parentTaskId, taskType, isStarred',
      tags: 'id, name',
      history: '++id, timestamp, action, taskId',
    }).upgrade(tx => {
      // Fix taskType for existing recurring tasks
      // Some tasks may have been created with wrong taskType (STANDARD instead of RECURRING_PARENT)
      return tx.table('tasks').toCollection().modify((task: Record<string, unknown>) => {
        // If task is recurring and has no parent, it should be RECURRING_PARENT
        if (task.isRecurring && !task.parentTaskId && task.taskType !== TaskType.RECURRING_PARENT) {
          console.log('Fixing recurring parent task:', task.id, task.title);
          task.taskType = TaskType.RECURRING_PARENT;
        }
        // If task has a parent and is not a subtask, it should be RECURRING_INSTANCE
        else if (task.parentTaskId && !task.isRecurring && task.taskType !== TaskType.SUBTASK && task.taskType !== TaskType.RECURRING_INSTANCE) {
          console.log('Fixing recurring instance task:', task.id, task.title);
          task.taskType = TaskType.RECURRING_INSTANCE;
        }
      });
    });

    this.version(8).stores({
      tasks: 'id, quadrant, completed, createdAt, dueDate, *tags, *people, parentTaskId, taskType, isStarred',
      tags: 'id, name',
      people: 'id, name',
      history: '++id, timestamp, action, taskId',
    }).upgrade(tx => {
      // Initialize people field for existing tasks
      return tx.table('tasks').toCollection().modify((task: Record<string, unknown>) => {
        if (!task.people) {
          task.people = [];
        }
      });
    });

    this.version(9).stores({
      tasks: 'id, quadrant, completed, createdAt, dueDate, *tags, *people, parentTaskId, taskType, isStarred',
      tags: 'id, name',
      people: 'id, name',
      history: '++id, timestamp, action, taskId',
      dataOperations: '++id, timestamp, operationType',
    });
  }
}

export const db = new FocusDatabase();
