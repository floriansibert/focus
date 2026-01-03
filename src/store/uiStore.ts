import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FilterState, QuadrantType, ViewMode } from '../types/task';
import { QuadrantType as QuadrantTypeEnum, ViewMode as ViewModeEnum } from '../types/task';
import { getInitialPomodoroState, calculateNextSession, type PomodoroState } from '../utils/pomodoro';
import { calculateCompletedViewDateRange } from '../utils/date';

interface UIStore extends FilterState {
  // UI State
  theme: 'light' | 'dark';
  activeView: 'matrix' | 'analytics' | 'history' | 'templates';
  commandPaletteOpen: boolean;
  filtersExpanded: boolean;
  collapsedTasks: Set<string>;
  focusedQuadrant: QuadrantType | null;
  helpModalSection: string;
  historyRetentionDays: number | null;

  // Export reminder state
  exportReminderEnabled: boolean;
  exportReminderFrequencyDays: number; // 7, 14, 30, or 90
  lastExportReminderDismissed: Date | null;
  exportReminderSnoozedUntil: Date | null;

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setActiveView: (view: 'matrix' | 'analytics' | 'history' | 'templates') => void;
  toggleCommandPalette: () => void;
  toggleFilters: () => void;
  setHelpModalSection: (section: string) => void;
  toggleTaskCollapse: (taskId: string) => void;
  expandAllInQuadrant: (taskIds: string[]) => void;
  collapseAllInQuadrant: (taskIds: string[]) => void;
  setFocusedQuadrant: (quadrant: QuadrantType | null) => void;
  toggleQuadrantFocus: (quadrant: QuadrantType) => void;

  // Filter actions
  setSearchQuery: (query: string) => void;
  toggleTag: (tagId: string) => void;
  togglePerson: (personId: string) => void;
  setShowCompleted: (show: boolean) => void;
  completedTasksCutoffDate: Date | null;
  setCompletedTasksCutoffDate: (date: Date | null) => void;
  completedLookbackDays: number | null; // null = forever, number = days to look back
  setCompletedLookbackDays: (days: number | null) => void;
  showCompletedOnly: boolean;
  completedDateRange: { start: Date; end: Date } | null;
  setShowCompletedOnly: (enabled: boolean) => void;
  setCompletedDateRange: (range: { start: Date; end: Date } | null) => void;
  starredFilterByQuadrant: Record<QuadrantType, boolean>;
  toggleStarredForQuadrant: (quadrant: QuadrantType) => void;
  setDateRange: (range?: { start: Date; end: Date }) => void;
  clearFilters: () => void;

  // Filter mode state (mutually exclusive)
  activeFilterMode: ViewMode | null;

  // Today's view state
  todayViewDaysAhead: number | null; // 0-30 days or null (infinity)
  todayViewComponents: {
    showOverdue: boolean;
    showDueSoon: boolean;
    showStarred: boolean;
  };

  // Completed view state
  completedViewTimeframe: 'today' | 'yesterday' | 'thisweek' | 'lastweek' | '2weeksago' | 'lastmonth' | 'custom';
  completedViewCustomRange: { start: Date; end: Date } | null;

  // Filter mode actions
  setActiveFilterMode: (mode: ViewMode | null) => void;
  setTodayViewDaysAhead: (days: number | null) => void;
  toggleTodayViewComponent: (component: 'showOverdue' | 'showDueSoon' | 'showStarred') => void;
  setCompletedViewTimeframe: (timeframe: 'today' | 'yesterday' | 'thisweek' | 'lastweek' | '2weeksago' | 'lastmonth' | 'custom') => void;
  setCompletedViewCustomRange: (range: { start: Date; end: Date } | null) => void;

  // Pomodoro state
  isPomodoroOpen: boolean;
  pomodoroState: PomodoroState;
  focusedTaskId: string | null;

  // Pomodoro actions
  togglePomodoro: () => void;
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resumePomodoro: () => void;
  skipPomodoro: () => void;
  resetPomodoro: () => void;
  restartPomodoroSession: () => void;
  tickPomodoro: () => void;
  setFocusedTask: (taskId: string | null) => void;
  startPomodoroWithTask: (taskId: string) => void;

  // History retention action
  setHistoryRetentionDays: (days: number | null) => void;

  // Export reminder actions
  setExportReminderEnabled: (enabled: boolean) => void;
  setExportReminderFrequencyDays: (days: number) => void;
  dismissExportReminder: () => void;
  snoozeExportReminder: (days: number) => void;
}

