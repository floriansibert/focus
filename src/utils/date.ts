import {
  addDays,
  addWeeks,
  addMonths,
  setDate,
  getDay,
  getDaysInMonth,
  startOfMonth,
  endOfMonth,
  startOfDay,
} from 'date-fns';
import { RecurrencePattern, type RecurrenceConfig } from '../types/task';

/**
 * Find the Nth occurrence of a specific weekday in a month
 * @param lastDate - Starting date
 * @param weekOfMonth - 1-5 for 1st-5th occurrence, 0 for LAST
 * @param dayOfWeek - 0-6 (Sunday-Saturday)
 * @param interval - Number of months to add
 */
function findNthWeekdayOfMonth(
  lastDate: Date,
  weekOfMonth: number,
  dayOfWeek: number,
  interval: number
): Date {
  const targetMonth = addMonths(lastDate, interval);

  // Special case: Last occurrence
  if (weekOfMonth === 0) {
    const monthEnd = endOfMonth(targetMonth);
    const lastDayOfWeek = getDay(monthEnd);
    let daysToSubtract = lastDayOfWeek - dayOfWeek;
    if (daysToSubtract < 0) daysToSubtract += 7;
    return addDays(monthEnd, -daysToSubtract);
  }

  // Find Nth occurrence
  const monthStart = startOfMonth(targetMonth);
  const firstDayOfWeek = getDay(monthStart);
  let daysToAdd = dayOfWeek - firstDayOfWeek;
  if (daysToAdd < 0) daysToAdd += 7;

  const firstOccurrence = addDays(monthStart, daysToAdd);
  const targetDate = addWeeks(firstOccurrence, weekOfMonth - 1);

  // Edge case: 5th occurrence doesn't exist - skip to next month
  if (targetDate.getMonth() !== targetMonth.getMonth()) {
    return findNthWeekdayOfMonth(targetDate, weekOfMonth, dayOfWeek, 1);
  }

  return targetDate;
}

/**
 * Calculate next occurrence for weekly patterns
 */
function calculateWeeklyNext(lastDate: Date, recurrence: RecurrenceConfig): Date {
  const { interval = 1, daysOfWeek } = recurrence;

  // Simple pattern: no specific days selected
  if (!daysOfWeek || daysOfWeek.length === 0) {
    return addWeeks(lastDate, interval);
  }

  // Advanced: find next occurrence in selected days
  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
  const currentDay = getDay(lastDate);

  // Check remaining days this week
  const nextDayInWeek = sortedDays.find(day => day > currentDay);

  if (nextDayInWeek !== undefined) {
    return addDays(lastDate, nextDayInWeek - currentDay);
  }

  // Jump to next interval week, first selected day
  const nextWeekStart = addWeeks(lastDate, interval);
  const firstDay = sortedDays[0];
  const currentDayOfWeek = getDay(nextWeekStart);
  let daysToAdd = firstDay - currentDayOfWeek;
  if (daysToAdd < 0) daysToAdd += 7;

  return addDays(nextWeekStart, daysToAdd);
}

/**
 * Calculate next occurrence for monthly patterns
 */
function calculateMonthlyNext(lastDate: Date, recurrence: RecurrenceConfig): Date {
  const { interval = 1, dayOfMonth, weekOfMonth, dayOfWeekInMonth } = recurrence;

  // Mode 1: Simple - just add months
  if (dayOfMonth === undefined && weekOfMonth === undefined) {
    return addMonths(lastDate, interval);
  }

  // Mode 2: Specific date (e.g., 15th of month)
  if (dayOfMonth !== undefined) {
    const nextMonth = addMonths(lastDate, interval);
    const daysInMonth = getDaysInMonth(nextMonth);
    const actualDay = Math.min(dayOfMonth, daysInMonth); // Clamp to last day
    return setDate(nextMonth, actualDay);
  }

  // Mode 3: Nth weekday (e.g., 3rd Monday or Last Friday)
  if (weekOfMonth !== undefined && dayOfWeekInMonth !== undefined) {
    return findNthWeekdayOfMonth(lastDate, weekOfMonth, dayOfWeekInMonth, interval);
  }

  return addMonths(lastDate, interval); // Fallback
}

/**
 * Calculate the next occurrence date based on recurrence configuration
 * Returns date normalized to start of day (midnight) for consistent scheduling
 */
