import { useEffect, useCallback, useRef } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useHistoryStore } from '../store/historyStore';
import { historyLogger } from '../lib/historyLogger';
import type { Task, HistoryActionType } from '../types/task';
import { db } from '../lib/db';

let isUndoRedoOperation = false;
let recordingTimeout: number | null = null;

// Helper: Detect what changed in a task
function detectTaskChanges(current: Task, previous: Task): HistoryActionType[] {
  const changes: HistoryActionType[] = [];

  // Check completion
  if (current.completed !== previous.completed) {
    changes.push(current.completed ? 'task_completed' : 'task_uncompleted');
  }

  // Check star
  if (current.isStarred !== previous.isStarred) {
    changes.push(current.isStarred ? 'task_starred' : 'task_unstarred');
  }

  // Check quadrant
  if (current.quadrant !== previous.quadrant) {
    changes.push('task_moved');
  }

  // Check other fields (= update)
  const fieldsToCheck: (keyof Task)[] = ['title', 'description', 'tags', 'people', 'dueDate', 'isRecurring', 'recurrence'];
  for (const field of fieldsToCheck) {
    if (JSON.stringify(current[field]) !== JSON.stringify(previous[field])) {
      changes.push('task_updated');
      break; // Only add once
    }
  }

  return changes;
}

export function useUndoRedo() {
  const { tasks, tags, setTasks, setTags } = useTaskStore();
  const { pushState, undo, redo, canUndo, canRedo } = useHistoryStore();
  const lastRecordedState = useRef<{ tasks: any[]; tags: any[] } | null>(null);
  const pendingState = useRef<{ tasks: any[]; tags: any[] } | null>(null);

  // Record state changes (but NOT during undo/redo operations)
  useEffect(() => {
    // Skip if this is an undo/redo operation
    if (isUndoRedoOperation) {
      lastRecordedState.current = { tasks, tags };
      pendingState.current = null;
      return;
    }

    // Check if this is the first time we're seeing state
    if (lastRecordedState.current === null) {
      lastRecordedState.current = { tasks, tags };
      return;
    }

    // Only record if state actually changed
    const stateChanged =
      JSON.stringify(lastRecordedState.current?.tasks) !== JSON.stringify(tasks) ||
      JSON.stringify(lastRecordedState.current?.tags) !== JSON.stringify(tags);

    if (!stateChanged) return;

    // Cancel any pending recording
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
    }

    // Store the previous state as pending
    pendingState.current = lastRecordedState.current;

    // Debounce the recording to group rapid changes
    recordingTimeout = setTimeout(() => {
      if (pendingState.current && !isUndoRedoOperation) {
        pushState(pendingState.current);
        pendingState.current = null;
      }
      recordingTimeout = null;
    }, 300);

    // Update the last recorded state to current
    lastRecordedState.current = { tasks, tags };
  }, [tasks, tags, pushState]);

  const handleUndo = useCallback(() => {
    // Flush any pending state recording first
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      if (pendingState.current) {
        pushState(pendingState.current);
        pendingState.current = null;
      }
      recordingTimeout = null;
    }

    if (!canUndo()) return;

    // Generate correlation ID and set it
    const correlationId = `undo-${Date.now()}`;
    historyLogger.setUndoCorrelation(correlationId);

    isUndoRedoOperation = true;
    const currentState = { tasks, tags };
    const previousState = undo(currentState);

    if (previousState) {
      // Detect tasks that were removed (exist in current but not in previous)
      const removedTasks = currentState.tasks.filter(
        (currentTask) => !previousState.tasks.find((prevTask) => prevTask.id === currentTask.id)
      );

      // Detect tasks that were added back (exist in previous but not in current)
      const addedBackTasks = previousState.tasks.filter(
        (prevTask) => !currentState.tasks.find((currentTask) => currentTask.id === prevTask.id)
      );

      // NEW: Detect changes in existing tasks
      const changedTasks: { task: Task; changes: HistoryActionType[] }[] = [];
      for (const currentTask of currentState.tasks) {
        const prevTask = previousState.tasks.find((t) => t.id === currentTask.id);
        if (prevTask) {
          const changes = detectTaskChanges(currentTask, prevTask);
          if (changes.length > 0) {
            changedTasks.push({ task: currentTask, changes });
          }
        }
      }

      setTasks(previousState.tasks);
      setTags(previousState.tags);

      // Clean up history for removed tasks, restore history for added-back tasks, and clean up changed fields
      setTimeout(async () => {
        // Remove all history for tasks that were removed during undo
        for (const task of removedTasks) {
          console.log('Undo: removing history for deleted task', task.id);
          await historyLogger.removeAllEventsForTask(task.id);
        }

        // Restore history for tasks that were added back during undo
        for (const task of addedBackTasks) {
          console.log('Undo: restoring history for re-added task', task.id);
          await historyLogger.unmarkTaskAsDeleted(task.id);

          // Remove the deletion event
          const deletionEvents = await db.history
            .where('taskId')
            .equals(task.id)
            .and((event) => event.action === 'task_deleted')
            .toArray();

          for (const event of deletionEvents) {
            if (event.id) {
              await db.history.delete(event.id);
            }
          }
        }

        // NEW: Remove history for changed fields
        for (const { task, changes } of changedTasks) {
          console.log('Undo: removing events for task', task.id, 'changes:', changes);
          for (const change of changes) {
            await historyLogger.removeEventsByAction(task.id, change);
          }
        }

        // Remove any events that were created during the undo
        historyLogger.removeUndoEvents(correlationId);
      }, 500);
    }

    // Reset flag after state updates complete
    setTimeout(() => {
      isUndoRedoOperation = false;
      historyLogger.clearUndoCorrelation();
    }, 100);
  }, [tasks, tags, undo, canUndo, setTasks, setTags, pushState]);

  const handleRedo = useCallback(() => {
    // Flush any pending state recording first
    if (recordingTimeout) {
      clearTimeout(recordingTimeout);
      if (pendingState.current) {
        pushState(pendingState.current);
        pendingState.current = null;
      }
      recordingTimeout = null;
    }

    if (!canRedo()) return;

    isUndoRedoOperation = true;
    const currentState = { tasks, tags };
    const nextState = redo(currentState);

    if (nextState) {
      setTasks(nextState.tasks);
      setTags(nextState.tags);
    }

    // Reset flag after state updates complete
    setTimeout(() => {
      isUndoRedoOperation = false;
    }, 100);
  }, [tasks, tags, redo, canRedo, setTasks, setTags, pushState]);

  return {
    undo: handleUndo,
    redo: handleRedo,
    canUndo: canUndo(),
    canRedo: canRedo(),
  };
}
