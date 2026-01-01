import type { Task, QuadrantType } from '../types/task';
import { calculateNextOccurrence } from './date';

/**
 * Statistics for a recurring parent template
 */
export interface TemplateStats {
  totalInstances: number;
  completedInstances: number;
  activeInstances: number;
  lastGeneratedDate: Date | null;
  nextScheduledDate: Date | null;
  completionRate: number; // 0-100
}

/**
 * Get statistics for a recurring parent template
 */
export function getTemplateStats(
  template: Task,
  allTasks: Task[]
): TemplateStats {
  const instances = allTasks.filter(t => t.parentTaskId === template.id);
  const completed = instances.filter(t => t.completed);
  const active = instances.filter(t => !t.completed);

  // Find most recent instance
  const sorted = [...instances].sort((a, b) =>
    b.createdAt.getTime() - a.createdAt.getTime()
  );
  const lastGenerated = sorted[0]?.createdAt || null;

  // Calculate next occurrence
  let nextScheduled: Date | null = null;
  if (template.recurrence) {
    if (lastGenerated) {
      nextScheduled = calculateNextOccurrence(lastGenerated, template.recurrence);
    } else if (template.dueDate) {
      nextScheduled = calculateNextOccurrence(template.dueDate, template.recurrence);
    }
  }

  return {
    totalInstances: instances.length,
    completedInstances: completed.length,
    activeInstances: active.length,
    lastGeneratedDate: lastGenerated,
    nextScheduledDate: nextScheduled,
    completionRate: instances.length > 0
      ? Math.round((completed.length / instances.length) * 100)
      : 0
  };
}

/**
 * Group templates by quadrant
 */
export function groupTemplatesByQuadrant(templates: Task[]): Record<QuadrantType, Task[]> {
  return templates.reduce((acc, template) => {
    if (!acc[template.quadrant]) {
      acc[template.quadrant] = [];
    }
    acc[template.quadrant].push(template);
    return acc;
  }, {} as Record<QuadrantType, Task[]>);
}
