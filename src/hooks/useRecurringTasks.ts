import { useEffect, useRef } from 'react';
import { useTaskStore } from '../store/taskStore';
import { shouldGenerateInstance, calculateNextOccurrence } from '../utils/date';
import { TaskType } from '../types/task';

/**
 * Hook to automatically generate recurring task instances
 * Checks every 60 seconds for tasks that need new instances
 */
export function useRecurringTasks() {
  const { tasks, addTask } = useTaskStore();
  const lastCheckRef = useRef<Date>(new Date());

  useEffect(() => {
    const checkRecurringTasks = () => {
      const now = new Date();

      // Find all recurring parent tasks
      const recurringTasks = tasks.filter(
        (task) => task.isRecurring && task.recurrence && !task.parentTaskId
      );

      for (const parentTask of recurringTasks) {
        if (!parentTask.recurrence) continue;

        // Find the most recent instance (child task)
        const instances = tasks
          .filter((t) => t.parentTaskId === parentTask.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const lastInstance = instances[0];

        // Determine the reference date for checking if we should generate
        // Use undefined if no last instance exists - this triggers immediate first instance creation
        const referenceDate = lastInstance?.createdAt;

        // Check if we should generate a new instance
        if (shouldGenerateInstance(referenceDate, parentTask.recurrence, now)) {
          // Calculate the due date for the new instance
          const newDueDate = lastInstance?.dueDate
            ? calculateNextOccurrence(lastInstance.dueDate, parentTask.recurrence)
            : parentTask.dueDate
            ? calculateNextOccurrence(parentTask.dueDate, parentTask.recurrence)
            : undefined;

          // Create new instance
          addTask({
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
  }, [tasks, addTask]);
}