// Detect system theme preference
const getInitialTheme = (): 'light' | 'dark' => {
  // Check if there's a saved preference
  const saved = localStorage.getItem('focus-ui-storage');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.state?.theme) return parsed.state.theme;
    } catch {
      // Ignore parse errors
    }
  }

  // Fall back to system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: getInitialTheme(),
      activeView: 'matrix',
      commandPaletteOpen: false,
      filtersExpanded: true,
      collapsedTasks: new Set<string>(),
      focusedQuadrant: null,
      helpModalSection: 'getting-started',
      searchQuery: '',
      selectedTags: [],
      selectedPeople: [],
      showCompleted: true,
      completedTasksCutoffDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      completedLookbackDays: 7, // Default to 1 week
      showCompletedOnly: false,
      completedDateRange: null,
      starredFilterByQuadrant: {
        [QuadrantTypeEnum.URGENT_IMPORTANT]: false,
        [QuadrantTypeEnum.NOT_URGENT_IMPORTANT]: false,
        [QuadrantTypeEnum.URGENT_NOT_IMPORTANT]: false,
        [QuadrantTypeEnum.NOT_URGENT_NOT_IMPORTANT]: false,
      },
      dateRange: undefined,

      // Filter mode initial state
      activeFilterMode: null,
      todayViewDaysAhead: 7,
      todayViewComponents: {
        showOverdue: true,
        showDueSoon: true,
        showStarred: true,
      },
      completedViewTimeframe: 'lastweek',
      completedViewCustomRange: null,

      // Pomodoro initial state
      isPomodoroOpen: false,
      pomodoroState: getInitialPomodoroState(),
      focusedTaskId: null,

      // History retention
      historyRetentionDays: 7,

      // Export reminder defaults
      exportReminderEnabled: true,
      exportReminderFrequencyDays: 7, // Default to weekly
      lastExportReminderDismissed: null,
      exportReminderSnoozedUntil: null,

      // Theme actions
      setTheme: (theme) => {
        set({ theme });

        // Apply theme to document
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      // View actions
      setActiveView: (view) => set({ activeView: view }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      toggleFilters: () =>
        set((state) => ({ filtersExpanded: !state.filtersExpanded })),
      setHelpModalSection: (section) => set({ helpModalSection: section }),

      toggleTaskCollapse: (taskId) => {
        set((state) => {
          const newCollapsed = new Set(state.collapsedTasks);
          if (newCollapsed.has(taskId)) {
            newCollapsed.delete(taskId);
          } else {
            newCollapsed.add(taskId);
          }
          return { collapsedTasks: newCollapsed };
        });
      },

      expandAllInQuadrant: (taskIds) => {
        set((state) => {
          const newCollapsed = new Set(state.collapsedTasks);
          taskIds.forEach((id) => newCollapsed.delete(id));
          return { collapsedTasks: newCollapsed };
        });
      },

      collapseAllInQuadrant: (taskIds) => {
        set((state) => {
          const newCollapsed = new Set(state.collapsedTasks);
          taskIds.forEach((id) => newCollapsed.add(id));
          return { collapsedTasks: newCollapsed };
        });
      },

      // Quadrant focus actions
      setFocusedQuadrant: (quadrant) => set({ focusedQuadrant: quadrant }),

      toggleQuadrantFocus: (quadrant) => {
        set((state) => ({
          focusedQuadrant: state.focusedQuadrant === quadrant ? null : quadrant,
        }));
      },

      // Filter actions
      setSearchQuery: (query) => set({ searchQuery: query }),

      toggleTag: (tagId) =>
        set((state) => ({
          selectedTags: state.selectedTags.includes(tagId)
            ? state.selectedTags.filter((id) => id !== tagId)
            : [...state.selectedTags, tagId],
        })),

      togglePerson: (personId) =>
        set((state) => ({
          selectedPeople: state.selectedPeople.includes(personId)
            ? state.selectedPeople.filter((id) => id !== personId)
            : [...state.selectedPeople, personId],
        })),

      setShowCompleted: (show) => set({ showCompleted: show }),

      setCompletedTasksCutoffDate: (date) => set({ completedTasksCutoffDate: date }),

      setCompletedLookbackDays: (days) => {
        set({ completedLookbackDays: days });

        // Automatically calculate and set cutoff date
        if (days === 0) {
          // 0 days - hide all completed tasks
          set({ showCompleted: false, completedTasksCutoffDate: null });
        } else if (days === null) {
          // Forever - show all completed tasks
          set({ showCompleted: true, completedTasksCutoffDate: null });
        } else {
          // Calculate cutoff date based on days
          set({ showCompleted: true });
          const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          cutoffDate.setHours(0, 0, 0, 0);
          set({ completedTasksCutoffDate: cutoffDate });
        }
      },

      setShowCompletedOnly: (enabled) => set({ showCompletedOnly: enabled }),

      setCompletedDateRange: (range) => set({ completedDateRange: range }),

      toggleStarredForQuadrant: (quadrant) =>
        set((state) => ({
          starredFilterByQuadrant: {
            ...state.starredFilterByQuadrant,
            [quadrant]: !state.starredFilterByQuadrant[quadrant],
          },
        })),

      setDateRange: (range) => set({ dateRange: range }),

      // Filter mode actions
      setActiveFilterMode: (mode) => {
        set({ activeFilterMode: mode });

        // When switching to Completed mode, initialize date range if not set
        if (mode === ViewModeEnum.COMPLETED) {
          const state = get();
          if (!state.completedDateRange) {
            // Calculate initial range based on timeframe
            const range = calculateCompletedViewDateRange(state.completedViewTimeframe, state.completedViewCustomRange);
            set({ completedDateRange: range });
          }
          // Also set showCompletedOnly to true for compatibility with existing filter logic
          set({ showCompletedOnly: true });
        } else {
          // Clear Completed mode filters when switching to Today or Plan
          set({ showCompletedOnly: false, completedDateRange: null });
        }
      },

      setTodayViewDaysAhead: (days) => set({ todayViewDaysAhead: days }),

      toggleTodayViewComponent: (component) =>
        set((state) => ({
          todayViewComponents: {
            ...state.todayViewComponents,
            [component]: !state.todayViewComponents[component],
          },
        })),

      setCompletedViewTimeframe: (timeframe) => {
        set({ completedViewTimeframe: timeframe });

        // Auto-update date range when timeframe changes (except for custom)
        if (timeframe !== 'custom') {
          const range = calculateCompletedViewDateRange(timeframe, null);
          set({ completedDateRange: range });
        }
      },

      setCompletedViewCustomRange: (range) => {
        set({
          completedViewCustomRange: range,
          completedDateRange: range,
        });
      },

      clearFilters: () =>
        set({
          searchQuery: '',
          selectedTags: [],
          selectedPeople: [],
          showCompleted: true,
          completedTasksCutoffDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Reset to 7 days ago
          completedLookbackDays: 7, // Reset to 1 week
          showCompletedOnly: false,
          completedDateRange: null,
          dateRange: undefined,
          activeFilterMode: null,
        }),

      // History retention action
      setHistoryRetentionDays: (days) => set({ historyRetentionDays: days }),

      // Export reminder actions
      setExportReminderEnabled: (enabled) => set({ exportReminderEnabled: enabled }),
      setExportReminderFrequencyDays: (days) => set({ exportReminderFrequencyDays: days }),
      dismissExportReminder: () => set({
        lastExportReminderDismissed: new Date(),
        exportReminderSnoozedUntil: null
      }),
      snoozeExportReminder: (days) => {
        const snoozeUntil = new Date();
        snoozeUntil.setDate(snoozeUntil.getDate() + days);
        set({ exportReminderSnoozedUntil: snoozeUntil });
      },

      // Pomodoro actions
      togglePomodoro: () =>
        set((state) => ({
          isPomodoroOpen: !state.isPomodoroOpen,
          // Keep timer state - don't reset when minimizing
        })),

      startPomodoro: () =>
        set((state) => ({
          pomodoroState: { ...state.pomodoroState, isRunning: true },
        })),

      pausePomodoro: () =>
        set((state) => ({
          pomodoroState: { ...state.pomodoroState, isRunning: false },
        })),

      resumePomodoro: () =>
        set((state) => ({
          pomodoroState: { ...state.pomodoroState, isRunning: true },
        })),

      skipPomodoro: () =>
        set((state) => ({
          pomodoroState: calculateNextSession(state.pomodoroState),
        })),

      resetPomodoro: () =>
        set({ pomodoroState: getInitialPomodoroState() }),

      restartPomodoroSession: () =>
        set((state) => ({
          pomodoroState: {
            ...state.pomodoroState,
            timeRemaining: state.pomodoroState.totalTime,
            isRunning: false,
          },
        })),

      tickPomodoro: () =>
        set((state) => {
          if (!state.pomodoroState.isRunning || state.pomodoroState.timeRemaining <= 0) {
            return state;
          }

          const newTimeRemaining = state.pomodoroState.timeRemaining - 1;

          // Session complete
          if (newTimeRemaining === 0) {
            const newState = calculateNextSession({
              ...state.pomodoroState,
              timeRemaining: 0,
            });

            return {
              pomodoroState: {
                ...newState,
                isRunning: state.pomodoroState.autoTransition,
              },
            };
          }

          return {
            pomodoroState: {
              ...state.pomodoroState,
              timeRemaining: newTimeRemaining,
            },
          };
        }),

      setFocusedTask: (taskId) => set({ focusedTaskId: taskId }),

      startPomodoroWithTask: (taskId) => {
        set({
          focusedTaskId: taskId,
          isPomodoroOpen: true,
        });
        get().startPomodoro();
      },
    }),
    {
      name: 'focus-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        filtersExpanded: state.filtersExpanded,
        collapsedTasks: Array.from(state.collapsedTasks),
        focusedQuadrant: state.focusedQuadrant,
        helpModalSection: state.helpModalSection,
        completedTasksCutoffDate: state.completedTasksCutoffDate,
        completedLookbackDays: state.completedLookbackDays,
        showCompletedOnly: state.showCompletedOnly,
        completedDateRange: state.completedDateRange,
        historyRetentionDays: state.historyRetentionDays,
        exportReminderEnabled: state.exportReminderEnabled,
        exportReminderFrequencyDays: state.exportReminderFrequencyDays,
        lastExportReminderDismissed: state.lastExportReminderDismissed,
        exportReminderSnoozedUntil: state.exportReminderSnoozedUntil,
        activeFilterMode: state.activeFilterMode,
        todayViewDaysAhead: state.todayViewDaysAhead,
        todayViewComponents: state.todayViewComponents,
        completedViewTimeframe: state.completedViewTimeframe,
        completedViewCustomRange: state.completedViewCustomRange,
      }),
      merge: (persistedState: Record<string, unknown>, currentState) => {
        // Migration: Convert old showTodayView to new activeFilterMode
        let activeFilterMode = persistedState?.activeFilterMode ?? null;
        if (persistedState?.showTodayView === true && !activeFilterMode) {
          activeFilterMode = ViewModeEnum.TODAY;
        }

        return {
          ...currentState,
          ...persistedState,
          collapsedTasks: new Set(persistedState?.collapsedTasks || []),
          completedTasksCutoffDate: persistedState?.completedTasksCutoffDate
            ? new Date(persistedState.completedTasksCutoffDate)
            : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          completedLookbackDays: persistedState?.completedLookbackDays ?? 7,
          showCompletedOnly: persistedState?.showCompletedOnly ?? false,
          completedDateRange: persistedState?.completedDateRange
            ? {
                start: new Date(persistedState.completedDateRange.start),
                end: new Date(persistedState.completedDateRange.end),
              }
            : null,
          historyRetentionDays: persistedState?.historyRetentionDays ?? 7,
          exportReminderEnabled: persistedState?.exportReminderEnabled ?? true,
          exportReminderFrequencyDays: persistedState?.exportReminderFrequencyDays ?? 7,
          lastExportReminderDismissed: persistedState?.lastExportReminderDismissed
            ? new Date(persistedState.lastExportReminderDismissed)
            : null,
          exportReminderSnoozedUntil: persistedState?.exportReminderSnoozedUntil
            ? new Date(persistedState.exportReminderSnoozedUntil)
            : null,
          activeFilterMode,
          todayViewDaysAhead: persistedState?.todayViewDaysAhead ?? 7,
          todayViewComponents: persistedState?.todayViewComponents ?? {
            showOverdue: true,
            showDueSoon: true,
            showStarred: true,
          },
          completedViewTimeframe: persistedState?.completedViewTimeframe ?? 'lastweek',
          completedViewCustomRange: persistedState?.completedViewCustomRange
            ? {
                start: new Date(persistedState.completedViewCustomRange.start),
                end: new Date(persistedState.completedViewCustomRange.end),
              }
            : null,
        };
      },
    }
  )
);

// Apply theme on page load
const theme = useUIStore.getState().theme;
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
}

// Listen for system theme changes (only if user hasn't explicitly set a preference)
if (window.matchMedia) {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

  darkModeQuery.addEventListener('change', (e) => {
    // Only auto-switch if the current theme matches system preference
    // (i.e., user hasn't manually toggled)
    const currentTheme = useUIStore.getState().theme;
    const systemPrefersDark = e.matches;
    const currentSystemPreference = systemPrefersDark ? 'dark' : 'light';

    // If current theme matches what system preference was, update to new preference
    if (currentTheme === currentSystemPreference) {
      useUIStore.getState().setTheme(currentSystemPreference);
    }
  });
}
