import { useEffect, useRef } from 'react';
import { useTaskStore } from '../store/taskStore';
import { shouldGenerateInstance, calculateNextOccurrence } from '../utils/date';
import { TaskType } from '../types/task';

/**
 * Hook to automatically generate recurring task instances
 * Checks every 60 seconds for tasks that need new instances
 */
export function useRecurringTasks() {
  const { tasks, addTask, addSubtask } = useTaskStore();
  const lastCheckRef = useRef<Date>(new Date());

  useEffect(() => {
    const checkRecurringTasks = () => {
      const now = new Date();

      // Find all recurring parent tasks (skip paused templates)
      const recurringTasks = tasks.filter(
        (task) => task.isRecurring && task.recurrence && !task.parentTaskId && !task.isPaused
      );

      for (const parentTask of recurringTasks) {
        if (!parentTask.recurrence) continue;

        // Find the most recent instance (child task)
        // Only count RECURRING_INSTANCE tasks, not SUBTASK tasks
        const instances = tasks
          .filter((t) => t.parentTaskId === parentTask.id && t.taskType === TaskType.RECURRING_INSTANCE)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const lastInstance = instances[0];
        const totalInstancesGenerated = instances.length;

        // Determine the reference date for checking if we should generate
        // Use undefined if no last instance exists - this triggers immediate first instance creation
        const referenceDate = lastInstance?.createdAt;

        // Check if we should generate a new instance (pass total count for occurrence limit checking)
        if (shouldGenerateInstance(referenceDate, parentTask.recurrence, now, totalInstancesGenerated)) {
          // Calculate the due date for the new instance
          const newDueDate = lastInstance?.dueDate
            ? calculateNextOccurrence(lastInstance.dueDate, parentTask.recurrence)
            : parentTask.dueDate
            ? calculateNextOccurrence(parentTask.dueDate, parentTask.recurrence)
            : undefined;

          // Create new instance
          const newInstanceId = addTask({
            title: parentTask.title,
            description: parentTask.description,
            quadrant: parentTask.quadrant,
            taskType: TaskType.RECURRING_INSTANCE,
            dueDate: newDueDate,
            completed: false,
            isRecurring: false, // Instances are not recurring themselves
            recurrence: undefined,
            tags: parentTask.tags,
            people: parentTask.people,
            isStarred: parentTask.isStarred,
            parentTaskId: parentTask.id,
            order: 0,
          });

          // Copy template's subtasks to the new instance
          const templateSubtasks = tasks
            .filter((t) => t.parentTaskId === parentTask.id && t.taskType === TaskType.SUBTASK)
            .sort((a, b) => a.order - b.order);

          for (const templateSubtask of templateSubtasks) {
            addSubtask(newInstanceId, {
              title: templateSubtask.title,
              description: templateSubtask.description,
              completed: false, // Always start uncompleted
              completedAt: undefined,
              isRecurring: false,
              tags: [...templateSubtask.tags], // Copy array
              people: [...templateSubtask.people], // Copy array
              order: templateSubtask.order,
              isStarred: templateSubtask.isStarred,
              dueDate: templateSubtask.dueDate,
            });
          }

          console.log(`Generated new instance for recurring task: ${parentTask.title}`);
        }
      }

      lastCheckRef.current = now;
    };

    // Check immediately on mount
    checkRecurringTasks();

    // Then check every 60 seconds
    const interval = setInterval(checkRecurringTasks, 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks, addTask, addSubtask]);
}
