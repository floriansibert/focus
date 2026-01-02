import { create } from 'zustand';
import type { Task, Tag, Person, QuadrantType } from '../types/task';
import { TaskType } from '../types/task';
import { storageManager } from '../lib/storage';
import { canHaveSubtasks, areAllSubtasksCompleted, getLatestSubtaskCompletionDate, hasSubtasks, isSubtask } from '../utils/taskHelpers';
import { historyLogger } from '../lib/historyLogger';
import { db } from '../lib/db';

interface TaskStore {
  // State
  tasks: Task[];
  tags: Tag[];
  people: Person[];
  isLoading: boolean;

  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, toQuadrant: QuadrantType, newOrder: number) => void;
  toggleComplete: (id: string) => void;
  toggleStar: (id: string) => void;
  toggleTemplatePause: (id: string) => void;

  // Subtask management
  addSubtask: (parentTaskId: string, subtaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'quadrant' | 'taskType' | 'parentTaskId'>) => string;
  getSubtasks: (parentTaskId: string) => Task[];
  deleteTaskWithSubtasks: (id: string) => { hasSubtasks: boolean; subtaskCount: number };
  moveTaskWithSubtasks: (id: string, toQuadrant: QuadrantType, newOrder: number) => void;
  reorderSubtasks: (parentTaskId: string, subtaskIds: string[]) => void;
  moveSubtaskToParent: (subtaskId: string, newParentId: string) => void;
  detachSubtask: (subtaskId: string) => void;

  // Tag management
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;

  // People management
  addPerson: (person: Omit<Person, 'id'>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;

  // Bulk deletion
  deleteAllTasks: () => void;
  deleteAllTags: () => void;
  deleteAllPeople: () => void;

  // Undo/Redo support
  setTasks: (tasks: Task[]) => void;
  setTags: (tags: Tag[]) => void;
  setPeople: (people: Person[]) => void;

  // Persistence
  loadFromDB: () => Promise<void>;
  syncToDB: () => void;

  // Parent completion auto-update
  updateParentCompletionStatus: (parentTaskId: string) => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useTaskStore = create<TaskStore>((set, get) => ({
  // Initial state
  tasks: [],
  tags: [],
  people: [],
  isLoading: false,

  // Add new task
  addTask: (taskData) => {
    // Automatically determine the correct taskType based on task properties
    let taskType = taskData.taskType || TaskType.STANDARD;

    // If the task is recurring and has no parent, it's a recurring parent
    if (taskData.isRecurring && !taskData.parentTaskId) {
      taskType = TaskType.RECURRING_PARENT;
    }
    // If the task has a parent and taskType is SUBTASK, keep it as subtask
    else if (taskData.parentTaskId && taskData.taskType === TaskType.SUBTASK) {
      taskType = TaskType.SUBTASK;
    }
    // If the task has a parent but is not a subtask, it's a recurring instance
    else if (taskData.parentTaskId && !taskData.isRecurring) {
      taskType = TaskType.RECURRING_INSTANCE;
    }

    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: taskData.tags || [],
      people: taskData.people || [],
      taskType,
      isStarred: taskData.isStarred ?? false,
      order: get().tasks.filter((t) => t.quadrant === taskData.quadrant).length,
    };

    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));

    // Log event
    historyLogger.logTaskAdded(newTask);

    get().syncToDB();

    return newTask.id;
  },

    // Update task
    updateTask: (id, updates) => {
      // Capture before state
      const oldTask = get().tasks.find((t) => t.id === id);
      if (!oldTask) return;

      // Create the updated task with proper taskType handling
      const updatedTaskData = { ...oldTask, ...updates, updatedAt: new Date() };

      // Automatically adjust taskType based on task properties
      // If changing isRecurring status, update taskType accordingly
      if ('isRecurring' in updates || 'parentTaskId' in updates) {
        if (updatedTaskData.isRecurring && !updatedTaskData.parentTaskId) {
          updatedTaskData.taskType = TaskType.RECURRING_PARENT;
        } else if (!updatedTaskData.isRecurring && !updatedTaskData.parentTaskId && updatedTaskData.taskType === TaskType.RECURRING_PARENT) {
          updatedTaskData.taskType = TaskType.STANDARD;
        }
      }

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? updatedTaskData : t
        ),
      }));

      // Get updated task and log event
      const newTask = get().tasks.find((t) => t.id === id);
      if (newTask) {
        historyLogger.logTaskUpdated(
          id,
          newTask.title,
          newTask.quadrant,
          oldTask,
          newTask
        );
      }

      get().syncToDB();

      // If subtask completion status or completion date changed, update parent
      const updatedTask = get().tasks.find((t) => t.id === id);
      if (updatedTask &&
          updatedTask.taskType === TaskType.SUBTASK &&
          updatedTask.parentTaskId &&
          ('completed' in updates || 'completedAt' in updates)) {
        get().updateParentCompletionStatus(updatedTask.parentTaskId);
      }
    },

    // Delete task (and its subtasks if any)
    deleteTask: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;

      // Track parent ID before deletion (for subtasks)
      const parentIdForUpdate = task.taskType === TaskType.SUBTASK ? task.parentTaskId : undefined;

      // Find all subtasks that belong to this task
      const subtasks = get().tasks.filter(
        (t) => t.parentTaskId === id && t.taskType === TaskType.SUBTASK
      );

      // Delete the main task and all its subtasks
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id && t.parentTaskId !== id),
      }));

      // Log deletion for main task
      historyLogger.logTaskDeleted(task);

      // Log deletion for each subtask
      for (const subtask of subtasks) {
        historyLogger.logTaskDeleted(subtask);
      }

      get().syncToDB();

      // If we deleted a subtask, update parent completion status
      if (parentIdForUpdate) {
        get().updateParentCompletionStatus(parentIdForUpdate);
      }
    },

    // Move task to different quadrant
    moveTask: (id, toQuadrant, newOrder) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;

      const fromQuadrant = task.quadrant;

      set((state) => {
        const updatedTasks = state.tasks.map((t) => {
          if (t.id === id) {
            return { ...t, quadrant: toQuadrant, order: newOrder, updatedAt: new Date() };
          }
          // Reorder other tasks in the target quadrant
          if (t.quadrant === toQuadrant) {
            return { ...t, order: t.order };
          }
          return t;
        });

        return { tasks: updatedTasks };
      });

      // Log event only if quadrant actually changed
      if (fromQuadrant !== toQuadrant) {
        const updatedTask = get().tasks.find((t) => t.id === id);
        if (updatedTask) {
          historyLogger.logTaskMoved(updatedTask, fromQuadrant, toQuadrant);
        }
      }

      get().syncToDB();
    },

    // Toggle task completion
    toggleComplete: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;

      // Block manual toggle for parent tasks with subtasks
      const allTasks = get().tasks;
      if (canHaveSubtasks(task) && hasSubtasks(task, allTasks)) {
        console.warn('Cannot manually toggle completion for parent tasks with subtasks. Completion is automatically managed based on subtask status.');
        return;
      }

      const willBeCompleted = !task.completed;

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                completed: willBeCompleted,
                completedAt: willBeCompleted ? new Date() : undefined,
                updatedAt: new Date(),
              }
            : t
        ),
      }));

      // Log event
      const updatedTask = get().tasks.find((t) => t.id === id);
      if (updatedTask) {
        historyLogger.logTaskCompletionToggle(updatedTask, willBeCompleted);
      }

      get().syncToDB();

      // If this is a subtask, update parent completion status
      if (task.taskType === TaskType.SUBTASK && task.parentTaskId) {
        get().updateParentCompletionStatus(task.parentTaskId);
      }
    },

    // Toggle task star
    toggleStar: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;

      const willBeStarred = !task.isStarred;

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                isStarred: willBeStarred,
                updatedAt: new Date(),
              }
            : t
        ),
      }));

      // Log event
      const updatedTask = get().tasks.find((t) => t.id === id);
      if (updatedTask) {
        historyLogger.logTaskStarToggle(updatedTask, willBeStarred);
      }

      get().syncToDB();
    },

    // Toggle template pause
    toggleTemplatePause: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;

      // Only allow pausing recurring parent templates
      if (task.taskType !== TaskType.RECURRING_PARENT) {
        return;
      }

      const willBePaused = !task.isPaused;

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                isPaused: willBePaused,
                updatedAt: new Date(),
              }
            : t
        ),
      }));

      get().syncToDB();
    },

    // Add tag
    addTag: (tagData) => {
      const newTag: Tag = {
        ...tagData,
        id: generateId(),
      };

      set((state) => ({
        tags: [...state.tags, newTag],
      }));

      get().syncToDB();
    },

    // Update tag
    updateTag: (id, updates) => {
      set((state) => ({
        tags: state.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));

      get().syncToDB();
    },

    // Delete tag
    deleteTag: (id) => {
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
        tasks: state.tasks.map((task) => ({
          ...task,
          tags: task.tags.filter((tagId) => tagId !== id),
        })),
      }));

      get().syncToDB();
    },

    // Add person
    addPerson: (personData) => {
      const newPerson: Person = {
        ...personData,
        id: generateId(),
      };

      set((state) => ({
        people: [...state.people, newPerson],
      }));

      get().syncToDB();
    },

    // Update person
    updatePerson: (id, updates) => {
      set((state) => ({
        people: state.people.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }));

      get().syncToDB();
    },

    // Delete person (cascade remove from all tasks)
    deletePerson: (id) => {
      set((state) => ({
        people: state.people.filter((p) => p.id !== id),
        tasks: state.tasks.map((task) => ({
          ...task,
          people: task.people?.filter((personId) => personId !== id) || [],
        })),
      }));

      get().syncToDB();
    },

    // Delete all tasks
    deleteAllTasks: () => {
      set({ tasks: [] });

      // Also clear history since it references tasks
      db.history.clear();

      get().syncToDB();
    },

    // Delete all tags
    deleteAllTags: () => {
      set((state) => ({
        tags: [],
        // Remove tag associations from all tasks
        tasks: state.tasks.map((task) => ({ ...task, tags: [] })),
      }));

      get().syncToDB();
    },

    // Delete all people
    deleteAllPeople: () => {
      set((state) => ({
        people: [],
        // Remove people associations from all tasks
        tasks: state.tasks.map((task) => ({ ...task, people: [] })),
      }));

      get().syncToDB();
    },

    // Add subtask to a parent task
    addSubtask: (parentTaskId, subtaskData) => {
      const parent = get().tasks.find((t) => t.id === parentTaskId);
      if (!parent || !canHaveSubtasks(parent)) {
        throw new Error('Invalid parent task or parent cannot have subtasks');
      }

      const newSubtask: Task = {
        ...subtaskData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        quadrant: parent.quadrant, // Inherit from parent
        taskType: TaskType.SUBTASK,
        parentTaskId: parentTaskId,
        tags: subtaskData.tags || [],
        people: subtaskData.people || [],
        isStarred: subtaskData.isStarred ?? false,
        order: get().tasks.filter(
          (t) => t.parentTaskId === parentTaskId && t.taskType === TaskType.SUBTASK
        ).length,
      };

      set((state) => ({
        tasks: [...state.tasks, newSubtask],
      }));

      // Log event
      historyLogger.logSubtaskAdded(parent, newSubtask);

      get().syncToDB();

      // Update parent completion status (may revert to incomplete if new subtask is incomplete)
      get().updateParentCompletionStatus(parentTaskId);

      return newSubtask.id;
    },

    // Get all subtasks for a parent task
    // For RECURRING_PARENT tasks, this returns RECURRING_INSTANCE children
    // For other tasks, this returns SUBTASK children
    getSubtasks: (parentTaskId) => {
      const parentTask = get().tasks.find((t) => t.id === parentTaskId);

      if (!parentTask) {
        return [];
      }

      // If parent is a recurring template, return instances
      if (parentTask.taskType === TaskType.RECURRING_PARENT) {
        return get().tasks.filter(
          (t) => t.parentTaskId === parentTaskId && t.taskType === TaskType.RECURRING_INSTANCE
        ).sort((a, b) => a.order - b.order);
      }

      // Otherwise, return subtasks
      return get().tasks.filter(
        (t) => t.parentTaskId === parentTaskId && t.taskType === TaskType.SUBTASK
      ).sort((a, b) => a.order - b.order);
    },

    // Delete task with subtask validation
    deleteTaskWithSubtasks: (id) => {
      const subtasks = get().tasks.filter(
        (t) => t.parentTaskId === id && t.taskType === TaskType.SUBTASK
      );

      if (subtasks.length > 0) {
        return { hasSubtasks: true, subtaskCount: subtasks.length };
      }

      get().deleteTask(id);
      return { hasSubtasks: false, subtaskCount: 0 };
    },

    // Move task and all its subtasks to a different quadrant
    moveTaskWithSubtasks: (id, toQuadrant, newOrder) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;

      const subtasks = get().tasks.filter(
        (t) => t.parentTaskId === id && t.taskType === TaskType.SUBTASK
      );

      // Move parent task
      get().moveTask(id, toQuadrant, newOrder);

      // Move all subtasks to same quadrant
      subtasks.forEach((subtask) => {
        get().updateTask(subtask.id, {
          quadrant: toQuadrant,
          updatedAt: new Date(),
        });
      });
    },

    // Reorder subtasks within a parent task
    reorderSubtasks: (parentTaskId, subtaskIds) => {
      set((state) => {
        const updatedTasks = state.tasks.map((task) => {
          // Only update subtasks of this parent
          if (task.parentTaskId === parentTaskId && task.taskType === TaskType.SUBTASK) {
            const newOrder = subtaskIds.indexOf(task.id);
            if (newOrder !== -1) {
              return { ...task, order: newOrder, updatedAt: new Date() };
            }
          }
          return task;
        });

        return { tasks: updatedTasks };
      });

      get().syncToDB();
    },

    // Set tasks (for undo/redo)
    setTasks: (tasks) => {
      set({ tasks });
      get().syncToDB();
    },

    // Set tags (for undo/redo)
    setTags: (tags) => {
      set({ tags });
      get().syncToDB();
    },

    // Set people (for undo/redo)
    setPeople: (people) => {
      set({ people });
      get().syncToDB();
    },

    // Load from IndexedDB
    loadFromDB: async () => {
      set({ isLoading: true });

      try {
        const data = await storageManager.loadAll();
        set({ tasks: data.tasks, tags: data.tags, people: data.people || [], isLoading: false });
      } catch (error) {
        console.error('Failed to load from DB:', error);
        set({ isLoading: false });
      }
    },

    // Sync to IndexedDB (debounced)
    syncToDB: () => {
      const { tasks, tags, people } = get();
      storageManager.debouncedSync({ tasks, tags, people });
    },

    // Move subtask to a different parent
    moveSubtaskToParent: (subtaskId, newParentId) => {
      const allTasks = get().tasks;
      const subtask = allTasks.find((t) => t.id === subtaskId);
      const newParent = allTasks.find((t) => t.id === newParentId);

      // Validation
      if (!subtask || !isSubtask(subtask)) {
        throw new Error('Invalid subtask');
      }

      if (!newParent) {
        throw new Error('New parent not found');
      }

      if (!canHaveSubtasks(newParent)) {
        throw new Error(`Cannot add subtasks to ${newParent.taskType} tasks`);
      }

      if (subtaskId === newParentId) {
        throw new Error('Cannot move subtask to itself');
      }

      // Future-proofing: prevent moving subtask that has its own subtasks
      if (hasSubtasks(subtask, allTasks)) {
        throw new Error('Cannot reparent subtask with its own subtasks');
      }

      // Store old parent for cleanup
      const oldParentId = subtask.parentTaskId;
      const oldParent = oldParentId ? allTasks.find((t) => t.id === oldParentId) : undefined;

      // Calculate new order (append to end of new parent's subtask list)
      const newParentSubtasks = allTasks.filter(
        (t) => t.parentTaskId === newParentId && t.taskType === TaskType.SUBTASK
      );
      const newOrder = newParentSubtasks.length;

      // Update subtask (atomic)
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === subtaskId
            ? {
                ...t,
                parentTaskId: newParentId,
                quadrant: newParent.quadrant, // Inherit from new parent
                order: newOrder,
                updatedAt: new Date(),
              }
            : t
        ),
      }));

      // Update both parents' completion status
      if (oldParentId) {
        get().updateParentCompletionStatus(oldParentId);
      }
      get().updateParentCompletionStatus(newParentId);

      // Sync to database
      get().syncToDB();

      // Log event
      const updatedSubtask = get().tasks.find((t) => t.id === subtaskId);
      if (updatedSubtask && oldParent) {
        historyLogger.logSubtaskReparented(updatedSubtask, oldParent, newParent);
      }
    },

    // Detach subtask to become a standalone task
    detachSubtask: (subtaskId) => {
      const allTasks = get().tasks;
      const subtask = allTasks.find((t) => t.id === subtaskId);

      // Validation
      if (!subtask || !isSubtask(subtask)) {
        throw new Error('Invalid subtask');
      }

      // Future-proofing: prevent detaching subtask that has its own subtasks
      if (hasSubtasks(subtask, allTasks)) {
        throw new Error('Cannot detach subtask with its own subtasks');
      }

      // Store old parent and current quadrant
      const oldParentId = subtask.parentTaskId;
      const oldParent = oldParentId ? allTasks.find((t) => t.id === oldParentId) : undefined;
      const currentQuadrant = subtask.quadrant;

      // Calculate new order (append to end of target quadrant)
      const quadrantTasks = allTasks.filter(
        (t) => t.quadrant === currentQuadrant && !t.parentTaskId
      );
      const newOrder = quadrantTasks.length;

      // Update subtask (atomic)
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === subtaskId
            ? {
                ...t,
                taskType: TaskType.STANDARD,
                parentTaskId: undefined,
                order: newOrder,
                updatedAt: new Date(),
              }
            : t
        ),
      }));

      // Update old parent's completion status
      if (oldParentId) {
        get().updateParentCompletionStatus(oldParentId);
      }

      // Sync to database
      get().syncToDB();

      // Log event
      const updatedTask = get().tasks.find((t) => t.id === subtaskId);
      if (updatedTask && oldParent) {
        historyLogger.logSubtaskDetached(updatedTask, oldParent, currentQuadrant);
      }
    },

    // Update parent task completion based on subtask status
    updateParentCompletionStatus: (parentTaskId) => {
      const parent = get().tasks.find((t) => t.id === parentTaskId);
      if (!parent || !canHaveSubtasks(parent)) return;

      const allTasks = get().tasks;
      const allCompleted = areAllSubtasksCompleted(parent, allTasks);
      const hasAnySubtasks = hasSubtasks(parent, allTasks);

      // Case 1: All subtasks completed → auto-complete parent
      if (allCompleted && hasAnySubtasks && !parent.completed) {
        const latestCompletedAt = getLatestSubtaskCompletionDate(parent, allTasks);

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === parentTaskId
              ? {
                  ...t,
                  completed: true,
                  completedAt: latestCompletedAt,
                  updatedAt: new Date(),
                }
              : t
          ),
        }));

        // Log auto-completion
        const updatedParent = get().tasks.find((t) => t.id === parentTaskId);
        if (updatedParent && latestCompletedAt) {
          historyLogger.logParentAutoCompleted(updatedParent, latestCompletedAt);
        }

        get().syncToDB();
      }
      // Case 2: Not all subtasks completed → auto-uncomplete parent
      else if (!allCompleted && parent.completed && hasAnySubtasks) {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === parentTaskId
              ? {
                  ...t,
                  completed: false,
                  completedAt: undefined,
                  updatedAt: new Date(),
                }
              : t
          ),
        }));

        // Log auto-uncompleted
        const updatedParent = get().tasks.find((t) => t.id === parentTaskId);
        if (updatedParent) {
          historyLogger.logParentAutoUncompleted(updatedParent);
        }

        get().syncToDB();
      }
      // Case 3: No subtasks left → revert to manual control (keep current state)
      // This allows users to manually toggle parent after all subtasks are deleted
    },
  }));
