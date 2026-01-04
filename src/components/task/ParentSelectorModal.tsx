import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useTaskStore } from '../../store/taskStore';
import { canHaveSubtasks } from '../../utils/taskHelpers';
import { QUADRANT_INFO } from '../../types/quadrant';
import { QuadrantType, TaskType } from '../../types/task';

interface ParentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtaskId: string;
  currentParentId: string;
  onSelectParent: (newParentId: string) => void;
}

export function ParentSelectorModal({
  isOpen,
  onClose,
  subtaskId,
  currentParentId,
  onSelectParent,
}: ParentSelectorModalProps) {
  const { tasks } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter valid parent candidates
  const validParents = useMemo(() => {
    return tasks.filter((task) => {
      // Exclude current parent
      if (task.id === currentParentId) return false;

      // Exclude the subtask itself
      if (task.id === subtaskId) return false;

      // Exclude tasks that can't have subtasks
      if (!canHaveSubtasks(task)) return false;

      // Exclude other subtasks
      if (task.taskType === TaskType.SUBTASK) return false;

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query);
        return matchesTitle || matchesDescription;
      }

      return true;
    });
  }, [tasks, currentParentId, subtaskId, searchQuery]);

  // Group by quadrant
  const tasksByQuadrant = useMemo(() => {
    const groups: Record<string, typeof validParents> = {
      [QuadrantType.URGENT_IMPORTANT]: [],
      [QuadrantType.NOT_URGENT_IMPORTANT]: [],
      [QuadrantType.URGENT_NOT_IMPORTANT]: [],
      [QuadrantType.NOT_URGENT_NOT_IMPORTANT]: [],
    };

    validParents.forEach((task) => {
      groups[task.quadrant].push(task);
    });

    return groups;
  }, [validParents]);

  const handleSelect = (taskId: string) => {
    onSelectParent(taskId);
    setSearchQuery('');
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Parent Task"
      size="lg"
      footer={
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Task list grouped by quadrant */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {validParents.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No compatible parent tasks found
            </div>
          ) : (
            Object.entries(tasksByQuadrant).map(([quadrant, quadrantTasks]) => {
              if (quadrantTasks.length === 0) return null;

              const quadrantInfo = QUADRANT_INFO[quadrant as QuadrantType];

              return (
                <div key={quadrant}>
                  {/* Quadrant header */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge color={quadrantInfo.color} size="sm">
                      {quadrantInfo.title}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {quadrantTasks.length} {quadrantTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>

                  {/* Task list */}
                  <div className="space-y-2">
                    {quadrantTasks.map((task) => {
                      const subtaskCount = tasks.filter(
                        (t) => t.parentTaskId === task.id && t.taskType === TaskType.SUBTASK
                      ).length;

                      return (
                        <button
                          key={task.id}
                          onClick={() => handleSelect(task.id)}
                          className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700
                                   hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50
                                   transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Title */}
                              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {task.title}
                              </div>

                              {/* Description (if exists) */}
                              {task.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                                  {task.description}
                                </div>
                              )}

                              {/* Tags and metadata */}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {task.tags.length > 0 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {task.tags.length} {task.tags.length === 1 ? 'tag' : 'tags'}
                                  </span>
                                )}
                                {subtaskCount > 0 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {subtaskCount} {subtaskCount === 1 ? 'subtask' : 'subtasks'}
                                  </span>
                                )}
                                {task.completed && (
                                  <Badge color="#10B981" size="sm">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Select indicator */}
                            <div className="text-sm text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                              Select →
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
