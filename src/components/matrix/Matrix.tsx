import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { QuadrantType, TaskType, type Task } from '../../types/task';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { Quadrant } from './Quadrant';
import { TaskCard } from './TaskCard';
import { TaskModal } from '../task/TaskModal';
import { TaskSidePanel } from '../task/TaskSidePanel';
import { isSubtask, canHaveSubtasks } from '../../utils/taskHelpers';
import { useTaskFilters } from '../../hooks/useTaskFilters';

export function Matrix() {
  const { tasks, moveTask, moveTaskWithSubtasks, reorderSubtasks, moveSubtaskToParent, toggleStar, isLoading } = useTaskStore();
  const focusedQuadrant = useUIStore((state) => state.focusedQuadrant);
  const collapsedTasks = useUIStore((state) => state.collapsedTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType | null>(null);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [defaultParentTaskId, setDefaultParentTaskId] = useState<string | undefined>(undefined);

  // Get filtered tasks for the focused quadrant (respects all active filters)
  const quadrantTasksForFocus = useMemo(
    () => focusedQuadrant ? tasks.filter((task) => task.quadrant === focusedQuadrant) : [],
    [tasks, focusedQuadrant]
  );
  const filteredTasksForFocus = useTaskFilters(quadrantTasksForFocus, focusedQuadrant || undefined);

  // Listen for keyboard shortcut events to open task modal
  useEffect(() => {
    const handleOpenTaskModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ quadrant: QuadrantType }>;
      if (customEvent.detail?.quadrant) {
        setSelectedQuadrant(customEvent.detail.quadrant);
        setEditingTask(undefined);
        setIsModalOpen(true);
      }
    };

    window.addEventListener('openTaskModal', handleOpenTaskModal);
    return () => window.removeEventListener('openTaskModal', handleOpenTaskModal);
  }, []);

  // Listen for Ctrl+Shift+Space to create subtask for selected task
  useEffect(() => {
    const handleCreateSubtask = () => {
      if (focusedQuadrant && editingTask) {
        // If current task is a subtask, create sibling subtask under the same parent
        // Otherwise, create a subtask under the current task
        const parentTaskId = isSubtask(editingTask)
          ? editingTask.parentTaskId
          : editingTask.id;

        setEditingTask(undefined);
        setSelectedQuadrant(null);
        setDefaultParentTaskId(parentTaskId);
        setIsModalOpen(true);
      } else if (focusedQuadrant && !editingTask) {
        toast.error('Please select a task first to add a subtask');
      }
    };

    window.addEventListener('createSubtaskForSelectedTask', handleCreateSubtask);
    return () => window.removeEventListener('createSubtaskForSelectedTask', handleCreateSubtask);
  }, [focusedQuadrant, editingTask, tasks]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
    setSelectedQuadrant(null);
    setDefaultParentTaskId(undefined);
  };

  // ESC key handler - Close panel first in focus mode, then exit focus mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen && focusedQuadrant) {
        // Close panel first in focus mode
        handleCloseModal();
        e.stopPropagation(); // Prevent App.tsx handler from firing
      }
    };

    window.addEventListener('keydown', handleEscape, { capture: true });
    return () => window.removeEventListener('keydown', handleEscape, { capture: true });
  }, [isModalOpen, focusedQuadrant]);

  // Close task panel when toggling between focus mode and normal mode
  useEffect(() => {
    // Close modal/panel when focus mode changes
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync UI state when focus mode changes
    setIsModalOpen(false);
    setEditingTask(undefined);
    setSelectedQuadrant(null);
  }, [focusedQuadrant]);

  // Star toggle keyboard shortcut in focus mode
  useEffect(() => {
    if (!focusedQuadrant) return; // Only in focus mode

    const handleStarShortcut = (e: KeyboardEvent) => {
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); // Prevent browser save
        e.stopPropagation();

        if (editingTask) {
          toggleStar(editingTask.id);
        }
      }
    };

    window.addEventListener('keydown', handleStarShortcut);
    return () => window.removeEventListener('keydown', handleStarShortcut);
  }, [focusedQuadrant, editingTask, toggleStar]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevent accidental drags
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const draggedTaskId = event.active.id as string;
    setActiveId(draggedTaskId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const draggedTaskId = active.id as string;
    const draggedTask = tasks.find((t) => t.id === draggedTaskId);

    if (!draggedTask) {
      setActiveId(null);
      return;
    }

    // Handle subtask reordering and reparenting
    if (isSubtask(draggedTask)) {
      const overTask = tasks.find((t) => t.id === over.id);

      // Case 1: Reordering within same parent (existing behavior)
      if (overTask && overTask.parentTaskId === draggedTask.parentTaskId) {
        const parentTaskId = draggedTask.parentTaskId!;
        const subtasks = tasks
          .filter((t) => t.parentTaskId === parentTaskId && t.taskType === TaskType.SUBTASK)
          .sort((a, b) => a.order - b.order);

        const oldIndex = subtasks.findIndex((t) => t.id === draggedTaskId);
        const newIndex = subtasks.findIndex((t) => t.id === over.id);

        if (oldIndex !== newIndex) {
          const reorderedSubtasks = arrayMove(subtasks, oldIndex, newIndex);
          reorderSubtasks(parentTaskId, reorderedSubtasks.map(s => s.id));
        }
      }
      // Case 2: Dropping on a different parent task (NEW - reparenting)
      else if (overTask && canHaveSubtasks(overTask) && overTask.id !== draggedTask.parentTaskId) {
        try {
          moveSubtaskToParent(draggedTaskId, overTask.id);
          toast.success(`Moved "${draggedTask.title}" to "${overTask.title}"`);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Failed to move subtask');
        }
      }
      // Case 3: Invalid drop target
      else {
        toast.error('Drop on a parent task to reparent, or reorder within current parent');
      }

      setActiveId(null);
      return;
    }

    // Check if we're dropping on another task (reordering within same quadrant)
    const overTask = tasks.find((t) => t.id === over.id);

    if (overTask && overTask.quadrant === draggedTask.quadrant) {
      // Reordering within the same quadrant
      const quadrantTasks = tasks
        .filter((t) => t.quadrant === draggedTask.quadrant)
        .sort((a, b) => a.order - b.order);

      const oldIndex = quadrantTasks.findIndex((t) => t.id === draggedTaskId);
      const newIndex = quadrantTasks.findIndex((t) => t.id === over.id);

      if (oldIndex !== newIndex) {
        const reorderedTasks = arrayMove(quadrantTasks, oldIndex, newIndex);

        // Update order for all tasks in this quadrant
        reorderedTasks.forEach((task, index) => {
          moveTask(task.id, task.quadrant, index);
        });
      }
    } else {
      // Moving to a different quadrant
      // Prefer overTask quadrant if dropping on a task, otherwise use the droppable zone's ID
      const targetQuadrant = (overTask?.quadrant || over.id) as QuadrantType;

      // Validate that targetQuadrant is actually a valid quadrant, not a task ID
      const validQuadrants: QuadrantType[] = [
        QuadrantType.URGENT_IMPORTANT,
        QuadrantType.NOT_URGENT_IMPORTANT,
        QuadrantType.URGENT_NOT_IMPORTANT,
        QuadrantType.NOT_URGENT_NOT_IMPORTANT
      ];

      if (!validQuadrants.includes(targetQuadrant)) {
        console.error('Invalid target quadrant:', targetQuadrant);
        toast.error('Invalid drop target');
        setActiveId(null);
        return;
      }

      if (draggedTask.quadrant !== targetQuadrant) {
        const tasksInTargetQuadrant = tasks.filter((t) => t.quadrant === targetQuadrant);
        const newOrder = tasksInTargetQuadrant.length;
        // Use moveTaskWithSubtasks to move parent and all its subtasks
        moveTaskWithSubtasks(draggedTaskId, targetQuadrant, newOrder);
      }
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleAddTask = (quadrant: QuadrantType) => {
    setSelectedQuadrant(quadrant);
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    // In focus mode, toggle panel on/off when clicking same task
    if (focusedQuadrant && editingTask?.id === task.id && isModalOpen) {
      handleCloseModal();
    } else {
      setEditingTask(task);
      setSelectedQuadrant(task.quadrant);
      setIsModalOpen(true);
      setDefaultParentTaskId(undefined);
    }
  };

  const handleAddSubtask = (parentTask: Task) => {
    setEditingTask(undefined);
    setSelectedQuadrant(null);
    setDefaultParentTaskId(parentTask.id);
    setIsModalOpen(true);
  };

  const handleNavigateTask = (direction: 'up' | 'down') => {
    if (!focusedQuadrant || !editingTask) return;

    // Build flat list of VISIBLE tasks in visual order
    const visibleTasks: Task[] = [];

    // Get top-level tasks sorted by order (exclude subtasks and templates)
    const topLevelTasks = filteredTasksForFocus
      .filter((t) => !isSubtask(t) && t.taskType !== TaskType.RECURRING_PARENT)
      .sort((a, b) => a.order - b.order);

    // Build visible task list respecting hierarchy
    topLevelTasks.forEach((parentTask) => {
      visibleTasks.push(parentTask);

      // Add subtasks if parent is not collapsed
      if (!collapsedTasks.has(parentTask.id)) {
        const subtasks = filteredTasksForFocus
          .filter((t) => t.parentTaskId === parentTask.id && t.taskType === TaskType.SUBTASK)
          .sort((a, b) => a.order - b.order);
        visibleTasks.push(...subtasks);
      }
    });

    // Find current task index
    const currentIndex = visibleTasks.findIndex((t) => t.id === editingTask.id);
    if (currentIndex === -1) return;

    // Calculate next index with wrapping
    let nextIndex: number;
    if (direction === 'down') {
      nextIndex = currentIndex + 1;
      if (nextIndex >= visibleTasks.length) {
        nextIndex = 0; // Wrap to first
      }
    } else {
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = visibleTasks.length - 1; // Wrap to last
      }
    }

    // Update editing task
    const nextTask = visibleTasks[nextIndex];
    setEditingTask(nextTask);
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {focusedQuadrant ? (
        // FOCUS MODE: Split-screen layout
        <div className="flex flex-col md:flex-row md:items-start gap-4 p-4 animate-fadeIn">
          {/* Left: Quadrant (50% on desktop) */}
          <div className="flex-1 md:flex-[3]">
            <Quadrant
              type={focusedQuadrant}
              onAddTask={() => handleAddTask(focusedQuadrant)}
              onEditTask={handleEditTask}
              onAddSubtask={handleAddSubtask}
              selectedTaskId={isModalOpen ? editingTask?.id : undefined}
            />
          </div>

          {/* Right: Detail Panel (50% on desktop) */}
          {isModalOpen && (
            <div className="flex-1 md:flex-[3] md:sticky md:top-4">
              <TaskSidePanel
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                task={editingTask}
                defaultQuadrant={selectedQuadrant || undefined}
                defaultParentTaskId={defaultParentTaskId}
                onEditTask={handleEditTask}
                onNavigate={handleNavigateTask}
              />
            </div>
          )}
        </div>
      ) : (
        // NORMAL MODE: Show 2x2 grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 animate-fadeIn">
          <Quadrant
            type={QuadrantType.URGENT_IMPORTANT}
            onAddTask={() => handleAddTask(QuadrantType.URGENT_IMPORTANT)}
            onEditTask={handleEditTask}
            onAddSubtask={handleAddSubtask}
          />
          <Quadrant
            type={QuadrantType.NOT_URGENT_IMPORTANT}
            onAddTask={() => handleAddTask(QuadrantType.NOT_URGENT_IMPORTANT)}
            onEditTask={handleEditTask}
            onAddSubtask={handleAddSubtask}
          />
          <Quadrant
            type={QuadrantType.URGENT_NOT_IMPORTANT}
            onAddTask={() => handleAddTask(QuadrantType.URGENT_NOT_IMPORTANT)}
            onEditTask={handleEditTask}
            onAddSubtask={handleAddSubtask}
          />
          <Quadrant
            type={QuadrantType.NOT_URGENT_NOT_IMPORTANT}
            onAddTask={() => handleAddTask(QuadrantType.NOT_URGENT_NOT_IMPORTANT)}
            onEditTask={handleEditTask}
            onAddSubtask={handleAddSubtask}
          />
        </div>
      )}

      <DragOverlay>{activeTask && <TaskCard taskId={activeTask.id} />}</DragOverlay>

      {/* Normal mode: Use modal (focus mode renders panel inline) */}
      {!focusedQuadrant && (
        <TaskModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          task={editingTask}
          defaultQuadrant={selectedQuadrant || undefined}
          defaultParentTaskId={defaultParentTaskId}
          onEditTask={handleEditTask}
        />
      )}
    </DndContext>
  );
}
