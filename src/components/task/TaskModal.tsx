import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronDown, Check, Star, Plus, X, CornerDownRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TagSelector } from './TagSelector';
import { PeopleSelector } from './PeopleSelector';
import { RecurringTaskConfig } from './RecurringTaskConfig';
import { SubtaskList } from './SubtaskList';
import { SubtaskProgressPie } from '../ui/SubtaskProgressPie';
import { ParentSelectorModal } from './ParentSelectorModal';
import { QuadrantType, TaskType, type Task, type RecurrenceConfig } from '../../types/task';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { QUADRANT_INFO } from '../../types/quadrant';
import { isSubtask, canHaveSubtasks } from '../../utils/taskHelpers';
import toast from 'react-hot-toast';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  defaultQuadrant?: QuadrantType;
  defaultParentTaskId?: string;
  onEditTask?: (task: Task) => void;
}

export function TaskModal({ isOpen, onClose, task, defaultQuadrant, defaultParentTaskId, onEditTask }: TaskModalProps) {
  const { addTask, updateTask, toggleComplete, toggleStar, tasks, addSubtask, moveSubtaskToParent, detachSubtask } = useTaskStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quadrant, setQuadrant] = useState<QuadrantType>(
    defaultQuadrant || QuadrantType.URGENT_IMPORTANT
  );
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | undefined>();
  const [isStarred, setIsStarred] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completedAt, setCompletedAt] = useState<Date | undefined>();
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isQuadrantExpanded, setIsQuadrantExpanded] = useState(false);
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState<Array<{ title: string }>>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isParentSelectorOpen, setIsParentSelectorOpen] = useState(false);

  // Get the latest task data from store (to reflect real-time updates like completion status)
  const latestTask = task ? tasks.find((t) => t.id === task.id) || task : task;

  // Get parent task if this is a subtask, or if we're creating a new subtask
  const parentTask = latestTask && latestTask.parentTaskId
    ? tasks.find((t) => t.id === latestTask.parentTaskId)
    : defaultParentTaskId
    ? tasks.find((t) => t.id === defaultParentTaskId)
    : undefined;

  // Calculate subtask counts for completion indicator
  const subtaskCount = latestTask ? tasks.filter(
    (t) => t.parentTaskId === latestTask.id && t.taskType === TaskType.SUBTASK
  ).length : 0;

  const completedSubtaskCount = latestTask ? tasks.filter(
    (t) => t.parentTaskId === latestTask.id && t.taskType === TaskType.SUBTASK && t.completed
  ).length : 0;

  // Handler for clicking on a subtask
  const handleSubtaskClick = (subtask: Task) => {
    if (onEditTask) {
      onClose();  // Close current modal
      setTimeout(() => onEditTask(subtask), 100);  // Open subtask in new modal
    }
  };

  // Handler for when a new subtask is created
  const handleSubtaskCreated = (subtaskId: string) => {
    const currentTasks = useTaskStore.getState().tasks;
    const newSubtask = currentTasks.find((t) => t.id === subtaskId);
    if (newSubtask && onEditTask) {
      onClose();  // Close current modal
      setTimeout(() => onEditTask(newSubtask), 100);  // Open subtask in new modal
    }
  };

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Edit mode
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Form initialization from task data
        setTitle(task.title);
        setDescription(task.description || '');
        setQuadrant(task.quadrant);
        setDueDate(task.dueDate);
        setSelectedTags(task.tags || []);
        setSelectedPeople(task.people || []);
        setIsRecurring(task.isRecurring || false);
        setRecurrence(task.recurrence);
        setIsStarred(task.isStarred || false);
        setCompleted(task.completed || false);
        setCompletedAt(task.completedAt);
      } else {
        // Add mode
        setTitle('');
        setDescription('');
        setQuadrant(defaultQuadrant || QuadrantType.URGENT_IMPORTANT);
        setDueDate(undefined);
        setSelectedTags([]);
        setSelectedPeople([]);
        setIsRecurring(false);
        setRecurrence(undefined);
        setIsStarred(false);
        setCompleted(false);
        setCompletedAt(undefined);
        setIsSubtasksExpanded(false);
        setPendingSubtasks([]);
        setNewSubtaskTitle('');
      }
      setErrors({});
    }
  }, [isOpen, task, defaultQuadrant]);

  // Auto-expand subtasks if task has subtasks (separate effect to avoid form reset issues)
  useEffect(() => {
    if (isOpen && task) {
      const hasSubtasks = tasks.some((t) => t.parentTaskId === task.id);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Auto-expand based on data
      setIsSubtasksExpanded(hasSubtasks);
    }
  }, [isOpen, task, tasks]);

  // Track form changes
  useEffect(() => {
    if (!task) {
      // Add mode: always consider as having changes if any field is filled
      const hasContent = title.trim() !== '' || description.trim() !== '';
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Computing derived state from form fields
      setHasChanges(hasContent);
      return;
    }

    // Edit mode: compare with original task values
    const titleChanged = title !== task.title;
    const descriptionChanged = (description || '') !== (task.description || '');
    const quadrantChanged = quadrant !== task.quadrant;

    // Date comparison - compare ISO strings or both undefined
    const dueDateChanged =
      (dueDate?.toISOString() || '') !== (task.dueDate ? new Date(task.dueDate).toISOString() : '');

    // Tags comparison - deep array equality
    const tagsChanged =
      JSON.stringify([...(selectedTags || [])].sort()) !==
      JSON.stringify([...(task.tags || [])].sort());

    // People comparison - deep array equality
    const peopleChanged =
      JSON.stringify([...(selectedPeople || [])].sort()) !==
      JSON.stringify([...(task.people || [])].sort());

    const isRecurringChanged = isRecurring !== (task.isRecurring || false);

    // Recurrence comparison - only if isRecurring is true
    const recurrenceChanged = isRecurring &&
      JSON.stringify(recurrence) !== JSON.stringify(task.recurrence);

    const isStarredChanged = isStarred !== (task.isStarred || false);
    const completedChanged = completed !== (task.completed || false);

    // CompletedAt comparison - compare ISO strings or both undefined
    const completedAtChanged =
      (completedAt?.toISOString() || '') !== (task.completedAt ? new Date(task.completedAt).toISOString() : '');

    const changed =
      titleChanged ||
      descriptionChanged ||
      quadrantChanged ||
      dueDateChanged ||
      tagsChanged ||
      peopleChanged ||
      isRecurringChanged ||
      recurrenceChanged ||
      isStarredChanged ||
      completedChanged ||
      completedAtChanged;

    setHasChanges(changed);
  }, [title, description, quadrant, dueDate, selectedTags, selectedPeople, isRecurring, recurrence, isStarred, completed, completedAt, task]);

  // Handler for adding pending subtasks in add mode
  const handleAddPendingSubtask = useCallback(() => {
    if (newSubtaskTitle.trim()) {
      setPendingSubtasks([...pendingSubtasks, { title: newSubtaskTitle.trim() }]);
      setNewSubtaskTitle('');
    }
  }, [newSubtaskTitle, pendingSubtasks]);

  // Handler for removing pending subtasks in add mode
  const handleRemovePendingSubtask = useCallback((index: number) => {
    setPendingSubtasks(pendingSubtasks.filter((_, i) => i !== index));
  }, [pendingSubtasks]);

  // Handler for detaching subtask
  const handleDetachSubtask = useCallback(() => {
    if (!latestTask) return;

    try {
      detachSubtask(latestTask.id);
      toast.success(`"${latestTask.title}" converted to standalone task`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to detach subtask');
    }
  }, [latestTask, detachSubtask, onClose]);

  // Handler for selecting new parent
  const handleSelectNewParent = useCallback((newParentId: string) => {
    if (!latestTask) return;

    const newParent = tasks.find((t) => t.id === newParentId);
    if (!newParent) return;

    try {
      moveSubtaskToParent(latestTask.id, newParentId);
      toast.success(`Moved "${latestTask.title}" to "${newParent.title}"`);
      setIsParentSelectorOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move subtask');
    }
  }, [latestTask, tasks, moveSubtaskToParent]);

  const validate = useCallback(() => {
    const newErrors: { title?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    if (task) {
      // Update existing task
      updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        quadrant,
        dueDate,
        tags: selectedTags,
        people: selectedPeople,
        isRecurring,
        recurrence: isRecurring ? recurrence : undefined,
      });
    } else if (defaultParentTaskId) {
      // Create new subtask
      const trimmedTitle = title.trim();
      addSubtask(defaultParentTaskId, {
        title: trimmedTitle,
        description: description.trim() || undefined,
        dueDate,
        completed,
        completedAt: completed ? (completedAt || new Date()) : undefined,
        tags: selectedTags,
        people: selectedPeople,
        isRecurring: false,
        order: 0,
      });
    } else {
      // Create new task
      const trimmedTitle = title.trim();
      const newTaskId = addTask({
        title: trimmedTitle,
        description: description.trim() || undefined,
        quadrant,
        dueDate,
        completed,
        completedAt: completed ? (completedAt || new Date()) : undefined,
        isStarred,
        isRecurring,
        recurrence: isRecurring ? recurrence : undefined,
        tags: selectedTags,
        people: selectedPeople,
        taskType: TaskType.STANDARD,
        order: 0,
      });

      // Create subtasks if any were added
      if (pendingSubtasks.length > 0) {
        // Create each subtask using the new task ID
        pendingSubtasks.forEach((subtask) => {
          addSubtask(newTaskId, {
            title: subtask.title,
            description: undefined,
            dueDate: undefined,
            tags: [],
            people: [],
            isRecurring: false,
            completed: false,
            order: 0,
          });
        });
      }
    }

    onClose();
  }, [validate, task, updateTask, addTask, title, description, quadrant, dueDate, selectedTags, selectedPeople, isRecurring, recurrence, completed, completedAt, isStarred, pendingSubtasks, addSubtask, onClose, defaultParentTaskId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task' : 'Add Task'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={task ? !hasChanges : false}>
            {task ? 'Save' : 'Add Task'}
          </Button>
        </>
      }
    >
      <div className="space-y-4" onKeyDown={handleKeyDown}>
        {/* Parent Task Info (for subtasks) */}
        {((task && latestTask && isSubtask(latestTask)) || defaultParentTaskId) && parentTask && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              {defaultParentTaskId && !task ? 'Adding subtask to: ' : 'This is a subtask of: '}<strong>{parentTask.title}</strong>
            </p>
            <button
              onClick={() => onEditTask?.(parentTask)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 flex items-center gap-1"
            >
              Go to parent task <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Recurring Instance Info */}
        {task && latestTask && latestTask.taskType === TaskType.RECURRING_INSTANCE && latestTask.parentTaskId && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              This task was created from a recurring template{parentTask ? `: ${parentTask.title}` : ''}
            </p>
            <button
              onClick={() => {
                const { setActiveView } = useUIStore.getState();
                setActiveView('templates');
                onClose();
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 flex items-center gap-1"
            >
              Go to template <ArrowRight size={12} />
            </button>
          </div>
        )}

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          placeholder="Enter task title..."
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details..."
            rows={3}
            className="
              w-full px-3 py-2 rounded-lg border
              bg-white dark:bg-gray-800
              border-gray-300 dark:border-gray-600
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors
            "
          />
        </div>

        {/* Tags - Inline layout */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Tags:
          </label>
          <div className="flex-1">
            <TagSelector selectedTags={selectedTags} onChange={setSelectedTags} />
          </div>
        </div>

        {/* People - Inline layout */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            People:
          </label>
          <div className="flex-1">
            <PeopleSelector selectedPeople={selectedPeople} onChange={setSelectedPeople} />
          </div>
        </div>

        {/* Star Status & Completion Status */}
        <div className="flex gap-3">
          {/* Star Status */}
          <button
            type="button"
            onClick={() => {
              if (task && latestTask) {
                toggleStar(latestTask.id);
              } else {
                setIsStarred(!isStarred);
              }
            }}
            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Star
              size={20}
              className={`flex-shrink-0 ${
                task ? (latestTask?.isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600') : (isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')
              }`}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {task ? (latestTask?.isStarred ? 'Starred' : 'Star this task') : (isStarred ? 'Starred' : 'Star this task')}
            </span>
          </button>

          {/* Completion Status */}
          <div className="flex-1 flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          {task && subtaskCount > 0 ? (
            // Show progress indicator for tasks with subtasks (edit mode only)
            <div className="flex items-center gap-2 w-full">
              <SubtaskProgressPie
                completed={completedSubtaskCount}
                total={subtaskCount}
                size={20}
              />
              <div className="flex-1">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {completedSubtaskCount} of {subtaskCount} subtasks completed
                </div>
                {latestTask?.completed && latestTask?.completedAt && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Auto-completed on {new Date(latestTask.completedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Show checkbox for tasks without subtasks (both add and edit mode)
            <div className="flex-1 flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (task && latestTask) {
                    toggleComplete(latestTask.id);
                  } else {
                    setCompleted(!completed);
                    if (!completed && !completedAt) {
                      setCompletedAt(new Date());
                    }
                  }
                }}
                className="flex-shrink-0"
              >
                <div
                  className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center
                    transition-colors
                    ${
                      task ? (latestTask?.completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500') : (completed ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600 hover:border-blue-500')
                    }
                  `}
                >
                  {(task ? latestTask?.completed : completed) && <Check size={14} className="text-white" />}
                </div>
              </button>
              <label
                className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  if (task && latestTask) {
                    toggleComplete(latestTask.id);
                  } else {
                    setCompleted(!completed);
                    if (!completed && !completedAt) {
                      setCompletedAt(new Date());
                    }
                  }
                }}
              >
                {task ? (latestTask?.completed ? 'Completed' : 'Mark as complete') : (completed ? 'Will be created as completed' : 'Create as completed')}
              </label>
              {(task ? latestTask?.completed : completed) && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    on
                  </span>
                  <div className="w-44">
                    <DatePicker
                      value={task ? (latestTask?.completedAt ? new Date(latestTask.completedAt) : new Date()) : (completedAt || new Date())}
                      onChange={(date) => {
                        if (task && latestTask) {
                          updateTask(latestTask.id, {
                            completedAt: date || new Date(),
                          });
                        } else {
                          setCompletedAt(date || new Date());
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Quadrant Selector - Collapsible */}
        {task && isSubtask(task) ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quadrant
            </label>
            <div className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {QUADRANT_INFO[quadrant].title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Inherited from parent task
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Collapsible Header */}
            <button
              type="button"
              onClick={() => setIsQuadrantExpanded(!isQuadrantExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quadrant:
                </span>
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {QUADRANT_INFO[quadrant].title}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-500 dark:text-gray-400 transition-transform ${
                  isQuadrantExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Expandable Content */}
            {isQuadrantExpanded && (
              <div className="mt-2 grid grid-cols-2 gap-2 animate-fadeIn">
                {Object.entries(QUADRANT_INFO).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setQuadrant(key as QuadrantType)}
                    className={`
                      p-2 rounded-lg border-2 text-left transition-all
                      ${
                        quadrant === key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="font-medium text-xs text-gray-900 dark:text-gray-100">
                      {info.title}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Parent Task Management (for subtasks only) */}
        {task && latestTask && isSubtask(latestTask) && parentTask && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Parent Task
            </label>

            <div className="flex items-center gap-2">
              {/* Current parent display */}
              <div className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <CornerDownRight size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {parentTask.title}
                  </span>
                  <Badge color={QUADRANT_INFO[parentTask.quadrant].color} size="sm">
                    {QUADRANT_INFO[parentTask.quadrant].shortLabel}
                  </Badge>
                </div>
              </div>

              {/* Action buttons */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsParentSelectorOpen(true)}
              >
                Change Parent
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDetachSubtask}
              >
                Convert to Task
              </Button>
            </div>
          </div>
        )}

        {/* Subtask Management - Collapsible */}
        {(() => {
          // Only show subtasks section if:
          // - In edit mode and task can have subtasks
          // - In add mode: only if we're not creating a subtask (no nested subtasks)
          const showSubtasks = task ? canHaveSubtasks(task) : !defaultParentTaskId;

          if (!showSubtasks) return null;

          const subtaskCount = task
            ? tasks.filter((t) => t.parentTaskId === task.id).length
            : pendingSubtasks.length;

          return (
            <div>
              {/* Collapsible Header */}
              <button
                type="button"
                onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subtasks
                  </span>
                  {subtaskCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {subtaskCount}
                    </span>
                  )}
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 dark:text-gray-400 transition-transform ${
                    isSubtasksExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Expandable Content */}
              {isSubtasksExpanded && (
                <div className="mt-2 animate-fadeIn">
                  {task ? (
                    // Edit mode: Show SubtaskList component
                    <SubtaskList
                      parentTaskId={task.id}
                      onSubtaskClick={handleSubtaskClick}
                      onSubtaskCreated={handleSubtaskCreated}
                    />
                  ) : (
                    // Add mode: Show pending subtasks UI
                    <div className="space-y-2">
                      {/* Input for new subtask */}
                      <div className="flex gap-2">
                        <Input
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddPendingSubtask();
                            }
                          }}
                          placeholder="Add a subtask..."
                          className="flex-1"
                        />
                        <Button
                          onClick={handleAddPendingSubtask}
                          disabled={!newSubtaskTitle.trim()}
                          className="px-3"
                        >
                          <Plus size={16} />
                        </Button>
                      </div>

                      {/* List of pending subtasks */}
                      {pendingSubtasks.length > 0 && (
                        <div className="space-y-1 pl-2">
                          {pendingSubtasks.map((subtask, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-700 group"
                            >
                              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                {subtask.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemovePendingSubtask(index)}
                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove subtask"
                              >
                                <X size={14} className="text-gray-500 dark:text-gray-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Due Date - Inline layout */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            Due Date:
          </label>
          <div className="flex-1">
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
            />
          </div>
        </div>

        <RecurringTaskConfig
          isRecurring={isRecurring}
          recurrence={recurrence}
          onRecurringChange={setIsRecurring}
          onRecurrenceChange={setRecurrence}
        />

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tip: Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Cmd+Enter</kbd> to save
        </p>
      </div>

      {/* Parent Selector Modal */}
      {task && latestTask && isSubtask(latestTask) && parentTask && (
        <ParentSelectorModal
          isOpen={isParentSelectorOpen}
          onClose={() => setIsParentSelectorOpen(false)}
          subtaskId={latestTask.id}
          currentParentId={parentTask.id}
          onSelectParent={handleSelectNewParent}
        />
      )}
    </Modal>
  );
}
