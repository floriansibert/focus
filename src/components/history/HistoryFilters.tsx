import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { useEventHistoryStore } from '../../store/eventHistoryStore';
import { HistoryActionType } from '../../types/task';

const ACTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  [HistoryActionType.TASK_ADDED]: { label: 'Added', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
  [HistoryActionType.TASK_UPDATED]: { label: 'Updated', color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
  [HistoryActionType.TASK_DELETED]: { label: 'Deleted', color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' },
  [HistoryActionType.TASK_COMPLETED]: { label: 'Completed', color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
  [HistoryActionType.TASK_UNCOMPLETED]: { label: 'Uncompleted', color: 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300' },
  [HistoryActionType.TASK_MOVED]: { label: 'Moved', color: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' },
  [HistoryActionType.TASK_STARRED]: { label: 'Starred', color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' },
  [HistoryActionType.TASK_UNSTARRED]: { label: 'Unstarred', color: 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300' },
  [HistoryActionType.SUBTASK_ADDED]: { label: 'Subtask Added', color: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300' },
};

export function HistoryFilters() {
  const { filters, setSearchQuery, toggleActionType, setDateRange, clearFilters } =
    useEventHistoryStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.searchQuery ||
    filters.actionTypes.length > 0 ||
    filters.dateRange !== 'all';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Filters
          </h3>
          {hasActiveFilters && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
              Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              <X size={14} />
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronDown
              size={18}
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search by task title
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Types */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action types
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ACTION_TYPE_LABELS).map(([type, { label, color }]) => {
                const isSelected = filters.actionTypes.includes(type as any);
                return (
                  <button
                    key={type}
                    onClick={() => toggleActionType(type as any)}
                    className={`
                      px-3 py-1 rounded-full text-xs font-medium transition-all
                      ${color}
                      ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                          : 'opacity-60 hover:opacity-100'
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time period
            </label>
            <div className="flex flex-wrap gap-2">
              {(['today', '7days', '30days', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      filters.dateRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {range === 'today' && 'Today'}
                  {range === '7days' && 'Last 7 Days'}
                  {range === '30days' && 'Last 30 Days'}
                  {range === 'all' && 'All Time'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