export function calculateNextOccurrence(
  lastDate: Date,
  recurrence: RecurrenceConfig
): Date {
  // Handle undefined pattern (for backwards compatibility)
  if (!recurrence.pattern) {
    console.warn('Recurrence pattern is undefined, defaulting to DAILY');
    return startOfDay(addDays(lastDate, recurrence.interval || 1));
  }

  let nextDate: Date;

  switch (recurrence.pattern) {
    case RecurrencePattern.DAILY:
      nextDate = addDays(lastDate, recurrence.interval || 1);
      break;

    case RecurrencePattern.WEEKLY:
      nextDate = calculateWeeklyNext(lastDate, recurrence);
      break;

    case RecurrencePattern.MONTHLY:
      nextDate = calculateMonthlyNext(lastDate, recurrence);
      break;

    default:
      throw new Error(`Unknown pattern: ${recurrence.pattern}`);
  }

  // Normalize to start of day (midnight) for consistent scheduling
  return startOfDay(nextDate);
}

/**
 * Check if a recurring task should generate a new instance
 * Compares normalized dates (start of day) to ensure consistent behavior
 */
export function shouldGenerateInstance(
  lastGeneratedDate: Date | undefined,
  recurrence: RecurrenceConfig,
  now: Date = new Date()
): boolean {
  if (!lastGeneratedDate) {
    return true; // First instance - create immediately
  }

  // Normalize all dates to start of day for consistent comparison
  const today = startOfDay(now);
  const nextOccurrence = calculateNextOccurrence(lastGeneratedDate, recurrence);

  return today >= nextOccurrence;
}

/**
 * Format a recurrence config as human-readable text
 */
export function formatRecurrence(recurrence: RecurrenceConfig): string {
  const { pattern, interval = 1, daysOfWeek, dayOfMonth, weekOfMonth, dayOfWeekInMonth } = recurrence;

  // Daily pattern
  if (pattern === RecurrencePattern.DAILY) {
    return interval === 1 ? 'Daily' : `Every ${interval} days`;
  }

  // Weekly pattern - Advanced (specific days)
  if (pattern === RecurrencePattern.WEEKLY && daysOfWeek?.length) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = daysOfWeek.map(d => dayNames[d]).join(', ');
    return `Weekly on ${days}`;
  }

  // Weekly pattern - Simple
  if (pattern === RecurrencePattern.WEEKLY) {
    return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
  }

  // Monthly pattern - Specific date
  if (pattern === RecurrencePattern.MONTHLY && dayOfMonth !== undefined) {
    return `Monthly on the ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}`;
  }

  // Monthly pattern - Nth weekday
  if (pattern === RecurrencePattern.MONTHLY && weekOfMonth !== undefined && dayOfWeekInMonth !== undefined) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const occurrenceNames = ['Last', '1st', '2nd', '3rd', '4th', '5th'];
    const occurrence = weekOfMonth === 0 ? 'Last' : occurrenceNames[weekOfMonth];
    return `Monthly on the ${occurrence} ${dayNames[dayOfWeekInMonth]}`;
  }

  // Monthly pattern - Simple
  if (pattern === RecurrencePattern.MONTHLY) {
    return interval === 1 ? 'Monthly' : `Every ${interval} months`;
  }

  return 'Unknown';
}

/**
 * Get ordinal suffix (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Format recurrence pattern with enhanced detail
 * Extends existing formatRecurrence with more detail
 */
export function formatRecurrenceDetailed(recurrence: RecurrenceConfig): string {
  const base = formatRecurrence(recurrence);

  // Add days of week for weekly patterns
  if (recurrence.pattern === RecurrencePattern.WEEKLY && recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
    const dayNames = recurrence.daysOfWeek
      .map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
      .join(', ');
    return `${base} on ${dayNames}`;
  }

  // Add day of month for monthly patterns
  if (recurrence.pattern === RecurrencePattern.MONTHLY && recurrence.dayOfMonth) {
    return `${base} on the ${recurrence.dayOfMonth}${getOrdinalSuffix(recurrence.dayOfMonth)}`;
  }

  return base;
}

/**
 * Format next occurrence date relative to now
 */
export function formatNextOccurrence(date: Date | null | undefined): string {
  if (!date) return 'Not scheduled';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 0 && diffDays > -1) return 'Today';
  if (diffDays < 0) return 'Overdue';
  if (diffDays < 7) return `In ${diffDays} days`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Get date for "today" at start of day
 */
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get date for "tomorrow" at start of day
 */
export function getTomorrow(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Get date for next Monday at start of day
 * If today is Monday, returns next week's Monday
 */
export function getNextMonday(): Date {
  const date = new Date();
  const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate days until next Monday
  // If today is Monday (1), add 7 days to get next Monday
  // Otherwise, add days to reach Monday
  const daysUntilMonday = currentDay === 1 ? 7 : (1 + 7 - currentDay) % 7 || 7;

  date.setDate(date.getDate() + daysUntilMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}
