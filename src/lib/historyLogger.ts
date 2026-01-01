import { db } from './db';
import type { HistoryEntry, HistoryActionType, Task, QuadrantType, FieldChange } from '../types/task';

class HistoryLogger {
  private pendingUndo: string | null = null;

  // Set correlation ID for next event (used by undo operations)
  setUndoCorrelation(id: string) {
    this.pendingUndo = id;
  }

  // Clear undo correlation
  clearUndoCorrelation() {
    this.pendingUndo = null;
  }

  // Log task added
  async logTaskAdded(task: Task): Promise<void> {
    try {
      // If this is an undo operation (re-adding a deleted task), restore the history instead
      if (this.pendingUndo) {
        console.log('Undo operation: restoring history for task', task.id);
        await this.unmarkTaskAsDeleted(task.id);

        // Remove the deletion event
        const deletionEvents = await db.history
          .where('taskId')
          .equals(task.id)
          .and(event => event.action === 'task_deleted')
          .toArray();

        for (const event of deletionEvents) {
          if (event.id) {
            await db.history.delete(event.id);
          }
        }

        this.clearUndoCorrelation();
        return;
      }

      const entry: Omit<HistoryEntry, 'id'> = {
        timestamp: new Date(),
        action: 'task_added',
        taskId: task.id,
        taskTitle: task.title,
        taskQuadrant: task.quadrant,
        undoCorrelationId: this.pendingUndo || undefined,
      };

      console.log('Adding history entry:', entry);
      const id = await db.history.add(entry);
      console.log('History entry added with id:', id);
      this.clearUndoCorrelation();
    } catch (error) {
      console.error('Error logging task added:', error);
    }
  }

  // Log task updated with detailed field changes
  async logTaskUpdated(
    taskId: string,
    taskTitle: string,
    quadrant: QuadrantType,
    oldTask: Task,
    newTask: Task
  ): Promise<void> {
    const changes: FieldChange[] = [];

    // Compare all relevant fields
    const fieldsToCheck: (keyof Task)[] = [
      'title',
      'description',
      'quadrant',
      'completed',
      'isStarred',
      'dueDate',
      'tags',
      'people',
      'isRecurring',
      'recurrence',
    ];

    fieldsToCheck.forEach((field) => {
      if (JSON.stringify(oldTask[field]) !== JSON.stringify(newTask[field])) {
        changes.push({
          field,
          oldValue: oldTask[field],
          newValue: newTask[field],
        });
      }
    });

    if (changes.length === 0) return; // No actual changes

    const entry: Omit<HistoryEntry, 'id'> = {
      timestamp: new Date(),
      action: 'task_updated',
      taskId,
      taskTitle,
      taskQuadrant: quadrant,
      changes,
      undoCorrelationId: this.pendingUndo || undefined,
    };

    await db.history.add(entry);
    this.clearUndoCorrelation();
  }

  // Log task deleted
  async logTaskDeleted(task: Task): Promise<void> {
    // If this is an undo operation, remove all history for this task instead of logging deletion
    if (this.pendingUndo) {
      console.log('Undo operation: removing all history for task', task.id);
      await this.removeAllEventsForTask(task.id);
      this.clearUndoCorrelation();
      return;
    }

    // Normal deletion: log the event and mark previous entries as deleted
    const entry: Omit<HistoryEntry, 'id'> = {
      timestamp: new Date(),
      action: 'task_deleted',
      taskId: task.id,
      taskTitle: task.title,
      taskQuadrant: task.quadrant,
      isDeleted: true,
      undoCorrelationId: this.pendingUndo || undefined,
    };

    await db.history.add(entry);

    // Mark all previous entries for this task as deleted
    await this.markTaskAsDeleted(task.id);
    this.clearUndoCorrelation();
  }

  // Mark existing entries as deleted
  private async markTaskAsDeleted(taskId: string): Promise<void> {
    const entries = await db.history.where('taskId').equals(taskId).toArray();

    for (const entry of entries) {
      if (entry.id) {
        await db.history.update(entry.id, { isDeleted: true });
      }
    }
  }

  // Unmark task as deleted (for undo)
  async unmarkTaskAsDeleted(taskId: string): Promise<void> {
    const entries = await db.history.where('taskId').equals(taskId).toArray();

    for (const entry of entries) {
      if (entry.id) {
        await db.history.update(entry.id, { isDeleted: false });
      }
    }
  }

  // Log task completion toggle
  async logTaskCompletionToggle(task: Task, completed: boolean): Promise<void> {
    const entry: Omit<HistoryEntry, 'id'> = {
      timestamp: new Date(),
      action: completed ? 'task_completed' : 'task_uncompleted',
      taskId: task.id,
      taskTitle: task.title,
      taskQuadrant: task.quadrant,
      undoCorrelationId: this.pendingUndo || undefined,
    };

    await db.history.add(entry);
    this.clearUndoCorrelation();
  }

  // Log task moved between quadrants
  async logTaskMoved(
    task: Task,
    fromQuadrant: QuadrantType,
    toQuadrant: QuadrantType
  ): Promise<void> {
    const entry: Omit<HistoryEntry, 'id'> = {
      timestamp: new Date(),
      action: 'task_moved',
      taskId: task.id,
      taskTitle: task.title,
      taskQuadrant: toQuadrant,
      fromQuadrant,
      toQuadrant,
      undoCorrelationId: this.pendingUndo || undefined,
    };

    await db.history.add(entry);
    this.clearUndoCorrelation();
  }

