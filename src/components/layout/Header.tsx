import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Tag, Users, Filter, X, LayoutGrid, BarChart3, History, Download, Upload, Info, Settings, Calendar, BookOpen, Timer, Wrench, Play, Pause, RotateCcw } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import { TagManager } from '../task/TagManager';
import { PeopleManager } from '../task/PeopleManager';
import { SearchBar } from '../filters/SearchBar';
import { Badge } from '../ui/Badge';
import { PersonBadge } from '../ui/PersonBadge';
import { DatePicker } from '../ui/DatePicker';
import { formatTime } from '../../utils/pomodoro';

interface HeaderProps {
  onExport?: () => void;
  onImport?: () => void;
  onAbout?: () => void;
  onHelp?: () => void;
  onSettings?: () => void;
}

export function Header({ onExport, onImport, onAbout, onHelp, onSettings }: HeaderProps) {
  const { theme, toggleTheme, activeView, setActiveView, isPomodoroOpen, pomodoroState, togglePomodoro, pausePomodoro, resumePomodoro, resetPomodoro } = useUIStore();
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isPeopleManagerOpen, setIsPeopleManagerOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [dateRangePreset, setDateRangePreset] = useState<string>('last7days');
  const [isPomodoroHovered, setIsPomodoroHovered] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  const { selectedTags, selectedPeople, showCompleted, completedTasksCutoffDate, showCompletedOnly, completedDateRange, toggleTag, togglePerson, setShowCompleted, setCompletedTasksCutoffDate, setShowCompletedOnly, setCompletedDateRange, clearFilters, searchQuery } =
    useUIStore();
  const tags = useTaskStore((state) => state.tags);
  const people = useTaskStore((state) => state.people);

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedPeople.length > 0 || !showCompleted || showCompletedOnly;
  const filterCount = selectedTags.length +
    selectedPeople.length +
    (searchQuery ? 1 : 0) +
    (showCompleted ? 0 : 1) +
    (showCompletedOnly ? 1 : 0);

  // Helper function to calculate date range based on preset
  const getDateRangeForPreset = (preset: string): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case 'last7days':
        start.setDate(start.getDate() - 7);
        break;
      case 'last30days':
        start.setDate(start.getDate() - 30);
        break;
      case 'last90days':
        start.setDate(start.getDate() - 90);
        break;
      case 'yeartodate':
        start.setMonth(0, 1); // January 1st of current year
        start.setHours(0, 0, 0, 0);
        break;
      case 'alltime':
        start.setFullYear(start.getFullYear() - 10); // 10 years ago
        break;
      default: // custom
        return completedDateRange || { start, end };
    }

    return { start, end };
  };

  // Handle preset selection
  const handlePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    if (preset !== 'custom') {
      const range = getDateRangeForPreset(preset);
      setCompletedDateRange(range);
    }
  };

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };

    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFilterDropdownOpen]);

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSettingsOpen]);

  // Close tools menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };

    if (isToolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isToolsMenuOpen]);

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-shrink-0 relative group">
              {/* Logo + Title */}
              <div className="flex items-center gap-3">
                {/* 4-Quadrant Matrix Logo */}
                <svg
                  className="w-8 h-8 flex-shrink-0"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  {/* Q1: Urgent & Important (top-left, red) */}
                  <rect x="2" y="2" width="12" height="12" rx="2" className="fill-red-500 dark:fill-red-400" />

                  {/* Q2: Not Urgent & Important (top-right, blue) */}
                  <rect x="18" y="2" width="12" height="12" rx="2" className="fill-blue-500 dark:fill-blue-400" />

                  {/* Q3: Urgent & Not Important (bottom-left, amber) */}
                  <rect x="2" y="18" width="12" height="12" rx="2" className="fill-amber-500 dark:fill-amber-400" />

                  {/* Q4: Not Urgent & Not Important (bottom-right, gray) */}
                  <rect x="18" y="18" width="12" height="12" rx="2" className="fill-gray-400 dark:fill-gray-500" />
                </svg>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Focus</h1>
              </div>

              {/* Hover tooltip - shows on hover */}
              <div className="
                absolute top-full left-0 mt-2 z-10
                invisible group-hover:visible
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                rounded-lg shadow-lg p-3
                min-w-[280px]
              ">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Eisenhower Priority Matrix
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  A productivity framework to prioritize tasks by urgency and importance
                </p>
              </div>
            </div>

            {/* Search Bar and Filters */}
            <div className="flex-1 flex items-center gap-2 max-w-2xl">
              <div className="flex-1">
                <SearchBar />
              </div>

              {/* Filter Dropdown Button */}
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={`
                    p-2 rounded-lg transition-colors relative
                    ${
                      isFilterDropdownOpen
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  aria-label="Toggle filters"
                  title="Filters"
                >
                  <Filter size={20} />
                  {filterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                      {filterCount}
                    </span>
                  )}
                </button>

                {/* Filter Dropdown Panel */}
                {isFilterDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-[28rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Filters
                        </h3>
                        {hasActiveFilters && (
                          <button
                            onClick={() => {
                              clearFilters();
                              setIsFilterDropdownOpen(false);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Show Completed Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showCompleted}
                          onChange={(e) => setShowCompleted(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Show completed tasks
                        </span>
                      </label>

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
                                  className={`transition-all ${
                                    isSelected ? 'scale-105' : 'opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  <Badge
                                    color={tag.color}
                                    className={`cursor-pointer ${
                                      isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                                    }`}
                                  >
                                    {tag.name}
                                  </Badge>
                                </button>
                              );
                            })}
                          </div>
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
                                  className={`transition-all ${
                                    isSelected ? 'scale-105' : 'opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  <PersonBadge
                                    color={person.color}
                                    className={`cursor-pointer ${
                                      isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''
                                    }`}
                                  >
                                    {person.name}
                                  </PersonBadge>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Completed Tasks Date Range Filter */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showCompletedOnly}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setShowCompletedOnly(enabled);
                              // Initialize with default range when enabling
                              if (enabled && !completedDateRange) {
                                const range = getDateRangeForPreset(dateRangePreset);
                                setCompletedDateRange(range);
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Show only completed tasks in date range
                          </span>
                        </label>

                        {/* Date Range Pickers */}
                        {showCompletedOnly && (
                          <div className="ml-6 mt-3 space-y-3 animate-fadeIn">
                            {/* Preset Selector */}
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Period
                              </label>
                              <select
                                value={dateRangePreset}
                                onChange={(e) => handlePresetChange(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors cursor-pointer"
                              >
                                <option value="last7days">Last 7 days</option>
                                <option value="last30days">Last 30 days</option>
                                <option value="last90days">Last 90 days</option>
                                <option value="yeartodate">Year to date</option>
                                <option value="alltime">All time</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>

                            {/* Date Pickers (shown for custom or to display current range) */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* Start Date */}
                              <div>
                                <label className="flex items-center gap-1 mb-1">
                                  <Calendar size={12} className="text-gray-400 dark:text-gray-500" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Start date
                                  </span>
                                </label>
                                <DatePicker
                                  value={completedDateRange?.start}
                                  onChange={(date) => {
                                    if (date && completedDateRange) {
                                      setDateRangePreset('custom');
                                      setCompletedDateRange({ ...completedDateRange, start: date });
                                    }
                                  }}
                                  label=""
                                  max={completedDateRange?.end || new Date()}
                                  readOnly={dateRangePreset !== 'custom'}
                                />
                              </div>

                              {/* End Date */}
                              <div>
                                <label className="flex items-center gap-1 mb-1">
                                  <Calendar size={12} className="text-gray-400 dark:text-gray-500" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    End date
                                  </span>
                                </label>
                                <DatePicker
                                  value={completedDateRange?.end}
                                  onChange={(date) => {
                                    if (date && completedDateRange) {
                                      setDateRangePreset('custom');
                                      setCompletedDateRange({ ...completedDateRange, end: date });
                                    }
                                  }}
                                  label=""
                                  max={new Date()}
                                  readOnly={dateRangePreset !== 'custom'}
                                />
                              </div>
                            </div>

                            {/* Helper Text */}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {completedDateRange
                                ? `Showing only completed tasks from ${new Date(completedDateRange.start).toLocaleDateString()} to ${new Date(completedDateRange.end).toLocaleDateString()}`
                                : 'Select a date range to filter completed tasks'}
                            </p>

                            {/* Clear Range Button */}
                            <button
                              onClick={() => {
                                setShowCompletedOnly(false);
                                setCompletedDateRange(null);
                              }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Clear date range filter
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('matrix')}
                  className={`
                    p-1.5 rounded transition-colors
                    ${
                      activeView === 'matrix'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                  aria-label="Matrix view"
                  title="Matrix View"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setActiveView('analytics')}
                  className={`
                    p-1.5 rounded transition-colors
                    ${
                      activeView === 'analytics'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                  aria-label="Analytics view"
                  title="Analytics View"
                >
                  <BarChart3 size={18} />
                </button>
                <button
                  onClick={() => setActiveView('history')}
                  className={`
                    p-1.5 rounded transition-colors
                    ${
                      activeView === 'history'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                  aria-label="History view"
                  title="History View"
                >
                  <History size={18} />
                </button>
              </div>

              {/* Tools Menu */}
              <div className="relative" ref={toolsMenuRef}>
                <button
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Tools"
                  title="Tools"
                >
                  <Wrench size={20} />
                </button>

                {/* Tools Dropdown */}
                {isToolsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          useUIStore.getState().togglePomodoro();
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Timer size={18} />
                        <span>Pomodoro Timer</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pomodoro Countdown (when minimized) */}
              {(pomodoroState.isRunning || pomodoroState.timeRemaining < pomodoroState.totalTime) && !isPomodoroOpen && (() => {
                // Determine background and text colors based on session type
                let bgColor = 'bg-blue-100 dark:bg-blue-900';
                let textColor = 'text-blue-700 dark:text-blue-300';
                let hoverBg = 'hover:bg-blue-200 dark:hover:bg-blue-800';

                if (pomodoroState.sessionType === 'shortBreak') {
                  bgColor = 'bg-green-100 dark:bg-green-900';
                  textColor = 'text-green-700 dark:text-green-300';
                  hoverBg = 'hover:bg-green-200 dark:hover:bg-green-800';
                } else if (pomodoroState.sessionType === 'longBreak') {
                  bgColor = 'bg-purple-100 dark:bg-purple-900';
                  textColor = 'text-purple-700 dark:text-purple-300';
                  hoverBg = 'hover:bg-purple-200 dark:hover:bg-purple-800';
                }

                return (
                  <div
                    className="relative"
                    onMouseEnter={() => setIsPomodoroHovered(true)}
                    onMouseLeave={() => setIsPomodoroHovered(false)}
                  >
                    <button
                      onClick={togglePomodoro}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bgColor} ${textColor} ${hoverBg} transition-all cursor-pointer animate-fadeIn`}
                      aria-label={`Pomodoro timer: ${formatTime(pomodoroState.timeRemaining)} remaining`}
                      title="Click to open timer"
                    >
                      <Timer size={16} className={pomodoroState.isRunning ? 'animate-pulse' : ''} />
                      <span className="text-sm font-mono font-medium">
                        {formatTime(pomodoroState.timeRemaining)}
                      </span>
                    </button>

                    {/* Hover menu */}
                    {isPomodoroHovered && (
                      <div className="absolute top-full pt-1 right-0 z-50 min-w-[120px]">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (pomodoroState.isRunning) {
                                pausePomodoro();
                              } else {
                                resumePomodoro();
                              }
                            }}
                            className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            {pomodoroState.isRunning ? (
                              <>
                                <Pause size={16} />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play size={16} />
                                <span>Resume</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              resetPomodoro();
                            }}
                            className="w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <RotateCcw size={16} />
                            <span>Reset</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Settings Menu */}
              <div className="relative" ref={settingsDropdownRef}>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Settings"
                  title="Settings"
                >
                  <Settings size={20} />
                </button>

                {/* Settings Dropdown */}
                {isSettingsOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-1">
                      {/* Import */}
                      <button
                        onClick={() => {
                          onImport?.();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Upload size={18} />
                        <span>Import Data</span>
                      </button>

                      {/* Export */}
                      <button
                        onClick={() => {
                          onExport?.();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Download size={18} />
                        <span>Export Data</span>
                      </button>

                      {/* Separator */}
                      <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

                      {/* Settings */}
                      <button
                        onClick={() => {
                          onSettings?.();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Settings size={18} />
                        <span>Settings</span>
                      </button>

                      {/* Separator */}
                      <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

                      {/* Tag Manager */}
                      <button
                        onClick={() => {
                          setIsTagManagerOpen(true);
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Tag size={18} />
                        <span>Manage Tags</span>
                      </button>

                      {/* People Manager */}
                      <button
                        onClick={() => {
                          setIsPeopleManagerOpen(true);
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Users size={18} />
                        <span>Manage People</span>
                      </button>

                      {/* Theme Toggle */}
                      <button
                        onClick={() => {
                          toggleTheme();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        <span>Toggle Theme</span>
                      </button>

                      {/* Separator */}
                      <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>

                      {/* Help & Documentation */}
                      <button
                        onClick={() => {
                          onHelp?.();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <BookOpen size={18} />
                        <span>Help & Documentation</span>
                      </button>

                      {/* About */}
                      <button
                        onClick={() => {
                          onAbout?.();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Info size={18} />
                        <span>About</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <TagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
      />

      <PeopleManager
        isOpen={isPeopleManagerOpen}
        onClose={() => setIsPeopleManagerOpen(false)}
      />
    </>
  );
}
