import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { RecurringTaskConfig } from './RecurringTaskConfig';
import { SubtaskList } from './SubtaskList';
import { InstanceList } from './InstanceList';
import { ParentSelectorModal } from './ParentSelectorModal';
import { QuadrantIcon } from './QuadrantIcon';
import { CompactQuadrantSelector } from './CompactQuadrantSelector';
import { CompactMetadataBar } from './CompactMetadataBar';
import { QuadrantType, TaskType, type Task, type RecurrenceConfig } from '../../types/task';
import { useTaskStore } from '../../store/taskStore';
import { isSubtask, canHaveSubtasks, hasSubtasks } from '../../utils/taskHelpers';
import { useUIStore } from '../../store/uiStore';
import toast from 'react-hot-toast';

interface TaskSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  defaultQuadrant?: QuadrantType;
  defaultParentTaskId?: string;
  onEditTask?: (task: Task) => void;
  onNavigate?: (direction: 'up' | 'down') => void;
}

export function TaskSidePanel({
  isOpen,
  onClose,
  task,
  defaultQuadrant,
  defaultParentTaskId,
  onEditTask,
  onNavigate,
}: TaskSidePanelProps) {
  const { addTask, updateTask, toggleComplete, toggleStar, tasks, addSubtask, moveSubtaskToParent, detachSubtask } = useTaskStore();
  const { toggleTaskCollapse, collapsedTasks, lastUsedQuadrant, setLastUsedQuadrant } = useUIStore();

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
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);
  const [isInstancesExpanded, setIsInstancesExpanded] = useState(false);
  const [pendingSubtasks, setPendingSubtasks] = useState<Array<{ title: string }>>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isParentSelectorOpen, setIsParentSelectorOpen] = useState(false);

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Get the latest task data from store (to reflect real-time updates like completion status)
  const latestTask = task ? tasks.find((t) => t.id === task.id) || task : task;

  // Get parent task if this is a subtask, or if we're creating a new subtask
  const parentTask = latestTask && latestTask.parentTaskId
    ? tasks.find((t) => t.id === latestTask.parentTaskId)
    : defaultParentTaskId
    ? tasks.find((t) => t.id === defaultParentTaskId)
    : undefined;

  // Calculate subtask counts for completion indicator
  // For templates, count instances instead of subtasks
  const isTemplate = latestTask?.taskType === TaskType.RECURRING_PARENT;

  const subtaskCount = latestTask ? tasks.filter(
    (t) => t.parentTaskId === latestTask.id &&
           (isTemplate ? t.taskType === TaskType.RECURRING_INSTANCE : t.taskType === TaskType.SUBTASK)
  ).length : 0;

  const completedSubtaskCount = latestTask ? tasks.filter(
    (t) => t.parentTaskId === latestTask.id &&
           (isTemplate ? t.taskType === TaskType.RECURRING_INSTANCE : t.taskType === TaskType.SUBTASK) &&
           t.completed
  ).length : 0;

  // Handler for clicking on a subtask
  const handleSubtaskClick = (subtask: Task) => {
    if (onEditTask) {
      onClose();  // Close current panel
      setTimeout(() => onEditTask(subtask), 100);  // Open subtask in new panel
    }
  };

  // Handler for newly created subtask
  const handleSubtaskCreated = (subtaskId: string) => {
    const tasks = useTaskStore.getState().tasks;
    const newSubtask = tasks.find((t) => t.id === subtaskId);
    if (newSubtask && onEditTask) {
      onEditTask(newSubtask);
    }
  };

  // Handler for description change with auto-expand
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);

    // Auto-expand logic
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = descriptionRef.current.scrollHeight + 'px';
    }
  };

  // Handler for quadrant change with smart defaults
  const handleQuadrantChange = (newQuadrant: QuadrantType) => {
    setQuadrant(newQuadrant);
    // Remember for next time when creating new tasks
    if (!task) {
      setLastUsedQuadrant(newQuadrant);
    }
  };

  // Reset form when panel opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect */
      if (task) {
        // Edit mode
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
        setQuadrant(defaultQuadrant || lastUsedQuadrant || QuadrantType.URGENT_IMPORTANT);
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
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isOpen, task, defaultQuadrant, lastUsedQuadrant]);

  // Auto-expand subtasks if task can have subtasks (separate effect to avoid form reset issues)
  useEffect(() => {
    if (isOpen && task && canHaveSubtasks(task)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSubtasksExpanded(true);
    }
    // Auto-expand instances if task is a template
    if (isOpen && task && task.taskType === TaskType.RECURRING_PARENT) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInstancesExpanded(true);
    }
  }, [isOpen, task]);

  // Auto-focus title input when panel opens or task changes
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      // Small delay to ensure the panel is fully rendered
      const timeoutId = setTimeout(() => {
        const input = titleInputRef.current;
        if (input) {
          input.focus();
          // Move cursor to end of text
          const length = input.value.length;
          input.setSelectionRange(length, length);
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, task?.id]);

  // Auto-expand description textarea
  useEffect(() => {
    if (descriptionRef.current) {
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = descriptionRef.current.scrollHeight + 'px';
    }
  }, [description]);

  // Compute form changes (derived state)
  const hasChanges = useMemo(() => {
    if (!task) {
      // Add mode: always consider as having changes if any field is filled
      return title.trim() !== '' || description.trim() !== '';
    }

    // Safety check - latestTask should always exist if task exists, but TypeScript needs assurance
    if (!latestTask) return false;

    // Edit mode: compare with latest task values from store (not original prop)
    const titleChanged = title !== latestTask.title;
    const descriptionChanged = (description || '') !== (latestTask.description || '');
    const quadrantChanged = quadrant !== latestTask.quadrant;

    // Date comparison - compare ISO strings or both undefined
    const dueDateChanged =
      (dueDate?.toISOString() || '') !== (latestTask.dueDate ? new Date(latestTask.dueDate).toISOString() : '');

    // Tags comparison - deep array equality
    const tagsChanged =
      JSON.stringify([...(selectedTags || [])].sort()) !==
      JSON.stringify([...(latestTask.tags || [])].sort());

    // People comparison - deep array equality
    const peopleChanged =
      JSON.stringify([...(selectedPeople || [])].sort()) !==
      JSON.stringify([...(latestTask.people || [])].sort());

    const isRecurringChanged = isRecurring !== (latestTask.isRecurring || false);

    // Recurrence comparison - only if isRecurring is true
    const recurrenceChanged = isRecurring &&
      JSON.stringify(recurrence) !== JSON.stringify(latestTask.recurrence);

    const isStarredChanged = isStarred !== (latestTask.isStarred || false);
    const completedChanged = completed !== (latestTask.completed || false);

    // CompletedAt comparison - compare ISO strings or both undefined
    const completedAtChanged =
      (completedAt?.toISOString() || '') !== (latestTask.completedAt ? new Date(latestTask.completedAt).toISOString() : '');

    return (
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
      completedAtChanged
    );
  }, [task, latestTask, title, description, quadrant, dueDate, selectedTags, selectedPeople, isRecurring, recurrence, isStarred, completed, completedAt]);

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

    // Validate recurring task configuration
    if (isRecurring && !recurrence) {
      toast.error('Please configure the recurrence pattern');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, isRecurring, recurrence]);

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
      const newSubtaskId = addSubtask(defaultParentTaskId, {
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

      // Auto-select the newly created subtask
      const currentTasks = useTaskStore.getState().tasks;
      const createdSubtask = currentTasks.find((t) => t.id === newSubtaskId);
      if (createdSubtask && onEditTask) {
        onEditTask(createdSubtask);
      }
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

      // Auto-select the newly created task
      const currentTasks = useTaskStore.getState().tasks;
      const createdTask = currentTasks.find((t) => t.id === newTaskId);
      if (createdTask && onEditTask) {
        onEditTask(createdTask);
      }
    }
  }, [validate, task, updateTask, addTask, title, description, quadrant, dueDate, selectedTags, selectedPeople, isRecurring, recurrence, completed, completedAt, isStarred, pendingSubtasks, addSubtask, onEditTask, defaultParentTaskId]);

  // Arrow key navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onNavigate?.('up');
        // Remove focus from any clicked task card to avoid purple focus box
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onNavigate?.('down');
        // Remove focus from any clicked task card to avoid purple focus box
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Only work with existing tasks (not in add mode) that can have subtasks
        if (latestTask && canHaveSubtasks(latestTask) && hasSubtasks(latestTask, tasks)) {
          const isCollapsed = collapsedTasks.has(latestTask.id);
          // Right arrow: expand (only if currently collapsed)
          // Left arrow: collapse (only if currently expanded)
          if ((e.key === 'ArrowRight' && isCollapsed) || (e.key === 'ArrowLeft' && !isCollapsed)) {
            e.preventDefault();
            toggleTaskCollapse(latestTask.id);
          }
        }
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNavigate, handleSubmit, latestTask, tasks, toggleTaskCollapse, collapsedTasks]);

  if (!isOpen) return null;

  return (
    <div className="max-h-[calc(100vh-6rem)] flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">

      {/* Header with Close Button */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {task ? 'Edit Task' : 'Add Task'}
          </h2>
          {(task && isSubtask(task)) || defaultParentTaskId ? (
            <div className="p-1 rounded border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
              <QuadrantIcon selectedQuadrant={quadrant} size={24} />
            </div>
          ) : (
            <CompactQuadrantSelector
              value={quadrant}
              onChange={handleQuadrantChange}
            />
          )}
        </div>
        <button
          onClick={onClose}
          tabIndex={-1}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close panel"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Parent Task Info (for subtasks) */}
        {((task && latestTask && isSubtask(latestTask)) || defaultParentTaskId) && parentTask && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center justify-between gap-3">
              {/* Left: Parent task info */}
              <p className="text-sm text-blue-900 dark:text-blue-100">
                {defaultParentTaskId && !task ? 'Adding subtask to: ' : 'This is a subtask of: '}
                <button
                  onClick={() => onEditTask?.(parentTask)}
                  className="font-bold hover:underline cursor-pointer"
                >
                  {parentTask.title}
                </button>
              </p>

              {/* Right: Action buttons (only in edit mode) */}
              {task && latestTask && (
                <div className="flex items-center gap-2">
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
              )}
            </div>
          </div>
        )}

        {/* Recurring Instance Info */}
        {task && latestTask && latestTask.taskType === TaskType.RECURRING_INSTANCE && latestTask.parentTaskId && parentTask && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              This task was created from a recurring template: {' '}
              <button
                onClick={() => {
                  const { setActiveView, setFocusedTask } = useUIStore.getState();
                  setActiveView('templates');
                  setFocusedTask(parentTask.id);
                  onClose();
                }}
                className="font-bold hover:underline cursor-pointer"
              >
                {parentTask.title}
              </button>
            </p>
          </div>
        )}

        {/* Template Info Banner */}
        {task && latestTask && latestTask.taskType === TaskType.RECURRING_PARENT && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-semibold">Template:</span> This is a recurring template. Instances will be automatically generated based on the recurrence pattern.
            </p>
          </div>
        )}

        <Input
          ref={titleInputRef}
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
            ref={descriptionRef}
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Add more details..."
            rows={2}
            style={{ minHeight: '4rem', maxHeight: '20rem', overflow: 'auto' }}
            className="
              w-full px-3 py-2 rounded-lg border
              bg-white dark:bg-gray-800
              border-gray-300 dark:border-gray-600
              text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-colors
              resize-none
            "
          />
        </div>

        {/* Compact Metadata Bar */}
        <CompactMetadataBar
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          selectedPeople={selectedPeople}
          onPeopleChange={setSelectedPeople}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          isStarred={task ? latestTask?.isStarred || false : isStarred}
          onStarToggle={() => {
            if (task && latestTask) {
              toggleStar(latestTask.id);
            } else {
              setIsStarred(!isStarred);
            }
          }}
          isCompleted={task ? latestTask?.completed || false : completed}
          onCompletionToggle={() => {
            if (task && latestTask) {
              toggleComplete(latestTask.id);
            } else {
              setCompleted(!completed);
              if (!completed && !completedAt) {
                setCompletedAt(new Date());
              }
            }
          }}
          subtaskCount={subtaskCount > 0 ? subtaskCount : undefined}
          completedSubtaskCount={completedSubtaskCount}
          onSubtaskToggle={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
          isSubtasksExpanded={isSubtasksExpanded}
        />

        {/* Creation & Completion Date - Only show in edit mode */}
        {task && latestTask && (
          <div className="flex-1 flex items-center justify-between gap-2 p-3 border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950">
            {/* Left: Created date */}
            {latestTask.createdAt && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Created
                </span>
                <span className="text-sm text-blue-900 dark:text-blue-100">
                  {new Date(latestTask.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

            {/* Right: Completed date (only when completed) */}
            {latestTask.completed && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Completed
                </span>
                {subtaskCount > 0 ? (
                  // Tasks with subtasks: read-only date (auto-computed)
                  <span className="text-sm text-blue-900 dark:text-blue-100">
                    {latestTask?.completedAt
                      ? new Date(latestTask.completedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : new Date().toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                    }
                  </span>
                ) : (
                  // Tasks without subtasks: editable DatePicker
                  <div className="w-36">
                    <DatePicker
                      compact
                      allowClear={false}
                      value={latestTask?.completedAt ? new Date(latestTask.completedAt) : new Date()}
                      onChange={(date) => {
                        updateTask(latestTask.id, {
                          completedAt: date || new Date(),
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Subtask Management */}
        {(() => {
          // Only show subtasks section if:
          // - In edit mode and task can have subtasks OR is a template (which can have subtasks to copy to instances)
          // - In add mode: only if we're not creating a subtask (no nested subtasks)
          const showSubtasks = task ? (canHaveSubtasks(task) || task.taskType === TaskType.RECURRING_PARENT) : !defaultParentTaskId;

          if (!showSubtasks) return null;

          const subtaskCount = task
            ? tasks.filter((t) => t.parentTaskId === task.id && t.taskType === TaskType.SUBTASK).length
            : pendingSubtasks.length;

          return (
            <div>
              {/* Collapsible Header */}
              <button
                type="button"
                onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1">
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
                                tabIndex={-1}
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

        {/* Instance Management - Only for Templates */}
        {task && isTemplate && (
          <div>
            {/* Collapsible Header */}
            <button
              type="button"
              onClick={() => setIsInstancesExpanded(!isInstancesExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Instances
                </span>
                {(() => {
                  const { getInstances } = useTaskStore.getState();
                  const instanceCount = getInstances(task.id).length;
                  return instanceCount > 0 ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {instanceCount}
                    </span>
                  ) : null;
                })()}
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-500 dark:text-gray-400 transition-transform ${
                  isInstancesExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Expandable Content */}
            {isInstancesExpanded && (
              <div className="mt-2 animate-fadeIn">
                <InstanceList
                  templateId={task.id}
                  onInstanceClick={handleSubtaskClick}
                />
              </div>
            )}
          </div>
        )}

        <RecurringTaskConfig
          isRecurring={isRecurring}
          recurrence={recurrence}
          onRecurringChange={setIsRecurring}
          onRecurrenceChange={setRecurrence}
          disabled={(() => {
            if (task?.taskType === TaskType.RECURRING_INSTANCE) return true;
            if (task?.taskType === TaskType.SUBTASK && task.parentTaskId) {
              const parentTask = tasks.find((t) => t.id === task.parentTaskId);
              return parentTask?.taskType === TaskType.RECURRING_INSTANCE || parentTask?.taskType === TaskType.RECURRING_PARENT;
            }
            return false;
          })()}
          disabledReason={(() => {
            if (task?.taskType === TaskType.RECURRING_INSTANCE) {
              return "This is a recurring instance. To modify the recurrence pattern, edit the template instead.";
            }
            if (task?.taskType === TaskType.SUBTASK && task.parentTaskId) {
              const parentTask = tasks.find((t) => t.id === task.parentTaskId);
              if (parentTask?.taskType === TaskType.RECURRING_INSTANCE) {
                return "This subtask belongs to a recurring instance and cannot be made recurring.";
              }
              if (parentTask?.taskType === TaskType.RECURRING_PARENT) {
                return "This subtask belongs to a template and cannot be made recurring.";
              }
            }
            return undefined;
          })()}
          hideCheckbox={task?.taskType === TaskType.RECURRING_PARENT}
        />

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tip: Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>/<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd> to navigate, <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">←</kbd>/<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">→</kbd> to collapse/expand subtasks, <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Cmd+Enter</kbd> to save
        </p>
      </div>

      {/* Footer with Save/Cancel */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={task ? !hasChanges : false}>
          {task ? 'Save' : 'Add Task'}
        </Button>
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
    </div>
  );
}
