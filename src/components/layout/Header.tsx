import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Tag, Users, Filter, X, LayoutGrid, BarChart3, History, Download, Upload, Info, Settings, Calendar, BookOpen, Timer, Wrench, Play, Pause, RotateCcw, Repeat } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import { TagManager } from '../task/TagManager';
import { PeopleManager } from '../task/PeopleManager';
import { SearchBar } from '../filters/SearchBar';
import { Badge } from '../ui/Badge';
import { PersonBadge } from '../ui/PersonBadge';
import { DatePicker } from '../ui/DatePicker';
import { formatTime } from '../../utils/pomodoro';
import { ViewMode } from '../../types/task';
import { calculateCompletedViewDateRange, formatCompletedViewTimeframe } from '../../utils/date';

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
  const [isPomodoroHovered, setIsPomodoroHovered] = useState(false);
  const [isTodayViewDropdownOpen, setIsTodayViewDropdownOpen] = useState(false);
  const [isCustomPeriodEnabled, setIsCustomPeriodEnabled] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const todayViewDropdownRef = useRef<HTMLDivElement>(null);

  const { selectedTags, selectedPeople, showCompleted, completedTasksCutoffDate, completedDateRange, completedLookbackDays, toggleTag, togglePerson, setShowCompleted, setCompletedTasksCutoffDate, setCompletedDateRange, setCompletedLookbackDays, clearFilters, searchQuery, activeFilterMode, todayViewDaysAhead, todayViewComponents, completedViewTimeframe, completedViewCustomRange, setActiveFilterMode, setTodayViewDaysAhead, toggleTodayViewComponent, setCompletedViewTimeframe, setCompletedViewCustomRange } =
    useUIStore();
  const tags = useTaskStore((state) => state.tags);
  const people = useTaskStore((state) => state.people);

  const hasActiveFilters = searchQuery || selectedTags.length > 0 || selectedPeople.length > 0 || !showCompleted || activeFilterMode !== null;
  const filterCount = selectedTags.length +
    selectedPeople.length +
    (searchQuery ? 1 : 0) +
    (showCompleted ? 0 : 1) +
    (activeFilterMode !== null ? 1 : 0);

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

  // Close today's view dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (todayViewDropdownRef.current && !todayViewDropdownRef.current.contains(event.target as Node)) {
        setIsTodayViewDropdownOpen(false);
      }
    };

    if (isTodayViewDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isTodayViewDropdownOpen]);

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

              {/* Filter Mode Button (Today / Completed) */}
              <div className="relative" ref={todayViewDropdownRef}>
                <button
                  onClick={() => setIsTodayViewDropdownOpen(!isTodayViewDropdownOpen)}
                  className={`
                    px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium whitespace-nowrap
                    ${
                      activeFilterMode !== null
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                  aria-label="Filter view mode"
                  title={
                    activeFilterMode === ViewMode.TODAY
                      ? "Today's view - Quick access to overdue, due soon, and starred tasks"
                      : activeFilterMode === ViewMode.COMPLETED
                      ? "Completed view - Review tasks accomplished in a timeframe"
                      : "Filter view modes"
                  }
                >
                  <Calendar size={18} />
                  {activeFilterMode === ViewMode.TODAY && <span>Today</span>}
                  {activeFilterMode === ViewMode.COMPLETED && <span>Completed</span>}
                  {activeFilterMode === null && <span>Plan</span>}

                  {activeFilterMode === ViewMode.TODAY && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                      {todayViewDaysAhead === null ? '∞' : `${todayViewDaysAhead}d`}
                    </span>
                  )}
                  {activeFilterMode === ViewMode.COMPLETED && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                      {formatCompletedViewTimeframe(completedViewTimeframe).replace(' ', '')}
                    </span>
                  )}
                </button>

                {/* Filter Mode Dropdown Panel */}
                {isTodayViewDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-[38rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <div className="p-4 space-y-4">
                      {/* Mode Selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select View Mode
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setActiveFilterMode(null)}
                            className={`
                              px-3 py-2 text-sm rounded transition-colors
                              ${
                                activeFilterMode === null
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            Plan
                          </button>
                          <button
                            onClick={() => setActiveFilterMode(ViewMode.TODAY)}
                            className={`
                              px-3 py-2 text-sm rounded transition-colors
                              ${
                                activeFilterMode === ViewMode.TODAY
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            Today
                          </button>
                          <button
                            onClick={() => setActiveFilterMode(ViewMode.COMPLETED)}
                            className={`
                              px-3 py-2 text-sm rounded transition-colors
                              ${
                                activeFilterMode === ViewMode.COMPLETED
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            Completed
                          </button>
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="border-t border-gray-200 dark:border-gray-700"></div>

                      {/* Today Mode Configuration */}
                      {activeFilterMode === ViewMode.TODAY && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                              Show tasks that are:
                            </label>

                            <div className="space-y-2 ml-2">
                              {/* Overdue Component */}
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={todayViewComponents.showOverdue}
                                  onChange={() => toggleTodayViewComponent('showOverdue')}
                                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  Overdue (past due date)
                                </span>
                              </label>

                              {/* Due Soon Component */}
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={todayViewComponents.showDueSoon}
                                  onChange={() => toggleTodayViewComponent('showDueSoon')}
                                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 cursor-pointer"
                                />
                                <div className="flex-1">
                                  <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Due soon ({todayViewDaysAhead === 0
                                      ? 'today only'
                                      : todayViewDaysAhead === 1
                                        ? 'today or tomorrow'
                                        : todayViewDaysAhead === null
                                          ? 'any time'
                                          : `today or within ${todayViewDaysAhead} days`})
                                  </span>
                                </div>
                              </label>

                              {/* Starred Component */}
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={todayViewComponents.showStarred}
                                  onChange={() => toggleTodayViewComponent('showStarred')}
                                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  Starred (all starred tasks)
                                </span>
                              </label>
                            </div>
                          </div>

                          {/* Days Ahead Selector */}
                          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                              Look ahead
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                              {[0, 1, 3, 7, 14, 30].map((days) => (
                                <button
                                  key={days}
                                  onClick={() => setTodayViewDaysAhead(days)}
                                  className={`
                                    px-2 py-1.5 text-xs rounded transition-colors
                                    ${
                                      todayViewDaysAhead === days
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }
                                  `}
                                >
                                  {days}d
                                </button>
                              ))}
                              {/* Infinity button */}
                              <button
                                onClick={() => setTodayViewDaysAhead(null)}
                                className={`
                                  px-2 py-1.5 text-xs rounded transition-colors
                                  ${
                                    todayViewDaysAhead === null
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  }
                                `}
                              >
                                ∞
                              </button>
                            </div>
                          </div>

                          {/* Helper Text */}
                          <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
                            Tasks matching any enabled component will be shown.
                          </div>
                        </>
                      )}

                      {/* Completed Mode Configuration */}
                      {activeFilterMode === ViewMode.COMPLETED && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                              Timeframe
                            </label>

                            {/* Timeframe selector buttons */}
                            <div className="space-y-2">
                              {/* Row 1: Today, Yesterday */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => {
                                    setCompletedViewTimeframe('today');
                                    const range = calculateCompletedViewDateRange('today', null);
                                    setCompletedDateRange(range);
                                    setIsCustomPeriodEnabled(false);
                                  }}
                                  className={`
                                    px-3 py-2 text-sm rounded transition-colors
                                    ${
                                      completedViewTimeframe === 'today'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }
                                  `}
                                >
                                  Today
                                </button>
                                <button
                                  onClick={() => {
                                    setCompletedViewTimeframe('yesterday');
                                    const range = calculateCompletedViewDateRange('yesterday', null);
                                    setCompletedDateRange(range);
                                    setIsCustomPeriodEnabled(false);
                                  }}
                                  className={`
                                    px-3 py-2 text-sm rounded transition-colors
                                    ${
                                      completedViewTimeframe === 'yesterday'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }
                                  `}
                                >
                                  Yesterday
                                </button>
                              </div>

                              {/* Row 2: This Week, Last Week */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => {
                                    setCompletedViewTimeframe('thisweek');
                                    const range = calculateCompletedViewDateRange('thisweek', null);
                                    setCompletedDateRange(range);
                                    setIsCustomPeriodEnabled(false);
                                  }}
                                  className={`
                                    px-3 py-2 text-sm rounded transition-colors
                                    ${
                                      completedViewTimeframe === 'thisweek'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }
                                  `}
                                >
                                  This Week
                                </button>
                                <button
                                  onClick={() => {
                                    setCompletedViewTimeframe('lastweek');
                                    const range = calculateCompletedViewDateRange('lastweek', null);
                                    setCompletedDateRange(range);
                                    setIsCustomPeriodEnabled(false);
                                  }}
                                  className={`
                                    px-3 py-2 text-sm rounded transition-colors
                                    ${
                                      completedViewTimeframe === 'lastweek'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }
                                  `}
                                >
                                  Last Week
                                </button>
                              </div>

                              {/* Row 3: This Month, Last Month */}
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => {
                                    setCompletedViewTimeframe('thismonth');
                                    const range = calculateCompletedViewDateRange('thismonth', null);
                                    setCompletedDateRange(range);
                                    setIsCustomPeriodEnabled(false);
                                  }}
                                  className={`
                                    px-3 py-2 text-sm rounded transition-colors
                                    ${
                                      completedViewTimeframe === 'thismonth'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }
                                  `}
                                >
                                  This Month
                                </button>
                                <button
                                  onClick={() => {
                                    setCompletedViewTimeframe('lastmonth');
                                    const range = calculateCompletedViewDateRange('lastmonth', null);
                                    setCompletedDateRange(range);
                                    setIsCustomPeriodEnabled(false);
                                  }}
                                  className={`
                                    px-3 py-2 text-sm rounded transition-colors
                                    ${
                                      completedViewTimeframe === 'lastmonth'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }
                                  `}
                                >
                                  Last Month
                                </button>
                              </div>

                              {/* Row 4: Custom */}
                              <div className="grid grid-cols-1 gap-2">
                                <button
                                  onClick={() => {
                                    setCompletedViewTimeframe('custom');
                                    setIsCustomPeriodEnabled(true);
                                    // Use existing custom range or default to last week
                                    const range = completedViewCustomRange || calculateCompletedViewDateRange('lastweek', null);
                                    setCompletedDateRange(range);
                                    if (!completedViewCustomRange) {
                                      setCompletedViewCustomRange(range);
                                    }
                                  }}
                                  className={`
                                    px-3 py-2 text-sm rounded transition-colors
                                    ${
                                      completedViewTimeframe === 'custom'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }
                                  `}
                                >
                                  Custom
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Custom Date Range */}
                          {isCustomPeriodEnabled && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                  <label className="flex items-center gap-1 mb-1">
                                    <Calendar size={12} className="text-gray-400 dark:text-gray-500" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      Start
                                    </span>
                                  </label>
                                  <DatePicker
                                    value={completedViewCustomRange?.start || completedDateRange?.start}
                                    onChange={(date) => {
                                      if (date && (completedViewCustomRange?.end || completedDateRange?.end)) {
                                        const newRange = {
                                          start: date,
                                          end: completedViewCustomRange?.end || completedDateRange!.end
                                        };
                                        setCompletedViewTimeframe('custom');
                                        setCompletedViewCustomRange(newRange);
                                      }
                                    }}
                                    label=""
                                    max={completedViewCustomRange?.end || completedDateRange?.end || new Date()}
                                  />
                                </div>

                                <div>
                                  <label className="flex items-center gap-1 mb-1">
                                    <Calendar size={12} className="text-gray-400 dark:text-gray-500" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      End
                                    </span>
                                  </label>
                                  <DatePicker
                                    value={completedViewCustomRange?.end || completedDateRange?.end}
                                    onChange={(date) => {
                                      if (date && (completedViewCustomRange?.start || completedDateRange?.start)) {
                                        const newRange = {
                                          start: completedViewCustomRange?.start || completedDateRange!.start,
                                          end: date
                                        };
                                        setCompletedViewTimeframe('custom');
                                        setCompletedViewCustomRange(newRange);
                                      }
                                    }}
                                    label=""
                                    max={new Date()}
                                    min={completedViewCustomRange?.start || completedDateRange?.start}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Current Range Display */}
                          {completedDateRange && (
                            <div className="pt-2 text-xs text-gray-500 dark:text-gray-400">
                              Showing tasks completed from {new Date(completedDateRange.start).toLocaleDateString()} to {new Date(completedDateRange.end).toLocaleDateString()}
                            </div>
                          )}

                          {/* Helper Text */}
                          <div className="pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                            Shows tasks completed within the selected timeframe. Parent tasks display only subtasks completed in this period.
                          </div>
                        </>
                      )}

                      {/* No Mode Selected State */}
                      {activeFilterMode === null && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                          Select a view mode above to configure filters
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                  <div className="absolute right-0 mt-2 w-[40rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
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

                      {/* Tag Filters */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Filter by tags
                        </label>
                        {tags.length > 0 ? (
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
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            No tags yet. Create tags when adding or editing tasks.
                          </p>
                        )}
                      </div>

                      {/* People Filters */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Filter by people
                        </label>
                        {people.length > 0 ? (
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
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            No people yet. Create people when adding or editing tasks.
                          </p>
                        )}
                      </div>

                      {/* Separator */}
                      <div className="border-t border-gray-200 dark:border-gray-700"></div>

                      {/* Include Completed Tasks Selector */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Include completed tasks
                        </label>

                        {/* Days Selector Grid */}
                        <div className="grid grid-cols-6 gap-2">
                          {/* 0 days - hide all completed */}
                          <button
                            onClick={() => setCompletedLookbackDays(0)}
                            className={`
                              px-2 py-1.5 text-sm rounded transition-colors
                              ${
                                completedLookbackDays === 0
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            0d
                          </button>

                          {/* 1 day */}
                          <button
                            onClick={() => setCompletedLookbackDays(1)}
                            className={`
                              px-2 py-1.5 text-sm rounded transition-colors
                              ${
                                completedLookbackDays === 1
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            1d
                          </button>

                          {/* 2 days */}
                          <button
                            onClick={() => setCompletedLookbackDays(2)}
                            className={`
                              px-2 py-1.5 text-sm rounded transition-colors
                              ${
                                completedLookbackDays === 2
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            2d
                          </button>

                          {/* 1 week (7 days) */}
                          <button
                            onClick={() => setCompletedLookbackDays(7)}
                            className={`
                              px-2 py-1.5 text-sm rounded transition-colors
                              ${
                                completedLookbackDays === 7
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            1w
                          </button>

                          {/* 1 month (30 days) */}
                          <button
                            onClick={() => setCompletedLookbackDays(30)}
                            className={`
                              px-2 py-1.5 text-sm rounded transition-colors
                              ${
                                completedLookbackDays === 30
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            1mo
                          </button>

                          {/* Forever (null) */}
                          <button
                            onClick={() => setCompletedLookbackDays(null)}
                            className={`
                              px-2 py-1.5 text-sm rounded transition-colors
                              ${
                                completedLookbackDays === null
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }
                            `}
                          >
                            ∞
                          </button>
                        </div>

                        {/* Reference Date Display */}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {completedLookbackDays === 0
                            ? 'Not showing completed tasks'
                            : completedLookbackDays === null
                            ? 'Showing all completed tasks'
                            : completedTasksCutoffDate
                            ? `Since ${completedTasksCutoffDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: completedTasksCutoffDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                              })}`
                            : 'Loading...'}
                        </p>
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
                <button
                  onClick={() => setActiveView('templates')}
                  className={`
                    p-1.5 rounded transition-colors
                    ${
                      activeView === 'templates'
                        ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                  aria-label="Templates view"
                  title="Templates View"
                >
                  <Repeat size={18} />
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
