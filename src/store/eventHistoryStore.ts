import { create } from 'zustand';
import { db } from '../lib/db';
import type { HistoryEntry, HistoryActionType, HistoryFilterState } from '../types/task';

interface EventHistoryStore {
  // State
  events: HistoryEntry[];
  isLoading: boolean;
  filters: HistoryFilterState;

  // Actions
  loadEvents: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  toggleActionType: (actionType: HistoryActionType) => void;
  setDateRange: (range: 'today' | '7days' | '30days' | 'all') => void;
  clearFilters: () => void;

  // Computed
  getFilteredEvents: () => HistoryEntry[];
  getEventsByDate: () => Map<string, HistoryEntry[]>;
}

export const useEventHistoryStore = create<EventHistoryStore>((set, get) => ({
  events: [],
  isLoading: false,
  filters: {
    searchQuery: '',
    actionTypes: [],
    dateRange: 'all',
  },

  loadEvents: async () => {
    set({ isLoading: true });
    try {
      const events = await db.history
        .orderBy('timestamp')
        .reverse()  // Most recent first
        .toArray();

      console.log('Loaded history events:', events.length, events);
      set({ events, isLoading: false });
    } catch (error) {
      console.error('Failed to load history events:', error);
      set({ isLoading: false });
    }
  },

  setSearchQuery: (query) => {
    set((state) => ({
      filters: { ...state.filters, searchQuery: query },
    }));
  },

  toggleActionType: (actionType) => {
    set((state) => {
      const actionTypes = state.filters.actionTypes.includes(actionType)
        ? state.filters.actionTypes.filter((t) => t !== actionType)
        : [...state.filters.actionTypes, actionType];

      return {
        filters: { ...state.filters, actionTypes },
      };
    });
  },

  setDateRange: (range) => {
    set((state) => ({
      filters: { ...state.filters, dateRange: range },
    }));
  },

  clearFilters: () => {
    set({
      filters: {
        searchQuery: '',
        actionTypes: [],
        dateRange: 'all',
      },
    });
  },

  getFilteredEvents: () => {
    const { events, filters } = get();

    let filtered = [...events];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((e) =>
        e.taskTitle.toLowerCase().includes(query)
      );
    }

    // Action type filter
    if (filters.actionTypes.length > 0) {
      filtered = filtered.filter((e) =>
        filters.actionTypes.includes(e.action)
      );
    }

    // Date range filter
    const now = new Date();
    let startDate: Date | undefined;

    switch (filters.dateRange) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = undefined;
    }

    if (startDate) {
      filtered = filtered.filter((e) =>
        new Date(e.timestamp) >= startDate!
      );
    }

    return filtered;
  },

  getEventsByDate: () => {
    const filtered = get().getFilteredEvents();
    const grouped = new Map<string, HistoryEntry[]>();

    filtered.forEach((event) => {
      const date = new Date(event.timestamp);
      const dateKey = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(event);
    });

    return grouped;
  },
}));
