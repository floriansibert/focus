const QuadrantTypeValues = {
  URGENT_IMPORTANT: 'urgent-important',           // Do First
  NOT_URGENT_IMPORTANT: 'not-urgent-important',   // Schedule
  URGENT_NOT_IMPORTANT: 'urgent-not-important',   // Delegate
  NOT_URGENT_NOT_IMPORTANT: 'not-urgent-not-important' // Eliminate
} as const;

export const QuadrantType = QuadrantTypeValues;
export type QuadrantType = (typeof QuadrantTypeValues)[keyof typeof QuadrantTypeValues];

const RecurrencePatternValues = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom'
} as const;

export const RecurrencePattern = RecurrencePatternValues;
export type RecurrencePattern = (typeof RecurrencePatternValues)[keyof typeof RecurrencePatternValues];

const TaskTypeValues = {
  STANDARD: 'standard',
  RECURRING_PARENT: 'recurring-parent',
  RECURRING_INSTANCE: 'recurring-instance',
  SUBTASK: 'subtask'
} as const;

export const TaskType = TaskTypeValues;
export type TaskType = (typeof TaskTypeValues)[keyof typeof TaskTypeValues];

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Person {
  id: string;
  name: string;
  color: string;
}

export interface RecurrenceConfig {
  pattern: RecurrencePattern;
  interval: number; // e.g., every 2 days
  daysOfWeek?: number[]; // 0-6, for weekly
  dayOfMonth?: number; // 1-31, for monthly
  endDate?: Date;
  nextOccurrence?: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant: QuadrantType;
  taskType: TaskType;

  // Status
  completed: boolean;
  completedAt?: Date;
  isStarred?: boolean;

  // Scheduling
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;

  // Organization
  tags: string[]; // Tag IDs
  people: string[]; // Person IDs

  // Recurring
  isRecurring: boolean;
  recurrence?: RecurrenceConfig;
  parentTaskId?: string; // For recurring task instances

  // Metadata
  order: number; // Position within quadrant
}

export interface FilterState {
  searchQuery: string;
  selectedTags: string[];
  selectedPeople: string[];
  showCompleted: boolean;
  dateRange?: { start: Date; end: Date };
}

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  activeView: 'matrix' | 'analytics' | 'history';
  commandPaletteOpen: boolean;
}

// History action types
const HistoryActionTypeValues = {
  TASK_ADDED: 'task_added',
  TASK_UPDATED: 'task_updated',
  TASK_DELETED: 'task_deleted',
  TASK_COMPLETED: 'task_completed',
  TASK_UNCOMPLETED: 'task_uncompleted',
  TASK_MOVED: 'task_moved',
  TASK_STARRED: 'task_starred',
  TASK_UNSTARRED: 'task_unstarred',
  SUBTASK_ADDED: 'subtask_added',
  SUBTASK_REPARENTED: 'subtask_reparented',
  SUBTASK_DETACHED: 'subtask_detached',
  PARENT_AUTO_COMPLETED: 'parent_auto_completed',
  PARENT_AUTO_UNCOMPLETED: 'parent_auto_uncompleted',
} as const;

export const HistoryActionType = HistoryActionTypeValues;
export type HistoryActionType = (typeof HistoryActionTypeValues)[keyof typeof HistoryActionTypeValues];

// Field change tracking for updates
export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

// Comprehensive history entry
export interface HistoryEntry {
  id?: number;  // Auto-increment from DB
  timestamp: Date;
  action: HistoryActionType;

  // Task reference (preserved even if deleted)
  taskId: string;
  taskTitle: string;  // Snapshot at time of event
  taskQuadrant: QuadrantType;  // Snapshot at time of event

  // For updates: detailed field changes
  changes?: FieldChange[];

  // For moves: track quadrant change
  fromQuadrant?: QuadrantType;
  toQuadrant?: QuadrantType;

  // For subtask reparenting: track parent change
  oldParentId?: string;
  oldParentTitle?: string;
  newParentId?: string;
  newParentTitle?: string;

  // Metadata
  undoCorrelationId?: string;  // To track undo operations
  isDeleted?: boolean;  // Mark if task has been deleted
}

// Filter state for history view
export interface HistoryFilterState {
  searchQuery: string;
  actionTypes: HistoryActionType[];
  dateRange: 'today' | '7days' | '30days' | 'all';
}

// Data operation types for import/export tracking
export type DataOperationType = 'import' | 'export';
export type DataOperationFormat = 'json' | 'csv';
export type ImportMode = 'merge' | 'replace';

export interface DataOperation {
  id?: number;                        // Auto-increment
  timestamp: Date;                    // When operation occurred
  operationType: DataOperationType;   // 'import' | 'export'
  format: DataOperationFormat;        // 'json' | 'csv'

  // Metadata
  filename: string;                   // e.g., "focus-backup-2025-12-28.json"
  fileSizeBytes: number;              // Size in bytes

  // Counts
  taskCount: number;
  tagCount: number;
  peopleCount: number;

  // Import-specific
  importMode?: ImportMode;            // 'merge' | 'replace'

  // Status
  success: boolean;                   // Did operation complete?
  errorMessage?: string;              // If failed, why?
}