  // Log star toggle
  async logTaskStarToggle(task: Task, starred: boolean): Promise<void> {
    const entry: Omit<HistoryEntry, 'id'> = {
      timestamp: new Date(),
      action: starred ? 'task_starred' : 'task_unstarred',
      taskId: task.id,
      taskTitle: task.title,
      taskQuadrant: task.quadrant,
      undoCorrelationId: this.pendingUndo || undefined,
    };

    await db.history.add(entry);
    this.clearUndoCorrelation();
  }

  // Log subtask added
  async logSubtaskAdded(parentTask: Task, subtask: Task): Promise<void> {
    const entry: Omit<HistoryEntry, 'id'> = {
      timestamp: new Date(),
      action: 'subtask_added',
      taskId: subtask.id,
      taskTitle: `${parentTask.title} → ${subtask.title}`,
      taskQuadrant: parentTask.quadrant,
      undoCorrelationId: this.pendingUndo || undefined,
    };

    await db.history.add(entry);
    this.clearUndoCorrelation();
  }

  // Log subtask reparented
  async logSubtaskReparented(
    subtask: Task,
    oldParent: Task,
    newParent: Task
  ): Promise<void> {
    const entry: Omit<HistoryEntry, 'id'> = {
      timestamp: new Date(),
      action: 'subtask_reparented',
      taskId: subtask.id,
      taskTitle: subtask.title,
      taskQuadrant: newParent.quadrant,
      oldParentId: oldParent.id,
      oldParentTitle: oldParent.title,
      newParentId: newParent.id,
      newParentTitle: newParent.title,
      fromQuadrant: oldParent.quadrant !== newParent.quadrant ? oldParent.quadrant : undefined,
      toQuadrant: oldParent.quadrant !== newParent.quadrant ? newParent.quadrant : undefined,
      undoCorrelationId: this.pendingUndo || undefined,
    };

    await db.history.add(entry);
    this.clearUndoCorrelation();
  }

  // Log subtask detached
  async logSubtaskDetached(
    subtask: Task,
    oldParent: Task,
    newQuadrant: QuadrantType
  ): Promise<void> {
    const entry: Omit<HistoryEntry, 'id'> = {
      timestamp: new Date(),
      action: 'subtask_detached',
      taskId: subtask.id,
      taskTitle: subtask.title,
      taskQuadrant: newQuadrant,
      oldParentId: oldParent.id,
      oldParentTitle: oldParent.title,
      fromQuadrant: oldParent.quadrant !== newQuadrant ? oldParent.quadrant : undefined,
      toQuadrant: oldParent.quadrant !== newQuadrant ? newQuadrant : undefined,
      undoCorrelationId: this.pendingUndo || undefined,
    };

    await db.history.add(entry);
    this.clearUndoCorrelation();
  }

  // Remove undo events when user performs undo
  async removeUndoEvents(correlationId: string): Promise<void> {
    const entries = await db.history
      .where('undoCorrelationId')
      .equals(correlationId)
      .toArray();

    for (const entry of entries) {
      if (entry.id) {
        await db.history.delete(entry.id);
      }
    }
  }

  // Remove all events for a specific task (used when undoing task creation)
  async removeAllEventsForTask(taskId: string): Promise<void> {
    const entries = await db.history.where('taskId').equals(taskId).toArray();
    console.log(`Removing ${entries.length} history events for task ${taskId}`);

    for (const entry of entries) {
      if (entry.id) {
        await db.history.delete(entry.id);
      }
    }
  }

  // Remove events by specific action type (used for undo of specific operations)
  async removeEventsByAction(
    taskId: string,
    action: HistoryActionType,
    afterTimestamp?: Date
  ): Promise<void> {
    let query = db.history
      .where('taskId')
      .equals(taskId)
      .and((event) => event.action === action);

    if (afterTimestamp) {
      query = query.and((event) => event.timestamp > afterTimestamp);
    }

    const events = await query.toArray();
    console.log(`Removing ${events.length} "${action}" events for task ${taskId}`);

    for (const event of events) {
      if (event.id) {
        await db.history.delete(event.id);
      }
    }
  }

  // Log parent task auto-completion (triggered by subtasks)
  async logParentAutoCompleted(parentTask: Task, completedAt: Date): Promise<void> {
    const entry: Omit<HistoryEntry, 'id'> = {
      timestamp: new Date(),
      action: 'parent_auto_completed',
      taskId: parentTask.id,
      taskTitle: parentTask.title,
      taskQuadrant: parentTask.quadrant,
      changes: [{
        field: 'completed',
        oldValue: false,
        newValue: true
      }, {
        field: 'completedAt',
        oldValue: undefined,
        newValue: completedAt
      }],
      undoCorrelationId: this.pendingUndo || undefined,
    };

    await db.history.add(entry);
    this.clearUndoCorrelation();
  }

  // Log parent task auto-uncompleted (triggered by subtask changes)
  async logParentAutoUncompleted(parentTask: Task): Promise<void> {
    const entry: Omit<HistoryEntry, 'id'> = {
      timestamp: new Date(),
      action: 'parent_auto_uncompleted',
      taskId: parentTask.id,
      taskTitle: parentTask.title,
      taskQuadrant: parentTask.quadrant,
      changes: [{
        field: 'completed',
        oldValue: true,
        newValue: false
      }, {
        field: 'completedAt',
        oldValue: parentTask.completedAt,
        newValue: undefined
      }],
      undoCorrelationId: this.pendingUndo || undefined,
    };

    await db.history.add(entry);
    this.clearUndoCorrelation();
  }
}

export const historyLogger = new HistoryLogger();
