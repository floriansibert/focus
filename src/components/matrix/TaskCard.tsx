import { useMemo, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Trash2, Repeat, CornerDownRight, Plus, Star, Clock, Link } from 'lucide-react';
import type { Task } from '../../types/task';
import { TaskType } from '../../types/task';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { Badge } from '../ui/Badge';
import { PersonBadge } from '../ui/PersonBadge';
import { SubtaskProgressPie } from '../ui/SubtaskProgressPie';
import { DueDateQuickMenu } from '../task/DueDateQuickMenu';
import { formatRecurrence } from '../../utils/date';
import { isSubtask, canHaveSubtasks } from '../../utils/taskHelpers';

interface TaskCardProps {
  taskId: string;
  onEdit?: (task: Task) => void;
  parentTaskId?: string;
  isSelected?: boolean;
}

export const TaskCard = memo(function TaskCard({ taskId, onEdit, parentTaskId, isSelected = false }: TaskCardProps) {
  const { toggleComplete, deleteTask, addSubtask, toggleStar, updateTask } = useTaskStore();
  const { collapsedTasks, toggleTaskCollapse, startPomodoroWithTask } = useUIStore();
  const task = useTaskStore((state) => state.tasks.find((t) => t.id === taskId));
  const allTasks = useTaskStore((state) => state.tasks);
  const allTags = useTaskStore((state) => state.tags);
  const allPeople = useTaskStore((state) => state.people);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: taskId,
    disabled: false,
    data: {
      type: task && isSubtask(task) ? 'subtask' : 'parent-task',
      parentTaskId: parentTaskId,
    },
  });

  const tags = useMemo(
    () => (task ? allTags.filter((tag) => task.tags.includes(tag.id)).sort((a, b) => a.name.localeCompare(b.name)) : []),
    [allTags, task]
  );

  const people = useMemo(
    () => (task ? allPeople.filter((person) => task.people?.includes(person.id)).sort((a, b) => a.name.localeCompare(b.name)) : []),
    [allPeople, task]
  );

  const subtaskCount = useMemo(
    () => task ? allTasks.filter((t) => t.parentTaskId === task.id && t.taskType === TaskType.SUBTASK).length : 0,
    [allTasks, task]
  );

  const completedSubtaskCount = useMemo(
    () => task ? allTasks.filter((t) =>
      t.parentTaskId === task.id &&
      t.taskType === TaskType.SUBTASK &&
      t.completed === true
    ).length : 0,
    [allTasks, task]
  );

  const isOverdue = useMemo(() => {
    if (!task || !task.dueDate || task.completed) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
  }, [task]);

  if (!task) return null;

  const isCollapsed = collapsedTasks.has(task.id);
  const isRecurringParent = task.taskType === TaskType.RECURRING_PARENT;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative
        rounded-lg p-2 shadow-card
        transition-all cursor-grab active:cursor-grabbing
        animate-fadeIn
        ${task.completed ? 'opacity-60' : ''}
        ${isDragging ? 'shadow-dragging' : ''}
        ${
          isSelected
            ? 'border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
            : isRecurringParent
            ? 'bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-300 dark:border-blue-700 hover:shadow-card-hover'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-card-hover'
        }
      `}
      {...attributes}
      {...listeners}
      tabIndex={-1}
      onClick={(e) => {
        // Only trigger edit if clicking on the card itself, not on buttons
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'H3' || (e.target as HTMLElement).tagName === 'P') {
          onEdit?.(task);
        }
      }}
    >
      {/* Template Badge */}
      {isRecurringParent && (
        <div className="absolute top-1 right-1 z-10">
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded">
            Template
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-1.5 mb-1">
        {subtaskCount > 0 ? (
          <SubtaskProgressPie
            completed={completedSubtaskCount}
            total={subtaskCount}
            size={20}
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskCollapse(task.id);
            }}
            isCollapsed={isCollapsed}
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleComplete(task.id);
            }}
            tabIndex={-1}
            className="mt-0.5 flex-shrink-0"
          >
            <div
              className={`
              w-4 h-4 rounded border-2 flex items-center justify-center
              transition-colors
              ${
                task.completed
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
              }
            `}
            >
              {task.completed && <Check size={12} className="text-white" />}
            </div>
          </button>
        )}

        {/* Star Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStar(task.id);
          }}
          tabIndex={-1}
          className="mt-0.5 flex-shrink-0"
          title={task.isStarred ? 'Unstar task' : 'Star task'}
        >
          <Star
            size={16}
            className={`transition-colors ${
              task.isStarred
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'
            }`}
          />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            {isSubtask(task) && (
              <span
                className="flex-shrink-0 text-gray-400 dark:text-gray-500"
                title="This is a subtask"
              >
                <CornerDownRight size={14} />
              </span>
            )}
            {task.taskType === TaskType.RECURRING_INSTANCE && (
              <button
                className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                title="Created from template (click to view)"
                onClick={(e) => {
                  e.stopPropagation();
                  const { setActiveView } = useUIStore.getState();
                  setActiveView('templates');
                }}
              >
                <Link size={14} />
              </button>
            )}
            <h3
              className={`
              text-sm font-medium text-gray-900 dark:text-gray-100
              ${task.completed ? 'line-through' : ''}
            `}
            >
              {task.title}
            </h3>
            {task.isRecurring && task.recurrence && (
              <span
                className="flex-shrink-0 text-blue-600 dark:text-blue-400"
                title={`Recurring: ${formatRecurrence(task.recurrence)}`}
              >
                <Repeat size={14} />
              </span>
            )}
            {/* Tags */}
            {tags.map((tag) => (
              <Badge key={tag.id} color={tag.color} size="sm">
                {tag.name}
              </Badge>
            ))}
            {/* People */}
            {people.map((person) => (
              <PersonBadge key={person.id} color={person.color} size="sm">
                {person.name}
              </PersonBadge>
            ))}
            {/* Due Date - inline */}
            {task.dueDate && (
              isOverdue ? (
                <DueDateQuickMenu
                  task={task}
                  onDateChange={(newDate) => updateTask(task.id, { dueDate: newDate })}
                />
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )
            )}
          </div>
        </div>

        {canHaveSubtasks(task) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const title = prompt('Enter subtask title:');
              if (title && title.trim()) {
                addSubtask(task.id, {
                  title: title.trim(),
                  completed: false,
                  isRecurring: false,
                  tags: [],
                  people: [],
                  order: 0,
                });
              }
            }}
            tabIndex={-1}
            className="flex-shrink-0 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity transition-colors"
            title="Add subtask"
          >
            <Plus size={16} />
          </button>
        )}

        {/* Start Pomodoro button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            startPomodoroWithTask(taskId);
          }}
          tabIndex={-1}
          className="flex-shrink-0 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity transition-colors"
          title="Start Pomodoro timer with this task"
          aria-label="Start Pomodoro"
        >
          <Clock size={16} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this task?')) {
              deleteTask(task.id);
            }
          }}
          tabIndex={-1}
          className="flex-shrink-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity transition-colors"
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
          {task.description}
        </p>
      )}
    </div>
  );
});
