import { useEffect, useRef } from 'react';
import { useUIStore } from '../store/uiStore';
import toast from 'react-hot-toast';
import type { SessionType } from '../utils/pomodoro';

/**
 * Hook that manages Pomodoro timer interval and notifications
 * Follows the pattern from useRecurringTasks
 */
export function usePomodoroTimer() {
  const { pomodoroState, tickPomodoro } = useUIStore();
  const previousTimeRef = useRef<number>(pomodoroState.timeRemaining);
  const previousSessionRef = useRef<SessionType>(pomodoroState.sessionType);

  // Timer tick effect - runs every second when timer is active
  // Timer runs regardless of overlay visibility
  useEffect(() => {
    if (!pomodoroState.isRunning) {
      return;
    }

    const interval = setInterval(() => {
      tickPomodoro();
    }, 1000);

    return () => clearInterval(interval);
  }, [pomodoroState.isRunning, tickPomodoro]);

  // Session completion notification effect
  useEffect(() => {
    // Detect transition from 1 second to 0 seconds (session just completed)
    if (previousTimeRef.current > 0 && pomodoroState.timeRemaining === 0) {
      handleSessionComplete(pomodoroState.sessionType);
    }

    previousTimeRef.current = pomodoroState.timeRemaining;
  }, [pomodoroState.timeRemaining, pomodoroState.sessionType]);

  // Session type change notification effect
  useEffect(() => {
    // Detect when session type changes AND we're at the start of a new session
    if (
      previousSessionRef.current !== pomodoroState.sessionType &&
      pomodoroState.timeRemaining === pomodoroState.totalTime
    ) {
      handleSessionStart(pomodoroState.sessionType);
    }

    previousSessionRef.current = pomodoroState.sessionType;
  }, [pomodoroState.sessionType, pomodoroState.timeRemaining, pomodoroState.totalTime]);

  function handleSessionComplete(sessionType: SessionType) {
    if (sessionType === 'work') {
      toast.success('Work session complete! Time for a break.', {
        duration: 5000,
        icon: '🎉',
      });
    } else if (sessionType === 'shortBreak') {
      toast.success('Break complete! Ready for another pomodoro?', {
        duration: 5000,
        icon: '💪',
      });
    } else {
      toast.success('Long break complete! Great work!', {
        duration: 5000,
        icon: '🌟',
      });
    }
  }

  function handleSessionStart(sessionType: SessionType) {
    if (sessionType === 'work') {
      toast('Focus time! Let\'s get to work.', {
        duration: 3000,
        icon: '🎯',
      });
    } else {
      toast('Break time! Relax and recharge.', {
        duration: 3000,
        icon: '☕',
      });
    }
  }
}
