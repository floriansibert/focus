import { Filter, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import { Badge } from '../ui/Badge';
import { PersonBadge } from '../ui/PersonBadge';
import { DatePicker } from '../ui/DatePicker';

export function FilterPanel() {
  // Date-based filtering for completed tasks
  const {
    selectedTags,
    selectedPeople,
    showCompleted,
    completedTasksCutoffDate,
    toggleTag,
    togglePerson,
    setShowCompleted,
    setCompletedTasksCutoffDate,
    clearFilters,
    searchQuery,
    filtersExpanded,
    toggleFilters,
  } = useUIStore();
  const tags = useTaskStore((state) => state.tags);
  const people = useTaskStore((state) => state.people);

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedPeople.length > 0 || !showCompleted ||
    (showCompleted && completedTasksCutoffDate !== null);
  const filterCount = selectedTags.length +
    selectedPeople.length +
    (searchQuery ? 1 : 0) +
    (showCompleted ? 0 : 1) +
    (showCompleted && completedTasksCutoffDate !== null ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto">
        {/* Filter Header (Always Visible) */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={toggleFilters}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <Filter size={18} className="text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filters
              {filterCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  {filterCount}
                </span>
              )}
            </h3>
            {filtersExpanded ? (
              <ChevronUp size={18} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="
                flex items-center gap-1 px-2 py-1 text-xs
                text-gray-600 dark:text-gray-400
                hover:text-red-600 dark:hover:text-red-400
                transition-colors
              "
            >
              <X size={14} />
              Clear all
            </button>
          )}
        </div>

        {/* Collapsible Filter Content */}
        {filtersExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            {/* Show Completed Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="
                  w-4 h-4 rounded border-gray-300 dark:border-gray-600
                  text-blue-600 focus:ring-2 focus:ring-blue-500
                  dark:bg-gray-700 cursor-pointer
                "
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Show completed tasks
              </span>
            </label>

            {/* TEST ELEMENT */}
            <div className="ml-6 p-2 bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100">
              TEST: If you see this, the file is loading
            </div>

            {/* Completed Tasks Date Filter */}
            {showCompleted && (
              <div className="ml-6 space-y-2 animate-fadeIn">
                <label className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Hide completed before:
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <DatePicker
                    value={completedTasksCutoffDate || undefined}
                    onChange={(date) => setCompletedTasksCutoffDate(date ?? null)}
                    label=""
                    max={new Date()}
                  />
                  {completedTasksCutoffDate && (
                    <button
                      onClick={() => setCompletedTasksCutoffDate(null)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      title="Show all completed tasks"
                    >
                      Show all
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {completedTasksCutoffDate
                    ? `Showing completed tasks from ${new Date(completedTasksCutoffDate).toLocaleDateString()} onwards`
                    : 'Showing all completed tasks'}
                </p>
              </div>
            )}

            {/* Tag Filters */}
            {tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {[...tags].sort((a, b) => a.name.localeCompare(b.name)).map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`
                          transition-all
                          ${isSelected ? 'scale-105' : 'opacity-60 hover:opacity-100'}
                        `}
                      >
                        <Badge
                          color={tag.color}
                          className={`
                            cursor-pointer
                            ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                          `}
                        >
                          {tag.name}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {selectedTags.length === 0
                    ? 'Click tags to filter (shows tasks with ANY selected tag)'
                    : `Showing tasks with: ${tags
                        .filter((t) => selectedTags.includes(t.id))
                        .map((t) => t.name)
                        .join(', ')}`}
                </p>
              </div>
            )}

            {/* People Filters */}
            {people.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by people
                </label>
                <div className="flex flex-wrap gap-2">
                  {[...people].sort((a, b) => a.name.localeCompare(b.name)).map((person) => {
                    const isSelected = selectedPeople.includes(person.id);
                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => togglePerson(person.id)}
                        className={`
                          transition-all
                          ${isSelected ? 'scale-105' : 'opacity-60 hover:opacity-100'}
                        `}
                      >
                        <PersonBadge
                          color={person.color}
                          className={`
                            cursor-pointer
                            ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''}
                          `}
                        >
                          {person.name}
                        </PersonBadge>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {selectedPeople.length === 0
                    ? 'Click people to filter (shows tasks assigned to ANY selected person)'
                    : `Showing tasks assigned to: ${people
                        .filter((p) => selectedPeople.includes(p.id))
                        .map((p) => p.name)
                        .join(', ')}`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
