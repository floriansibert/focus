import { useEffect, useState, useRef } from 'react';
import { History, Trash2, HardDrive, Database, ChevronDown } from 'lucide-react';
import { useEventHistoryStore } from '../../store/eventHistoryStore';
import { useTaskStore } from '../../store/taskStore';
import { HistoryFilters } from './HistoryFilters';
import { HistoryTimeline } from './HistoryTimeline';
import { DataOperationCard } from './DataOperationCard';
import { EmptyState } from '../ui/EmptyState';
import { TaskSidePanel } from '../task/TaskSidePanel';
import { db } from '../../lib/db';
import { dataOperationLogger } from '../../lib/dataOperationLogger';
import toast from 'react-hot-toast';
import type { Task, DataOperation } from '../../types/task';

interface DatabaseStats {
  tasks: number;
  tags: number;
  people: number;
  history: number;
  dataOperations: number;
  totalSize: string;
}

export function HistoryDashboard() {
  const { loadEvents, isLoading, getEventsByDate, getFilteredEvents, events } = useEventHistoryStore();
  const { tasks, updateTask, deleteAllTasks, deleteAllTags, deleteAllPeople } = useTaskStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [dataOperations, setDataOperations] = useState<DataOperation[]>([]);
  const [operationsLimit, setOperationsLimit] = useState(10);
  const [hasMoreOperations, setHasMoreOperations] = useState(false);
  const [showClearOperationsConfirm, setShowClearOperationsConfirm] = useState(false);
  const [isClearDropdownOpen, setIsClearDropdownOpen] = useState(false);
  const [clearMode, setClearMode] = useState<'all' | '7days' | '30days' | '90days' | null>(null);
  const [eventsToDeleteCount, setEventsToDeleteCount] = useState<number>(0);
  const [showDeleteTasksConfirm, setShowDeleteTasksConfirm] = useState(false);
  const [showDeleteTagsConfirm, setShowDeleteTagsConfirm] = useState(false);
  const [showDeletePeopleConfirm, setShowDeletePeopleConfirm] = useState(false);
  const clearHistoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Always load fresh events when the History view is opened
    loadEvents();
    loadDbStats();
    loadDataOperations();
  }, [loadEvents, operationsLimit]);

  // Click-outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clearHistoryDropdownRef.current && !clearHistoryDropdownRef.current.contains(event.target as Node)) {
        setIsClearDropdownOpen(false);
      }
    };

    if (isClearDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isClearDropdownOpen]);

  const loadDataOperations = async () => {
    try {
      // Load one extra to check if there are more
      const operations = await dataOperationLogger.getRecentOperations(operationsLimit + 1);

      if (operations.length > operationsLimit) {
        setHasMoreOperations(true);
        setDataOperations(operations.slice(0, operationsLimit));
      } else {
        setHasMoreOperations(false);
        setDataOperations(operations);
      }
    } catch (error) {
      console.error('Error loading data operations:', error);
    }
  };

  const handleLoadMoreOperations = () => {
    setOperationsLimit(prev => prev + 10);
  };

  const handleClearOperations = async () => {
    try {
      // Get all operations
      const allOperations = await dataOperationLogger.getAllOperations();

      // Find the most recent import
      const mostRecentImport = allOperations.find(op => op.operationType === 'import');

      // Clear all operations
      await db.dataOperations.clear();

      // Restore the most recent import if it exists
      if (mostRecentImport && mostRecentImport.id) {
        const { id, ...importWithoutId } = mostRecentImport;
        await db.dataOperations.add(importWithoutId);
      }

      // Reload operations and stats
      await loadDataOperations();
      await loadDbStats();

      toast.success('Operations cleared (kept most recent import)');
      setShowClearOperationsConfirm(false);
    } catch (error) {
      console.error('Error clearing operations:', error);
      toast.error('Failed to clear operations');
    }
  };

  const loadDbStats = async () => {
    try {
      const [taskCount, tagCount, peopleCount, historyCount, operationsCount] = await Promise.all([
        db.tasks.count(),
        db.tags.count(),
        db.people.count(),
        db.history.count(),
        db.dataOperations.count(),
      ]);

      // Estimate sizes (rough approximation)
      const taskSize = taskCount * 1.0; // ~1 KB per task (with subtasks, recurrence, etc.)
      const tagSize = tagCount * 0.1; // ~0.1 KB per tag
      const peopleSize = peopleCount * 0.1; // ~0.1 KB per person
      const historySize = historyCount * 0.5; // ~0.5 KB per history event
      const operationsSize = operationsCount * 0.3; // ~0.3 KB per operation

      const totalKB = taskSize + tagSize + peopleSize + historySize + operationsSize;
      const totalSize = totalKB < 1024
        ? `${totalKB.toFixed(1)} KB`
        : `${(totalKB / 1024).toFixed(2)} MB`;

      setDbStats({
        tasks: taskCount,
        tags: tagCount,
        people: peopleCount,
        history: historyCount,
        dataOperations: operationsCount,
        totalSize,
      });
    } catch (error) {
      console.error('Error loading database stats:', error);
    }
  };

  const eventsByDate = getEventsByDate();
  const filteredEvents = getFilteredEvents();
  const hasEvents = filteredEvents.length > 0;

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : undefined;

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleClosePanel = () => {
    setSelectedTaskId(null);
  };

  const handleEditTask = (task: Task) => {
    updateTask(task.id, task);
  };

  const countEventsOlderThan = async (days: number): Promise<number> => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return await db.history.where('timestamp').below(cutoffDate).count();
    } catch (error) {
      console.error('Error counting events:', error);
      return 0;
    }
  };

  const deleteEventsOlderThan = async (days: number): Promise<number> => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      return await db.history.where('timestamp').below(cutoffDate).delete();
    } catch (error) {
      console.error('Error deleting events:', error);
      throw error;
    }
  };

  const handleClearHistoryOption = async (mode: 'all' | '7days' | '30days' | '90days') => {
    try {
      let count = 0;

      if (mode === 'all') {
        count = events.length;
      } else {
        const days = mode === '7days' ? 7 : mode === '30days' ? 30 : 90;
        count = await countEventsOlderThan(days);
      }

      if (count === 0) {
        const label = mode === 'all' ? 'all time' : mode.replace('days', ' days');
        toast(`No events older than ${label} found`, {
          icon: 'ℹ️',
        });
        setIsClearDropdownOpen(false);
        return;
      }

      setEventsToDeleteCount(count);
      setClearMode(mode);
      setShowClearConfirm(true);
      setIsClearDropdownOpen(false);
    } catch (error) {
      console.error('Error counting events:', error);
      toast.error('Failed to count events');
    }
  };

  const handleConfirmClearHistory = async () => {
    if (!clearMode) return;

    try {
      let deletedCount = 0;

      if (clearMode === 'all') {
        await db.history.clear();
        deletedCount = events.length;
      } else {
        const days = clearMode === '7days' ? 7 : clearMode === '30days' ? 30 : 90;
        deletedCount = await deleteEventsOlderThan(days);
      }

      await loadEvents();
      await loadDbStats();

      toast.success(`Deleted ${deletedCount} history ${deletedCount === 1 ? 'event' : 'events'}`);
      setShowClearConfirm(false);
      setClearMode(null);
      setEventsToDeleteCount(0);
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    }
  };

  const handleDeleteAllTasks = async () => {
    try {
      const taskCount = dbStats?.tasks || 0;
      const historyCount = dbStats?.history || 0;

      deleteAllTasks();

      await loadEvents();
      await loadDbStats();

      toast.success(`Deleted ${taskCount} tasks and ${historyCount} history events`);
      setShowDeleteTasksConfirm(false);
    } catch (error) {
      console.error('Error deleting all tasks:', error);
      toast.error('Failed to delete all tasks');
    }
  };

  const handleDeleteAllTags = async () => {
    try {
      const tagCount = dbStats?.tags || 0;

      deleteAllTags();

      await loadDbStats();

      toast.success(`Deleted ${tagCount} tags`);
      setShowDeleteTagsConfirm(false);
    } catch (error) {
      console.error('Error deleting all tags:', error);
      toast.error('Failed to delete all tags');
    }
  };

  const handleDeleteAllPeople = async () => {
    try {
      const peopleCount = dbStats?.people || 0;

      deleteAllPeople();

      await loadDbStats();

      toast.success(`Deleted ${peopleCount} people`);
      setShowDeletePeopleConfirm(false);
    } catch (error) {
      console.error('Error deleting all people:', error);
      toast.error('Failed to delete all people');
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Database Statistics */}
        {dbStats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <HardDrive size={20} className="text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Database Statistics
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Tasks */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Tasks
                  </div>
                  {dbStats.tasks > 0 && (
                    <button
                      onClick={() => setShowDeleteTasksConfirm(true)}
                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete all tasks"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {dbStats.tasks}
                </div>
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                  ~{(dbStats.tasks * 1.0).toFixed(1)} KB
                </div>
              </div>

              {/* Tags */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Tags
                  </div>
                  {dbStats.tags > 0 && (
                    <button
                      onClick={() => setShowDeleteTagsConfirm(true)}
                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete all tags"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {dbStats.tags}
                </div>
                <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                  ~{(dbStats.tags * 0.1).toFixed(1)} KB
                </div>
              </div>

              {/* People */}
              <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                    People
                  </div>
                  {dbStats.people > 0 && (
                    <button
                      onClick={() => setShowDeletePeopleConfirm(true)}
                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete all people"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                  {dbStats.people}
                </div>
                <div className="text-xs text-cyan-600/70 dark:text-cyan-400/70 mt-1">
                  ~{(dbStats.people * 0.1).toFixed(1)} KB
                </div>
              </div>

              {/* History */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    History
                  </div>
                  {dbStats.history > 0 && (
                    <button
                      onClick={() => handleClearHistoryOption('all')}
                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete all history"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {dbStats.history}
                </div>
                <div className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                  ~{(dbStats.history * 0.5).toFixed(1)} KB
                </div>
              </div>

              {/* Data Operations */}
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                    Import/Export
                  </div>
                  {dbStats.dataOperations > 0 && (
                    <button
                      onClick={() => setShowClearOperationsConfirm(true)}
                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Clear operations log"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {dbStats.dataOperations}
                </div>
                <div className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
                  ~{(dbStats.dataOperations * 0.3).toFixed(1)} KB
                </div>
              </div>

              {/* Total */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                  Total Size
                </div>
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {dbStats.totalSize}
                </div>
                <div className="text-xs text-gray-600/70 dark:text-gray-400/70 mt-1">
                  Estimated
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Operations Section */}
        {dataOperations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Recent Import/Export Operations
                </h3>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                  {dataOperations.length} shown
                </span>
              </div>

              {/* Clear Operations Button */}
              <button
                onClick={() => setShowClearOperationsConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                Clear Operations
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dataOperations.map((operation) => (
                <DataOperationCard key={operation.id} operation={operation} />
              ))}
            </div>

            {hasMoreOperations && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMoreOperations}
                  className="px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}

        {dataOperations.length > 0 && <hr className="border-gray-200 dark:border-gray-700" />}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <History size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                History
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View all task activity and changes
              </p>
            </div>
          </div>

          {/* Clear History Dropdown */}
          {events.length > 0 && (
            <div className="relative" ref={clearHistoryDropdownRef}>
              <button
                onClick={() => setIsClearDropdownOpen(!isClearDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
                <span>Clear History</span>
                <ChevronDown size={14} className={`transition-transform ${isClearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isClearDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleClearHistoryOption('all')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                      <span>Clear All History</span>
                    </button>
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700"></div>
                    <button
                      onClick={() => handleClearHistoryOption('7days')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 size={18} className="text-orange-600 dark:text-orange-400" />
                      <span>Delete older than 7 days</span>
                    </button>
                    <button
                      onClick={() => handleClearHistoryOption('30days')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 size={18} className="text-orange-600 dark:text-orange-400" />
                      <span>Delete older than 30 days</span>
                    </button>
                    <button
                      onClick={() => handleClearHistoryOption('90days')}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Trash2 size={18} className="text-orange-600 dark:text-orange-400" />
                      <span>Delete older than 90 days</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <HistoryFilters />

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : hasEvents ? (
          <HistoryTimeline eventsByDate={eventsByDate} onTaskClick={handleTaskClick} />
        ) : (
          <EmptyState
            icon={History}
            title="No history yet"
            description="Task activity will appear here as you add, edit, and complete tasks."
          />
        )}
      </div>

      {/* Task Side Panel */}
      {selectedTask && (
        <TaskSidePanel
          isOpen={!!selectedTask}
          onClose={handleClosePanel}
          task={selectedTask}
          onEditTask={handleEditTask}
        />
      )}

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && clearMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {clearMode === 'all'
                  ? 'Clear All History?'
                  : `Delete History Older Than ${clearMode === '7days' ? '7 Days' : clearMode === '30days' ? '30 Days' : '90 Days'}?`
                }
              </h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {clearMode === 'all'
                ? 'This will permanently delete all history events.'
                : `This will permanently delete all history events older than ${clearMode === '7days' ? '7 days' : clearMode === '30days' ? '30 days' : '90 days'}.`
              }
            </p>

            {/* Count Display */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                {eventsToDeleteCount} {eventsToDeleteCount === 1 ? 'event' : 'events'} will be deleted
              </p>
              {clearMode !== 'all' && (
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  Events from the last {clearMode === '7days' ? '7 days' : clearMode === '30days' ? '30 days' : '90 days'} will be kept
                </p>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              This action cannot be undone.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowClearConfirm(false);
                  setClearMode(null);
                  setEventsToDeleteCount(0);
                }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearHistory}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                {clearMode === 'all' ? 'Clear All' : 'Delete Events'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Operations Confirmation Modal */}
      {showClearOperationsConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Clear Import/Export Operations?
              </h2>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              This will clear all operation logs except the most recent import. This helps reduce database size while keeping your last import for reference.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearOperationsConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearOperations}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Clear Operations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Tasks Confirmation Modal */}
      {showDeleteTasksConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                ⚠️ This action cannot be undone
              </p>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Delete All Tasks?
            </h2>

            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
              <p className="font-medium">This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>{dbStats?.tasks || 0}</strong> tasks (including all subtasks)</li>
                <li><strong>{dbStats?.history || 0}</strong> history events</li>
              </ul>
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                Tags and People will be preserved but will have no associated tasks.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteTasksConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllTasks}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete All Tasks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Tags Confirmation Modal */}
      {showDeleteTagsConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                ⚠️ This will remove tags from all tasks
              </p>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Delete All Tags?
            </h2>

            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
              <p className="font-medium">This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>{dbStats?.tags || 0}</strong> tags</li>
              </ul>
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                All tasks will have their tag associations removed. Tasks themselves will not be deleted.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteTagsConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllTags}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete All Tags
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All People Confirmation Modal */}
      {showDeletePeopleConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                ⚠️ This will remove people from all tasks
              </p>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Delete All People?
            </h2>

            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
              <p className="font-medium">This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>{dbStats?.people || 0}</strong> people</li>
              </ul>
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                All tasks will have their people associations removed. Tasks themselves will not be deleted.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeletePeopleConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllPeople}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete All People
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
