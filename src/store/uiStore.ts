import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FilterState, QuadrantType } from '../types/task';
import { QuadrantType as QuadrantTypeEnum } from '../types/task';
import { getInitialPomodoroState, calculateNextSession, type PomodoroState } from '../utils/pomodoro';

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
  showCompletedOnly: boolean;
  completedDateRange: { start: Date; end: Date } | null;
  setShowCompletedOnly: (enabled: boolean) => void;
  setCompletedDateRange: (range: { start: Date; end: Date } | null) => void;
  showOverdueOnly: boolean;
  setShowOverdueOnly: (enabled: boolean) => void;
  starredFilterByQuadrant: Record<QuadrantType, boolean>;
  toggleStarredForQuadrant: (quadrant: QuadrantType) => void;
  setDateRange: (range?: { start: Date; end: Date }) => void;
  clearFilters: () => void;

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
      showCompletedOnly: false,
      completedDateRange: null,
      showOverdueOnly: false,
      starredFilterByQuadrant: {
        [QuadrantTypeEnum.URGENT_IMPORTANT]: false,
        [QuadrantTypeEnum.NOT_URGENT_IMPORTANT]: false,
        [QuadrantTypeEnum.URGENT_NOT_IMPORTANT]: false,
        [QuadrantTypeEnum.NOT_URGENT_NOT_IMPORTANT]: false,
      },
      dateRange: undefined,

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

      setShowCompletedOnly: (enabled) => set({ showCompletedOnly: enabled }),

      setCompletedDateRange: (range) => set({ completedDateRange: range }),

      setShowOverdueOnly: (enabled) => set({ showOverdueOnly: enabled }),

      toggleStarredForQuadrant: (quadrant) =>
        set((state) => ({
          starredFilterByQuadrant: {
            ...state.starredFilterByQuadrant,
            [quadrant]: !state.starredFilterByQuadrant[quadrant],
          },
        })),

      setDateRange: (range) => set({ dateRange: range }),

      clearFilters: () =>
        set({
          searchQuery: '',
          selectedTags: [],
          selectedPeople: [],
          showCompleted: true,
          completedTasksCutoffDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Reset to 7 days ago
          showCompletedOnly: false,
          completedDateRange: null,
          showOverdueOnly: false,
          dateRange: undefined,
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
        showCompletedOnly: state.showCompletedOnly,
        completedDateRange: state.completedDateRange,
        showOverdueOnly: state.showOverdueOnly,
        historyRetentionDays: state.historyRetentionDays,
        exportReminderEnabled: state.exportReminderEnabled,
        exportReminderFrequencyDays: state.exportReminderFrequencyDays,
        lastExportReminderDismissed: state.lastExportReminderDismissed,
        exportReminderSnoozedUntil: state.exportReminderSnoozedUntil,
      }),
      merge: (persistedState: Record<string, unknown>, currentState) => ({
        ...currentState,
        ...persistedState,
        collapsedTasks: new Set(persistedState?.collapsedTasks || []),
        completedTasksCutoffDate: persistedState?.completedTasksCutoffDate
          ? new Date(persistedState.completedTasksCutoffDate)
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        showCompletedOnly: persistedState?.showCompletedOnly ?? false,
        completedDateRange: persistedState?.completedDateRange
          ? {
              start: new Date(persistedState.completedDateRange.start),
              end: new Date(persistedState.completedDateRange.end),
            }
          : null,
        showOverdueOnly: persistedState?.showOverdueOnly ?? false,
        historyRetentionDays: persistedState?.historyRetentionDays ?? 7,
        exportReminderEnabled: persistedState?.exportReminderEnabled ?? true,
        exportReminderFrequencyDays: persistedState?.exportReminderFrequencyDays ?? 7,
        lastExportReminderDismissed: persistedState?.lastExportReminderDismissed
          ? new Date(persistedState.lastExportReminderDismissed)
          : null,
        exportReminderSnoozedUntil: persistedState?.exportReminderSnoozedUntil
          ? new Date(persistedState.exportReminderSnoozedUntil)
          : null,
      }),
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
