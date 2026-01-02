import { useMemo, memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Inbox } from 'lucide-react';
import type { QuadrantType, Task } from '../../types/task';
import { TaskType } from '../../types/task';
import { QUADRANT_INFO } from '../../types/quadrant';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { useTaskFilters } from '../../hooks/useTaskFilters';
import { TaskCard } from './TaskCard';
import { QuadrantHeader } from './QuadrantHeader';
import { EmptyState } from '../ui/EmptyState';
import { isSubtask } from '../../utils/taskHelpers';

interface QuadrantProps {
  type: QuadrantType;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onAddSubtask?: (parentTask: Task) => void;
  selectedTaskId?: string;
}

export const Quadrant = memo(function Quadrant({ type, onAddTask, onEditTask, onAddSubtask, selectedTaskId }: QuadrantProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: type,
    data: { quadrant: type },
  });

  const info = QUADRANT_INFO[type];
  const { collapsedTasks } = useUIStore();

  // Get all tasks from store
  const allTasks = useTaskStore((state) => state.tasks);

  // Filter tasks for this quadrant
  const quadrantTasks = useMemo(
    () => allTasks.filter((task) => task.quadrant === type),
    [allTasks, type]
  );

  // Apply global filters (search, tags, completion) and per-quadrant star filter
  const filteredTasks = useTaskFilters(quadrantTasks, type);

  // Filter out subtasks and recurring parent templates from top-level display
  const topLevelTasks = useMemo(
    () => filteredTasks
      .filter((task) => !isSubtask(task))
      .filter((task) => task.taskType !== TaskType.RECURRING_PARENT)
      .sort((a, b) => a.order - b.order),
    [filteredTasks]
  );

  // Create task hierarchy (parent + subtasks)
  const taskHierarchy = useMemo(() => {
    return topLevelTasks.map((task) => ({
      task,
      subtasks: filteredTasks
        .filter((t) => t.parentTaskId === task.id && t.taskType === TaskType.SUBTASK)
        .sort((a, b) => a.order - b.order),
    }));
  }, [topLevelTasks, filteredTasks]);

  // Extract all task IDs for drag-and-drop context (only top-level tasks are draggable)
  const taskIds = useMemo(
    () => topLevelTasks.map((t) => t.id),
    [topLevelTasks]
  );

  // Extract task IDs that have subtasks (for expand/collapse all functionality)
  const taskIdsWithSubtasks = useMemo(
    () => taskHierarchy
      .filter(({ subtasks }) => subtasks.length > 0)
      .map(({ task }) => task.id),
    [taskHierarchy]
  );

  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-lg border-2 p-4 min-h-[400px] transition-all
        ${info.color}
        ${isOver ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
      `}
    >
      <QuadrantHeader
        info={info}
        taskCount={taskIds.length}
        onAddTask={onAddTask}
        taskIdsWithSubtasks={taskIdsWithSubtasks}
      />

      {/* Task List with Hierarchy */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {taskHierarchy.length > 0 ? (
            taskHierarchy.map(({ task, subtasks }) => {
              const isCollapsed = collapsedTasks.has(task.id);

              return (
                <div key={task.id}>
                  {/* Parent Task */}
                  <TaskCard
                    taskId={task.id}
                    onEdit={onEditTask}
                    onAddSubtask={onAddSubtask}
                    isSelected={selectedTaskId === task.id}
                  />

                  {/* Subtasks (indented) - only show if not collapsed */}
                  {subtasks.length > 0 && !isCollapsed && (
                    <SortableContext
                      items={subtasks.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-1.5">
                        {subtasks.map((subtask) => (
                          <TaskCard
                            key={subtask.id}
                            taskId={subtask.id}
                            onEdit={onEditTask}
                            parentTaskId={task.id}
                            isSelected={selectedTaskId === subtask.id}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={Inbox}
              title="No tasks yet"
              description={`Add tasks to your ${info.title.toLowerCase()} quadrant`}
              action={{
                label: 'Add Task',
                onClick: onAddTask,
              }}
            />
          )}
        </div>
      </SortableContext>
    </div>
  );
});
