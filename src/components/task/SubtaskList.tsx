import { useState } from 'react';
import { Check, Trash2, Plus } from 'lucide-react';
import type { Task } from '../../types/task';
import { useTaskStore } from '../../store/taskStore';

interface SubtaskListProps {
  parentTaskId: string;
  onSubtaskClick?: (subtask: Task) => void;
}

export function SubtaskList({ parentTaskId, onSubtaskClick }: SubtaskListProps) {
  const { getSubtasks, addSubtask, toggleComplete, deleteTask } = useTaskStore();
  const subtasks = getSubtasks(parentTaskId);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    if (newTitle.trim()) {
      addSubtask(parentTaskId, {
        title: newTitle.trim(),
        completed: false,
        isRecurring: false,
        tags: [],
        people: [],
        order: 0,
      });
      setNewTitle('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'Escape') {
      setNewTitle('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      {subtasks.length === 0 && !isAdding && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No subtasks yet. Click "+ Add Subtask" to create one.
        </p>
      )}

      {subtasks.map((subtask) => (
        <div
          key={subtask.id}
          className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 group hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleComplete(subtask.id);
            }}
            className="flex-shrink-0"
          >
            <div
              className={`
                w-4 h-4 rounded border-2 flex items-center justify-center
                transition-colors
                ${
                  subtask.completed
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                }
              `}
            >
              {subtask.completed && <Check size={12} className="text-white" />}
            </div>
          </button>

          {/* Title */}
          <button
            onClick={() => onSubtaskClick?.(subtask)}
            className={`
              flex-1 text-left text-sm
              ${subtask.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}
              hover:text-blue-600 dark:hover:text-blue-400
              transition-colors
            `}
          >
            {subtask.title}
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete subtask "${subtask.title}"?`)) {
                deleteTask(subtask.id);
              }
            }}
            className="flex-shrink-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Delete subtask"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {/* Add New Subtask */}
      {isAdding ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newTitle.trim()) {
                setIsAdding(false);
              }
            }}
            placeholder="Subtask title..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleAdd}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => {
              setNewTitle('');
              setIsAdding(false);
            }}
            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Plus size={16} />
          Add Subtask
        </button>
      )}
    </div>
  );
}
