import { Plus, Star, ChevronsDown, ChevronsUp, AlertCircle, Calendar, Users, XCircle } from 'lucide-react';
import type { QuadrantInfo } from '../../types/quadrant';
import type { QuadrantType } from '../../types/task';
import { useUIStore } from '../../store/uiStore';

// Icon mapping for each quadrant
const QUADRANT_ICONS = {
  'urgent-important': AlertCircle,
  'not-urgent-important': Calendar,
  'urgent-not-important': Users,
  'not-urgent-not-important': XCircle,
};

interface QuadrantHeaderProps {
  info: QuadrantInfo;
  taskCount: number;
  onAddTask: () => void;
  taskIdsWithSubtasks: string[];
}

export function QuadrantHeader({ info, taskCount, onAddTask, taskIdsWithSubtasks }: QuadrantHeaderProps) {
  const toggleQuadrantFocus = useUIStore((state) => state.toggleQuadrantFocus);
  const { starredFilterByQuadrant, toggleStarredForQuadrant, collapsedTasks, expandAllInQuadrant, collapseAllInQuadrant } = useUIStore();
  const isStarredFilterActive = starredFilterByQuadrant[info.type];

  // Check if all tasks with subtasks are collapsed
  const allCollapsed = taskIdsWithSubtasks.length > 0 && taskIdsWithSubtasks.every((id) => collapsedTasks.has(id));
  const hasTasksWithSubtasks = taskIdsWithSubtasks.length > 0;

  // Get the icon for this quadrant
  const Icon = QUADRANT_ICONS[info.type as QuadrantType];

  const handleDoubleClick = () => {
    toggleQuadrantFocus(info.type);
  };

  const handleToggleExpandCollapse = () => {
    if (allCollapsed) {
      expandAllInQuadrant(taskIdsWithSubtasks);
    } else {
      collapseAllInQuadrant(taskIdsWithSubtasks);
    }
  };

  return (
    <div className="mb-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onDoubleClick={handleDoubleClick}
      >
        <div className="relative group">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Icon size={18} className="text-gray-600 dark:text-gray-400" />
            {info.title}
          </h2>

          {/* Hover Popover */}
          <div
            className={`
              absolute top-full left-0 mt-2 z-10
              invisible group-hover:visible
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
              ${info.color}
              rounded-lg shadow-lg p-3
              min-w-[250px]
            `}
          >
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{info.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              {info.action} • Double-click to focus
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-2"
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <span className="text-sm text-gray-500 dark:text-gray-400">{taskCount}</span>

          {/* Star filter toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStarredForQuadrant(info.type);
            }}
            tabIndex={-1}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isStarredFilterActive ? 'Show all tasks' : 'Show starred only'}
          >
            <Star
              size={14}
              className={`${
                isStarredFilterActive
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-amber-400'
              }`}
            />
          </button>

          {/* Expand/Collapse all toggle */}
          {hasTasksWithSubtasks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpandCollapse();
              }}
              tabIndex={-1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={allCollapsed ? 'Expand all tasks' : 'Collapse all tasks'}
            >
              {allCollapsed ? (
                <ChevronsDown
                  size={14}
                  className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                />
              ) : (
                <ChevronsUp
                  size={14}
                  className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                />
              )}
            </button>
          )}

          <button
            onClick={onAddTask}
            tabIndex={-1}
            className="p-1 rounded transition-colors text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Add task"
            title="Add task"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
