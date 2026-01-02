import React from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X as XIcon,
  ArrowRight,
  Star,
  CornerDownRight,
  Link,
} from 'lucide-react';
import type { HistoryEntry } from '../../types/task';
import { TaskType } from '../../types/task';
import { QUADRANT_INFO } from '../../types/quadrant';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';

interface HistoryEventRowProps {
  event: HistoryEntry;
  onTaskClick: (taskId: string) => void;
}

const ACTION_ICONS: Record<string, React.ComponentType> = {
  task_added: Plus,
  task_updated: Edit2,
  task_deleted: Trash2,
  task_completed: Check,
  task_uncompleted: XIcon,
  task_moved: ArrowRight,
  task_starred: Star,
  task_unstarred: Star,
  subtask_added: CornerDownRight,
};

const ACTION_COLORS: Record<string, string> = {
  task_added: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  task_updated: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  task_deleted: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  task_completed: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
  task_uncompleted: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
  task_moved: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  task_starred: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
  task_unstarred: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20',
  subtask_added: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20',
};

export function HistoryEventRow({ event, onTaskClick }: HistoryEventRowProps) {
  const Icon = ACTION_ICONS[event.action] || Edit2;
  const colorClass = ACTION_COLORS[event.action] || ACTION_COLORS.task_updated;
  const tags = useTaskStore((state) => state.tags);
  const people = useTaskStore((state) => state.people);
  const tasks = useTaskStore((state) => state.tasks);
  const task = tasks.find((t) => t.id === event.taskId);
  const isRecurringInstance = task && task.taskType === TaskType.RECURRING_INSTANCE;

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatValue = (value: unknown, fieldName?: string): string => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      if (value.length === 0) return '(empty)';

      // Convert tag IDs to names
      if (fieldName === 'tags') {
        return value
          .map((id) => tags.find((t) => t.id === id)?.name || id)
          .join(', ');
      }

      // Convert people IDs to names
      if (fieldName === 'people') {
        return value
          .map((id) => people.find((p) => p.id === id)?.name || id)
          .join(', ');
      }

      return value.join(', ');
    }
    if (value instanceof Date) return new Date(value).toLocaleDateString();
    if (typeof value === 'object') {
      // Handle recurrence config and other objects
      return JSON.stringify(value);
    }
    return String(value);
  };

  const renderChangeDetails = () => {
    if (!event.changes || event.changes.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {event.changes.map((change, idx) => (
          <div
            key={idx}
            className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-2"
          >
            <span className="text-gray-600 dark:text-gray-400 font-semibold">
              {change.field}:
            </span>{' '}
            <span className="text-red-600 dark:text-red-400 line-through">
              {formatValue(change.oldValue, change.field)}
            </span>{' '}
            →{' '}
            <span className="text-green-600 dark:text-green-400">
              {formatValue(change.newValue, change.field)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const getActionLabel = () => {
    switch (event.action) {
      case 'task_added':
        return 'Task added';
      case 'task_updated':
        return `Task updated (${event.changes?.length || 0} changes)`;
      case 'task_deleted':
        return 'Task deleted';
      case 'task_completed':
        return 'Task completed';
      case 'task_uncompleted':
        return 'Task marked incomplete';
      case 'task_moved':
        if (event.fromQuadrant && event.toQuadrant) {
          const fromTitle = QUADRANT_INFO[event.fromQuadrant]?.title || event.fromQuadrant;
          const toTitle = QUADRANT_INFO[event.toQuadrant]?.title || event.toQuadrant;
          return `Moved from ${fromTitle} to ${toTitle}`;
        }
        return 'Task moved';
      case 'task_starred':
        return 'Task starred';
      case 'task_unstarred':
        return 'Task unstarred';
      case 'subtask_added':
        return 'Subtask added';
      default:
        return 'Unknown action';
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}
        >
          <Icon size={16} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with Task Title */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(event.timestamp)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-600">•</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {getActionLabel()}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-600">•</span>
            <button
              onClick={() => !event.isDeleted && onTaskClick(event.taskId)}
              disabled={event.isDeleted}
              className={`
                text-sm font-medium text-left
                ${
                  event.isDeleted
                    ? 'text-gray-400 dark:text-gray-600 line-through cursor-not-allowed'
                    : 'text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer'
                }
              `}
            >
              {event.taskTitle}
              {event.isDeleted && (
                <span className="ml-2 text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                  Deleted
                </span>
              )}
              {!event.isDeleted && isRecurringInstance && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const { setActiveView } = useUIStore.getState();
                    setActiveView('templates');
                  }}
                  className="ml-2 inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  title="Created from template (click to view)"
                >
                  <Link size={10} />
                  Template
                </button>
              )}
            </button>
          </div>

          {/* Change Details */}
          {renderChangeDetails()}
        </div>
      </div>
    </div>
  );
}
