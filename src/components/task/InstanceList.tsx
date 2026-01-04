import { Check } from 'lucide-react';
import type { Task } from '../../types/task';
import { useTaskStore } from '../../store/taskStore';

interface InstanceListProps {
  templateId: string;
  onInstanceClick?: (instance: Task) => void;
}

export function InstanceList({ templateId, onInstanceClick }: InstanceListProps) {
  const { getInstances } = useTaskStore();
  const instances = getInstances(templateId);

  return (
    <div className="space-y-2">
      {instances.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No instances generated yet. Instances will be created automatically based on the recurrence pattern.
        </p>
      )}

      {instances.map((instance) => (
        <div
          key={instance.id}
          className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 group hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          {/* Checkbox */}
          <div className="flex-shrink-0">
            <div
              className={`
                w-4 h-4 rounded border-2 flex items-center justify-center
                transition-colors
                ${
                  instance.completed
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 dark:border-gray-600'
                }
              `}
            >
              {instance.completed && <Check size={12} className="text-white" />}
            </div>
          </div>

          {/* Title and Date */}
          <button
            onClick={() => onInstanceClick?.(instance)}
            tabIndex={-1}
            className="flex-1 flex flex-col items-start text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <span
              className={`
                text-sm
                ${instance.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}
              `}
            >
              {instance.title}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Created {new Date(instance.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {instance.dueDate && (
                <>
                  {' • Due '}
                  {new Date(instance.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </>
              )}
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
