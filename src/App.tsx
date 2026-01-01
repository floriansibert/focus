import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { ExportReminderBanner } from './components/layout/ExportReminderBanner';
import { Matrix } from './components/matrix/Matrix';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { HistoryDashboard } from './components/history/HistoryDashboard';
import { TemplatesDashboard } from './components/templates/TemplatesDashboard';
import { CommandPalette } from './components/layout/CommandPalette';
import { KeyboardShortcutsHelp } from './components/layout/KeyboardShortcutsHelp';
import { ExportModal } from './components/export/ExportModal';
import { ImportModal } from './components/export/ImportModal';
import { AboutModal } from './components/layout/AboutModal';
import { HelpModal } from './components/layout/HelpModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { PomodoroOverlay } from './components/pomodoro/PomodoroOverlay';
import { useTaskStore } from './store/taskStore';
import { useUIStore } from './store/uiStore';
import { useRecurringTasks } from './hooks/useRecurringTasks';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUndoRedo } from './hooks/useUndoRedo';
import { usePomodoroTimer } from './hooks/usePomodoroTimer';
import { useHistoryCleanup } from './hooks/useHistoryCleanup';
import { useExportReminder } from './hooks/useExportReminder';
import { QuadrantType, TaskType } from './types/task';

function App() {
  const { loadFromDB, addTask, addTag } = useTaskStore();
  const { activeView, setActiveView, toggleCommandPalette, toggleTheme, clearFilters, focusedQuadrant, setFocusedQuadrant } =
    useUIStore();
  const [error, setError] = useState<string | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Enable automatic recurring task generation
  useRecurringTasks();

  // Enable Pomodoro timer
  usePomodoroTimer();

  // Enable automatic history cleanup
  useHistoryCleanup();

  // Enable export reminders
  const { shouldShowBanner, daysSinceLastExport } = useExportReminder();

  // Enable undo/redo functionality
  const { undo, redo } = useUndoRedo();

  // Setup keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      description: 'Open command palette',
      action: toggleCommandPalette,
    },
    {
      key: '/',
      ctrl: true,
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcutsHelp(true),
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcutsHelp(true),
    },
    {
      key: 'F1',
      description: 'Open help & documentation',
      action: () => setShowHelpModal(true),
    },
    {
      key: 'm',
      ctrl: true,
      description: 'Go to Matrix view',
      action: () => setActiveView('matrix'),
    },
    {
      key: 'a',
      ctrl: true,
      description: 'Go to Analytics view',
      action: () => setActiveView('analytics'),
    },
    {
      key: 'h',
      ctrl: true,
      description: 'Go to History view',
      action: () => setActiveView('history'),
    },
    {
      key: 't',
      ctrl: true,
      description: 'Go to Templates view',
      action: () => setActiveView('templates'),
    },
    {
      key: '1',
      ctrl: true,
      description: 'Add task to Urgent & Important',
      action: () => {
        setActiveView('matrix');
        // Trigger will be handled by Matrix component
        window.dispatchEvent(new CustomEvent('openTaskModal', { detail: { quadrant: QuadrantType.URGENT_IMPORTANT } }));
      },
    },
    {
      key: '2',
      ctrl: true,
      description: 'Add task to Not Urgent & Important',
      action: () => {
        setActiveView('matrix');
        window.dispatchEvent(new CustomEvent('openTaskModal', { detail: { quadrant: QuadrantType.NOT_URGENT_IMPORTANT } }));
      },
    },
    {
      key: '3',
      ctrl: true,
      description: 'Add task to Urgent & Not Important',
      action: () => {
        setActiveView('matrix');
        window.dispatchEvent(new CustomEvent('openTaskModal', { detail: { quadrant: QuadrantType.URGENT_NOT_IMPORTANT } }));
      },
    },
    {
      key: '4',
      ctrl: true,
      description: 'Add task to Not Urgent & Not Important',
      action: () => {
        setActiveView('matrix');
        window.dispatchEvent(new CustomEvent('openTaskModal', { detail: { quadrant: QuadrantType.NOT_URGENT_NOT_IMPORTANT } }));
      },
    },
    {
      key: 'd',
      ctrl: true,
      description: 'Toggle dark mode',
      action: toggleTheme,
    },
    {
      key: 'l',
      ctrl: true,
      description: 'Clear filters',
      action: clearFilters,
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Toggle Pomodoro timer',
      action: () => useUIStore.getState().togglePomodoro(),
    },
    {
      key: 'z',
      ctrl: true,
      description: 'Undo',
      action: undo,
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      description: 'Redo',
      action: redo,
    },
    {
      key: 'Escape',
      description: 'Exit focus mode',
      action: () => {
        if (focusedQuadrant) {
          setFocusedQuadrant(null);
        }
      },
    },
  ]);

  useEffect(() => {
    let initialized = false;

    // Load data from IndexedDB on mount
    loadFromDB()
      .then(() => {
        if (initialized) return; // Prevent double-run in React StrictMode
        initialized = true;

        const currentTasks = useTaskStore.getState().tasks;

        // Add some sample data if empty
        if (currentTasks.length === 0) {
          // Add sample tags
          addTag({ name: 'Work', color: '#3B82F6' });
          addTag({ name: 'Personal', color: '#10B981' });
          addTag({ name: 'Health', color: '#EF4444' });

          // Add sample tasks
          addTask({
            title: 'Fix critical bug in production',
            description: 'Users are experiencing login issues',
            quadrant: QuadrantType.URGENT_IMPORTANT,
            completed: false,
            isRecurring: false,
            tags: [],
            people: [],
            taskType: TaskType.STANDARD,
            order: 0,
          });

          addTask({
            title: 'Plan Q1 strategy meeting',
            description: 'Prepare slides and agenda for next quarter',
            quadrant: QuadrantType.NOT_URGENT_IMPORTANT,
            completed: false,
            isRecurring: false,
            tags: [],
            people: [],
            taskType: TaskType.STANDARD,
            order: 0,
          });

          addTask({
            title: 'Respond to team emails',
            description: 'Check and respond to non-urgent messages',
            quadrant: QuadrantType.URGENT_NOT_IMPORTANT,
            completed: false,
            isRecurring: false,
            tags: [],
            people: [],
            taskType: TaskType.STANDARD,
            order: 0,
          });

          addTask({
            title: 'Browse social media',
            description: 'Mindless scrolling - should minimize',
            quadrant: QuadrantType.NOT_URGENT_NOT_IMPORTANT,
            completed: false,
            isRecurring: false,
            tags: [],
            people: [],
            taskType: TaskType.STANDARD,
            order: 0,
          });
        }
      })
      .catch((err) => {
        console.error('Error loading data:', err);
        setError(err.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Error Loading App</h1>
        <p>{error}</p>
      </div>
    );
  }

  // Handle export completion to reset reminder state
  const handleExportComplete = () => {
    useUIStore.getState().dismissExportReminder();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header
        onExport={() => setShowExportModal(true)}
        onImport={() => setShowImportModal(true)}
        onAbout={() => setShowAboutModal(true)}
        onHelp={() => setShowHelpModal(true)}
        onSettings={() => setShowSettingsModal(true)}
      />

      {/* Export Reminder Banner */}
      {shouldShowBanner && (
        <ExportReminderBanner
          onExport={() => setShowExportModal(true)}
          daysSinceLastExport={daysSinceLastExport}
        />
      )}

      <main className="max-w-7xl mx-auto">
        {activeView === 'matrix' ? (
          <Matrix />
        ) : activeView === 'analytics' ? (
          <AnalyticsDashboard />
        ) : activeView === 'history' ? (
          <HistoryDashboard />
        ) : (
          <TemplatesDashboard />
        )}
      </main>

      {/* Command Palette */}
      <CommandPalette
        onExport={() => setShowExportModal(true)}
        onImport={() => setShowImportModal(true)}
        onAbout={() => setShowAboutModal(true)}
        onHelp={() => setShowHelpModal(true)}
        onSettings={() => setShowSettingsModal(true)}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportComplete={handleExportComplete}
      />

      {/* Import Modal */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />

      {/* About Modal */}
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onOpenShortcuts={() => setShowShortcutsHelp(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Pomodoro Timer */}
      <PomodoroOverlay />

      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
