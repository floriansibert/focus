// Pomodoro timer constants and utility functions

export const WORK_TIME = 25 * 60; // 25 minutes in seconds
export const SHORT_BREAK_TIME = 5 * 60; // 5 minutes in seconds
export const LONG_BREAK_TIME = 15 * 60; // 15 minutes in seconds

export type SessionType = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroState {
  sessionType: SessionType;
  timeRemaining: number; // seconds
  totalTime: number; // seconds
  isRunning: boolean;
  pomodorosCompleted: number; // 0-3, then resets
  currentPomodoro: number; // 1-4
  autoTransition: boolean;
}

/**
 * Returns the initial Pomodoro state
 */
export function getInitialPomodoroState(): PomodoroState {
  return {
    sessionType: 'work',
    timeRemaining: WORK_TIME,
    totalTime: WORK_TIME,
    isRunning: false,
    pomodorosCompleted: 0,
    currentPomodoro: 1,
    autoTransition: false,
  };
}

/**
 * Calculates the next session based on current state
 */
export function calculateNextSession(currentState: PomodoroState): PomodoroState {
  if (currentState.sessionType === 'work') {
    // Work session finished, go to break
    const newPomodorosCompleted = currentState.pomodorosCompleted + 1;
    const isLongBreak = newPomodorosCompleted >= 4;

    return {
      ...currentState,
      sessionType: isLongBreak ? 'longBreak' : 'shortBreak',
      timeRemaining: isLongBreak ? LONG_BREAK_TIME : SHORT_BREAK_TIME,
      totalTime: isLongBreak ? LONG_BREAK_TIME : SHORT_BREAK_TIME,
      pomodorosCompleted: newPomodorosCompleted,
      isRunning: false, // Don't auto-start next session
    };
  } else {
    // Break finished, start new work session
    const resetCycle = currentState.sessionType === 'longBreak';

    return {
      ...currentState,
      sessionType: 'work',
      timeRemaining: WORK_TIME,
      totalTime: WORK_TIME,
      pomodorosCompleted: resetCycle ? 0 : currentState.pomodorosCompleted,
      currentPomodoro: resetCycle ? 1 : currentState.currentPomodoro + 1,
      isRunning: false, // Don't auto-start next session
    };
  }
}

/**
 * Formats seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Returns human-readable label for session type
 */
export function getSessionLabel(sessionType: SessionType): string {
  switch (sessionType) {
    case 'work':
      return 'Focus Time';
    case 'shortBreak':
      return 'Short Break';
    case 'longBreak':
      return 'Long Break';
  }
}

/**
 * Returns color classes for session type
 */
export function getSessionColor(sessionType: SessionType): {
  gradient: string;
  progressStroke: string;
  textColor: string;
} {
  switch (sessionType) {
    case 'work':
      return {
        gradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950',
        progressStroke: 'stroke-blue-500 dark:stroke-blue-400',
        textColor: 'text-blue-900 dark:text-blue-100',
      };
    case 'shortBreak':
      return {
        gradient: 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 dark:from-gray-900 dark:via-green-950 dark:to-emerald-950',
        progressStroke: 'stroke-green-500 dark:stroke-green-400',
        textColor: 'text-green-900 dark:text-green-100',
      };
    case 'longBreak':
      return {
        gradient: 'bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 dark:from-gray-900 dark:via-purple-950 dark:to-violet-950',
        progressStroke: 'stroke-purple-500 dark:stroke-purple-400',
        textColor: 'text-purple-900 dark:text-purple-100',
      };
  }
}
