import { create } from 'zustand';
import type { Task, Tag } from '../types/task';

interface HistoryState {
  tasks: Task[];
  tags: Tag[];
}

interface HistoryStore {
  past: HistoryState[];
  future: HistoryState[];

  // Actions
  pushState: (state: HistoryState) => void;
  undo: (currentState: HistoryState) => HistoryState | null;
  redo: (currentState: HistoryState) => HistoryState | null;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],

  pushState: (state) => {
    set((current) => ({
      past: [...current.past, state].slice(-MAX_HISTORY),
      future: [], // Clear future when new state is pushed
    }));
  },

  undo: (currentState: HistoryState) => {
    const { past } = get();
    if (past.length === 0) return null;

    const previousState = past[past.length - 1];
    set((current) => ({
      past: current.past.slice(0, -1),
      future: [currentState, ...current.future].slice(0, MAX_HISTORY),
    }));

    return previousState;
  },

  redo: (currentState: HistoryState) => {
    const { future } = get();
    if (future.length === 0) return null;

    const nextState = future[0];
    set((current) => ({
      past: [...current.past, currentState].slice(-MAX_HISTORY),
      future: current.future.slice(1),
    }));

    return nextState;
  },

  clear: () => {
    set({ past: [], future: [] });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
