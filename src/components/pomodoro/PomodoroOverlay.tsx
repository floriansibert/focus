import { useEffect, useMemo } from 'react';
import { X, Play, Pause, SkipForward, RotateCcw, Check, Star, CornerDownRight, Repeat } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import { formatTime, getSessionLabel, getSessionColor } from '../../utils/pomodoro';
import { Badge } from '../ui/Badge';
import { PersonBadge } from '../ui/PersonBadge';
import { SubtaskProgressPie } from '../ui/SubtaskProgressPie';
import { TaskType } from '../../types/task';
import { isSubtask } from '../../utils/taskHelpers';
import { formatRecurrence } from '../../utils/date';

export function PomodoroOverlay() {
  const {
    isPomodoroOpen,
    pomodoroState,
    focusedTaskId,
    collapsedTasks,
    togglePomodoro,
    startPomodoro,
    pausePomodoro,
    skipPomodoro,
    restartPomodoroSession,
    setFocusedTask,
    toggleTaskCollapse,
  } = useUIStore();

  const { toggleComplete, toggleStar } = useTaskStore();
  const tasks = useTaskStore((state) => state.tasks);
  const tags = useTaskStore((state) => state.tags);
  const people = useTaskStore((state) => state.people);

  // Get focused task and its resolved data
  const focusedTask = focusedTaskId
    ? tasks.find(t => t.id === focusedTaskId)
    : null;

  const taskTags = focusedTask
    ? tags.filter(tag => focusedTask.tags.includes(tag.id)).sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const taskPeople = focusedTask
    ? people.filter(person => focusedTask.people.includes(person.id)).sort((a, b) => a.name.localeCompare(b.name))
    : [];

  // Get subtasks if focused task has any
  const subtasks = useMemo(
    () => focusedTask
      ? tasks.filter((t) => t.parentTaskId === focusedTask.id && t.taskType === TaskType.SUBTASK)
          .sort((a, b) => a.order - b.order)
      : [],
    [focusedTaskId, tasks]
  );

  const completedSubtaskCount = useMemo(
    () => subtasks.filter((t) => t.completed).length,
    [subtasks]
  );

  // Get parent task if focused task is a subtask
  const parentTask = useMemo(
    () => focusedTask && focusedTask.parentTaskId
      ? tasks.find(t => t.id === focusedTask.parentTaskId)
      : null,
    [focusedTaskId, tasks]
  );

  const parentTaskTags = useMemo(
    () => parentTask
      ? tags.filter(tag => parentTask.tags.includes(tag.id)).sort((a, b) => a.name.localeCompare(b.name))
      : [],
    [parentTask, tags]
  );

  const parentTaskPeople = useMemo(
    () => parentTask
      ? people.filter(person => parentTask.people.includes(person.id)).sort((a, b) => a.name.localeCompare(b.name))
      : [],
    [parentTask, people]
  );

  const isCollapsed = focusedTask ? collapsedTasks.has(focusedTask.id) : false;
  const isOverdue = focusedTask?.dueDate && !focusedTask.completed && new Date(focusedTask.dueDate) < new Date();

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isPomodoroOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isPomodoroOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isPomodoroOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        togglePomodoro();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (pomodoroState.isRunning) {
          pausePomodoro();
        } else {
          startPomodoro();
        }
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        skipPomodoro();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        restartPomodoroSession();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPomodoroOpen, pomodoroState.isRunning, togglePomodoro, startPomodoro, pausePomodoro, skipPomodoro, restartPomodoroSession]);

  if (!isPomodoroOpen) return null;

  const colors = getSessionColor(pomodoroState.sessionType);
  const sessionLabel = getSessionLabel(pomodoroState.sessionType);

  // Calculate progress for circular indicator
  const radius = 170;
  const circumference = 2 * Math.PI * radius;
  const progress = 1 - pomodoroState.timeRemaining / pomodoroState.totalTime;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black/60 ${colors.gradient} transition-all duration-1000`}>
      {/* Close/Minimize button (top-right) */}
      <button
        onClick={() => {
          togglePomodoro();
          if (!pomodoroState.isRunning) {
            // Only clear focused task when closing (not minimizing)
            setFocusedTask(null);
          }
        }}
        className="absolute top-8 right-8 p-3 rounded-full text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-black/20 transition-all hover:scale-110"
        aria-label={pomodoroState.isRunning ? "Minimize" : "Close"}
        title={pomodoroState.isRunning ? "Minimize (Esc)" : "Close (Esc)"}
      >
        <X size={24} />
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center gap-12">
        {/* Session label */}
        <div className="text-center">
          <h2 className={`text-2xl font-light ${colors.textColor} mb-2`}>
            {sessionLabel}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pomodoro {pomodoroState.currentPomodoro} of 4
          </p>
        </div>

        {/* Focused Task Info */}
        {focusedTask && (
          <div className="w-full max-w-2xl space-y-3">
            {/* Parent Task (if this is a subtask) */}
            {parentTask && (
              <div className="p-4 rounded-lg bg-white/5 dark:bg-black/5 backdrop-blur-sm border border-white/10 dark:border-black/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-300 dark:text-gray-400">Parent Task:</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComplete(parentTask.id);
                    }}
                    className="mt-0.5 flex-shrink-0"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      parentTask.completed
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-400 dark:border-gray-500 hover:border-blue-400'
                    }`}>
                      {parentTask.completed && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(parentTask.id);
                    }}
                    className="mt-0.5 flex-shrink-0"
                    title={parentTask.isStarred ? 'Unstar task' : 'Star task'}
                  >
                    <Star
                      size={16}
                      className={`transition-colors ${
                        parentTask.isStarred
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-400 dark:text-gray-600 hover:text-amber-400'
                      }`}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h4 className={`text-sm font-medium text-gray-200 dark:text-gray-300 ${parentTask.completed ? 'line-through opacity-60' : ''}`}>
                        {parentTask.title}
                      </h4>
                      {/* Tags */}
                      {parentTaskTags.map(tag => (
                        <Badge key={tag.id} color={tag.color} size="sm">
                          {tag.name}
                        </Badge>
                      ))}
                      {/* People */}
                      {parentTaskPeople.map(person => (
                        <PersonBadge key={person.id} color={person.color} size="sm">
                          {person.name}
                        </PersonBadge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Task Card */}
            <div className="relative p-5 rounded-xl bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-black/20">
              {/* Remove focus button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedTask(null);
                }}
                className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-200 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-white/10 dark:hover:bg-black/20 transition-all"
                title="Remove task focus"
                aria-label="Remove task focus"
              >
                <X size={16} />
              </button>

              {/* Header with checkbox/progress and star */}
              <div className="flex items-center gap-1.5 mb-3 pr-8">
                {subtasks.length > 0 ? (
                  <SubtaskProgressPie
                    completed={completedSubtaskCount}
                    total={subtasks.length}
                    size={20}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskCollapse(focusedTask.id);
                    }}
                    isCollapsed={isCollapsed}
                  />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleComplete(focusedTask.id);
                    }}
                    className="flex-shrink-0"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      focusedTask.completed
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 dark:border-gray-400 hover:border-blue-400'
                    }`}>
                      {focusedTask.completed && <Check size={12} className="text-white" />}
                    </div>
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(focusedTask.id);
                  }}
                  className="flex-shrink-0"
                  title={focusedTask.isStarred ? 'Unstar task' : 'Star task'}
                >
                  <Star
                    size={16}
                    className={`transition-colors ${
                      focusedTask.isStarred
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 dark:text-gray-500 hover:text-amber-400'
                    }`}
                  />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    {isSubtask(focusedTask) && (
                      <span className="flex-shrink-0 text-gray-400 dark:text-gray-500" title="This is a subtask">
                        <CornerDownRight size={14} />
                      </span>
                    )}
                    <h3 className={`text-lg font-semibold ${colors.textColor} ${focusedTask.completed ? 'line-through opacity-70' : ''}`}>
                      {focusedTask.title}
                    </h3>
                    {focusedTask.isRecurring && focusedTask.recurrence && (
                      <span
                        className="flex-shrink-0 text-blue-400 dark:text-blue-300"
                        title={`Recurring: ${formatRecurrence(focusedTask.recurrence)}`}
                      >
                        <Repeat size={14} />
                      </span>
                    )}
                    {/* Tags */}
                    {taskTags.map(tag => (
                      <Badge key={tag.id} color={tag.color} size="sm">
                        {tag.name}
                      </Badge>
                    ))}
                    {/* People */}
                    {taskPeople.map(person => (
                      <PersonBadge key={person.id} color={person.color} size="sm">
                        {person.name}
                      </PersonBadge>
                    ))}
                    {/* Due Date */}
                    {focusedTask.dueDate && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isOverdue
                          ? 'bg-red-500/20 text-red-300 font-medium'
                          : 'bg-white/10 text-gray-300'
                      }`}>
                        {new Date(focusedTask.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {focusedTask.description && (
                <p className="text-sm text-gray-200 dark:text-gray-300 mt-3 opacity-90 leading-relaxed">
                  {focusedTask.description}
                </p>
              )}

              {/* Subtasks */}
              {subtasks.length > 0 && !isCollapsed && (
                <div className="mt-1 space-y-1">
                  {subtasks.map((subtask) => {
                    const subtaskTags = tags.filter(tag => subtask.tags.includes(tag.id)).sort((a, b) => a.name.localeCompare(b.name));
                    const subtaskPeople = people.filter(person => subtask.people.includes(person.id)).sort((a, b) => a.name.localeCompare(b.name));

                    return (
                      <div key={subtask.id} className="flex items-start gap-1.5 p-2 rounded bg-white/5 dark:bg-black/5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete(subtask.id);
                          }}
                          className="mt-0.5 flex-shrink-0"
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            subtask.completed
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-gray-400 dark:border-gray-500 hover:border-blue-400'
                          }`}>
                            {subtask.completed && <Check size={12} className="text-white" />}
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(subtask.id);
                          }}
                          className="mt-0.5 flex-shrink-0"
                          title={subtask.isStarred ? 'Unstar subtask' : 'Star subtask'}
                        >
                          <Star
                            size={16}
                            className={`transition-colors ${
                              subtask.isStarred
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-400 dark:text-gray-600 hover:text-amber-400'
                            }`}
                          />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className={`text-sm text-gray-900 dark:text-gray-200 ${subtask.completed ? 'line-through opacity-60' : ''}`}>
                              {subtask.title}
                            </span>
                            {subtaskTags.map(tag => (
                              <Badge key={tag.id} color={tag.color} size="sm">
                                {tag.name}
                              </Badge>
                            ))}
                            {subtaskPeople.map(person => (
                              <PersonBadge key={person.id} color={person.color} size="sm">
                                {person.name}
                              </PersonBadge>
                            ))}
                          </div>
                          {subtask.description && (
                            <p className="text-xs text-gray-700 dark:text-gray-400 mt-1 opacity-80">
                              {subtask.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timer with circular progress */}
        <div className="relative">
          {/* SVG circular progress */}
          <svg
            className="w-96 h-96 transform -rotate-90"
            viewBox="0 0 384 384"
          >
            {/* Background circle */}
            <circle
              cx="192"
              cy="192"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />

            {/* Progress circle */}
            <circle
              cx="192"
              cy="192"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={colors.progressStroke}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: circumference - progress * circumference,
                transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
              }}
            />
          </svg>

          {/* Timer display (centered in circle) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-8xl font-mono font-light tracking-wider ${colors.textColor}`}>
              {formatTime(pomodoroState.timeRemaining)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {/* Play/Pause button (primary) */}
          <button
            onClick={() => pomodoroState.isRunning ? pausePomodoro() : startPomodoro()}
            className={`p-4 rounded-full ${colors.textColor} bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 transition-all hover:scale-110`}
            aria-label={pomodoroState.isRunning ? 'Pause' : 'Start'}
            title={pomodoroState.isRunning ? 'Pause (Space)' : 'Start (Space)'}
          >
            {pomodoroState.isRunning ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" />
            )}
          </button>

          {/* Skip button (secondary) */}
          <button
            onClick={skipPomodoro}
            className={`p-3 rounded-full ${colors.textColor} bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all hover:scale-110`}
            aria-label="Skip to next session"
            title="Skip (S)"
          >
            <SkipForward size={24} />
          </button>

          {/* Restart button (tertiary) */}
          <button
            onClick={restartPomodoroSession}
            className={`p-3 rounded-full ${colors.textColor} bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all hover:scale-110`}
            aria-label="Restart session"
            title="Restart (R)"
          >
            <RotateCcw size={24} />
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Space: Pause/Resume • S: Skip • R: Restart • Esc: Close</p>
        </div>
      </div>
    </div>
  );
}
