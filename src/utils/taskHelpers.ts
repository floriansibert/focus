import type { Task } from '../types/task';
import { TaskType } from '../types/task';

/**
 * Check if a task is a standard task (not recurring, not a subtask)
 */
export function isStandardTask(task: Task): boolean {
  return task.taskType === TaskType.STANDARD;
}

/**
 * Check if a task is a subtask
 */
export function isSubtask(task: Task): boolean {
  return task.taskType === TaskType.SUBTASK;
}

/**
 * Check if a task is a recurring parent
 */
export function isRecurringParent(task: Task): boolean {
  return task.taskType === TaskType.RECURRING_PARENT;
}

/**
 * Check if a task is a recurring instance (generated from a recurring parent)
 */
export function isRecurringInstance(task: Task): boolean {
  return task.taskType === TaskType.RECURRING_INSTANCE;
}

/**
 * Check if a task can have subtasks
 * Only standard tasks and recurring instances can have subtasks
 */
export function canHaveSubtasks(task: Task): boolean {
  return task.taskType === TaskType.STANDARD ||
         task.taskType === TaskType.RECURRING_INSTANCE;
}

/**
 * Check if a task has any subtasks
 */
export function hasSubtasks(task: Task, allTasks: Task[]): boolean {
  return allTasks.some(t =>
    t.parentTaskId === task.id &&
    t.taskType === TaskType.SUBTASK
  );
}

/**
 * Get the number of subtasks for a given task
 */
export function getSubtaskCount(task: Task, allTasks: Task[]): number {
  return allTasks.filter(t =>
    t.parentTaskId === task.id &&
    t.taskType === TaskType.SUBTASK
  ).length;
}

/**
 * Get all completed subtasks for a parent task
 */
export function getCompletedSubtasks(task: Task, allTasks: Task[]): Task[] {
  return allTasks.filter(t =>
    t.parentTaskId === task.id &&
    t.taskType === TaskType.SUBTASK &&
    t.completed === true
  );
}

/**
 * Check if all subtasks of a parent task are completed
 */
export function areAllSubtasksCompleted(task: Task, allTasks: Task[]): boolean {
  const subtasks = allTasks.filter(t =>
    t.parentTaskId === task.id &&
    t.taskType === TaskType.SUBTASK
  );

  if (subtasks.length === 0) return false;

  return subtasks.every(subtask => subtask.completed);
}

/**
 * Get the latest completion timestamp from all completed subtasks
 * Returns the most recent completedAt date, or undefined if no completed subtasks
 */
export function getLatestSubtaskCompletionDate(task: Task, allTasks: Task[]): Date | undefined {
  const completedSubtasks = getCompletedSubtasks(task, allTasks);

  if (completedSubtasks.length === 0) return undefined;

  // Filter out subtasks without completedAt and find the latest
  const dates = completedSubtasks
    .filter(st => st.completedAt)
    .map(st => new Date(st.completedAt!));

  if (dates.length === 0) return undefined;

  return new Date(Math.max(...dates.map(d => d.getTime())));
}
