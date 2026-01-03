import { useMemo } from 'react';
import type { Task, QuadrantType } from '../types/task';
import { TaskType, ViewMode } from '../types/task';
import { useUIStore } from '../store/uiStore';
import { useTaskStore } from '../store/taskStore';

/**
 * Hook to filter tasks based on current filter state
 */
export function useTaskFilters(tasks: Task[], quadrant?: QuadrantType): Task[] {
  const { searchQuery, selectedTags, selectedPeople, showCompleted, completedTasksCutoffDate, showCompletedOnly, completedDateRange, starredFilterByQuadrant, activeFilterMode, todayViewDaysAhead, todayViewComponents } = useUIStore();
  const allTags = useTaskStore((state) => state.tags);
  const allPeople = useTaskStore((state) => state.people);
  const showStarredOnly = quadrant ? starredFilterByQuadrant[quadrant] : false;

  return useMemo(() => {
    // PHASE 1: Apply filters to get direct matches
    const directMatches = new Set<string>();

    let candidateTasks = tasks;

    // Filter by completion status with date awareness
    // Only apply cutoff date filter if date range filter is not active
    if (!showCompleted) {
      // Hide ALL completed tasks (checkbox unchecked)
      candidateTasks = candidateTasks.filter((task) => !task.completed);
    } else if (completedTasksCutoffDate && !showCompletedOnly) {
      // Show only completed tasks completed on or after cutoff date
      // (but only if the date range filter is not active)
      candidateTasks = candidateTasks.filter((task) => {
        if (!task.completed) return true; // Always show incomplete tasks

        // For completed tasks, check completion date
        if (!task.completedAt) return false; // Hide completed tasks without completion date

        const completedDate = new Date(task.completedAt);
        const cutoffDate = new Date(completedTasksCutoffDate);
        cutoffDate.setHours(0, 0, 0, 0); // Start of day for comparison

        return completedDate >= cutoffDate;
      });
    }
    // If showCompleted is true and completedTasksCutoffDate is null, show all tasks (no filtering)

    // Evaluate each task against date range, search, tag, and star filters
    candidateTasks.forEach((task) => {
      let matches = true;

      // PHASE 1B: Date range filter (when active, only match completed tasks in range)
      // Note: We don't filter candidateTasks here to allow parent-child relationship logic to work
      if (showCompletedOnly && completedDateRange) {
        // For date range filter, only completed tasks in range match directly
        if (!task.completed || !task.completedAt) {
          matches = false;
        } else {
          const completedDate = new Date(task.completedAt);
          const startDate = new Date(completedDateRange.start);
          const endDate = new Date(completedDateRange.end);

          // Normalize dates to start/end of day for comparison
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);

          matches = matches && (completedDate >= startDate && completedDate <= endDate);
        }
      }

      // Today's view filter (3-component OR logic)
      if (activeFilterMode === ViewMode.TODAY) {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        const futureDate = new Date(now);
        if (todayViewDaysAhead === null) {
          // Infinity - set to far future date (year 9999)
          futureDate.setFullYear(9999, 11, 31);
          futureDate.setHours(23, 59, 59, 999);
        } else {
          futureDate.setDate(futureDate.getDate() + todayViewDaysAhead);
          futureDate.setHours(23, 59, 59, 999); // End of future day
        }

        let matchesTodayView = false;

        // Component 1: Overdue tasks
        if (todayViewComponents.showOverdue && task.dueDate) {
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          if (dueDate < now) {
            matchesTodayView = true;
          }
        }

        // Component 2: Due soon (today or within N days)
        if (todayViewComponents.showDueSoon && task.dueDate) {
          const dueDate = new Date(task.dueDate);
          if (dueDate >= now && dueDate <= futureDate) {
            matchesTodayView = true;
          }
        }

        // Component 3: ALL starred tasks
        if (todayViewComponents.showStarred && task.isStarred) {
          matchesTodayView = true;
        }

        matches = matches && matchesTodayView;
      }

      // Completed view filter
      if (activeFilterMode === ViewMode.COMPLETED && completedDateRange) {
        // For completed mode, ONLY completed tasks in range match directly
        // Subtask handling will be done in Phase 2
        if (!task.completed || !task.completedAt) {
          matches = false;
        } else {
          const completedDate = new Date(task.completedAt);
          const startDate = new Date(completedDateRange.start);
          const endDate = new Date(completedDateRange.end);

          // Normalize dates to start/end of day for comparison
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);

          matches = matches && (completedDate >= startDate && completedDate <= endDate);
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = task.title.toLowerCase().includes(query);
        const descriptionMatch = task.description?.toLowerCase().includes(query);
        const tagMatch = task.tags.some((tagId) => {
          const tag = allTags.find((t) => t.id === tagId);
          return tag?.name.toLowerCase().includes(query);
        });
        const personMatch = task.people?.some((personId) => {
          const person = allPeople.find((p) => p.id === personId);
          return person?.name.toLowerCase().includes(query);
        });

        matches = matches && (titleMatch || descriptionMatch || tagMatch || personMatch);
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasSelectedTag = task.tags.some((tagId) => selectedTags.includes(tagId));
        matches = matches && hasSelectedTag;
      }

      // People filter
      if (selectedPeople.length > 0) {
        const hasSelectedPerson = task.people?.some((personId) => selectedPeople.includes(personId));
        matches = matches && hasSelectedPerson;
      }

      // Star filter
      if (showStarredOnly) {
        matches = matches && (task.isStarred ?? false);
      }

      if (matches) {
        directMatches.add(task.id);
      }
    });

    // PHASE 2: Include subtasks when parent matches
    candidateTasks.forEach((task) => {
      if (task.taskType === TaskType.SUBTASK && task.parentTaskId) {
        if (directMatches.has(task.parentTaskId)) {
          // In Completed mode, only include subtasks completed within the date range
          if (activeFilterMode === ViewMode.COMPLETED && completedDateRange) {
            if (task.completed && task.completedAt) {
              const completedDate = new Date(task.completedAt);
              const startDate = new Date(completedDateRange.start);
              const endDate = new Date(completedDateRange.end);

              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(23, 59, 59, 999);

              if (completedDate >= startDate && completedDate <= endDate) {
                directMatches.add(task.id);
              }
            }
          } else {
            // For other modes, include ALL subtasks when parent matches
            directMatches.add(task.id);
          }
        }
      }
    });

    // PHASE 3: Include parent when ANY subtask matches
    candidateTasks.forEach((task) => {
      if (task.taskType === TaskType.SUBTASK && task.parentTaskId) {
        // If subtask is in direct matches, include its parent
        if (directMatches.has(task.id)) {
          directMatches.add(task.parentTaskId);
        }
      }
    });

    // PHASE 4: Re-expand with ALL subtasks of newly added parents
    // Skip this phase for Completed mode - we've already carefully filtered subtasks
    // Also skip when date range filter is active
    if (activeFilterMode !== ViewMode.COMPLETED && (!showCompletedOnly || !completedDateRange)) {
      candidateTasks.forEach((task) => {
        if (task.taskType === TaskType.SUBTASK && task.parentTaskId) {
          if (directMatches.has(task.parentTaskId)) {
            directMatches.add(task.id);
          }
        }
      });
    }

    // Return tasks that are in the final match set
    // Also filter out recurring parent templates (they should never be visible)
    return candidateTasks
      .filter((task) => directMatches.has(task.id))
      .filter((task) => task.taskType !== TaskType.RECURRING_PARENT);
  }, [tasks, searchQuery, selectedTags, selectedPeople, showCompleted, completedTasksCutoffDate, showCompletedOnly, completedDateRange, showStarredOnly, allTags, allPeople, activeFilterMode, todayViewDaysAhead, todayViewComponents]);
}
