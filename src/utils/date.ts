import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
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
 * Calculate next occurrence for yearly patterns
 */
function calculateYearlyNext(lastDate: Date, recurrence: RecurrenceConfig): Date {
  const { interval = 1, monthOfYear, dayOfMonth, weekOfMonth, dayOfWeekInMonth } = recurrence;

  // Mode 1: Simple - preserve original month/day
  if (monthOfYear === undefined) {
    return addYears(lastDate, interval);
  }

  // Mode 2: Specific date (e.g., January 15 every year)
  if (dayOfMonth !== undefined && weekOfMonth === undefined) {
    const nextYear = addYears(lastDate, interval);
    const daysInMonth = getDaysInMonth(new Date(nextYear.getFullYear(), monthOfYear));
    const actualDay = Math.min(dayOfMonth, daysInMonth);
    return new Date(nextYear.getFullYear(), monthOfYear, actualDay);
  }

  // Mode 3: Nth weekday of specific month (e.g., 1st Monday of January)
  if (weekOfMonth !== undefined && dayOfWeekInMonth !== undefined) {
    const nextYear = addYears(lastDate, interval);
    const targetYearMonth = new Date(nextYear.getFullYear(), monthOfYear, 1);
    const prevMonthEnd = new Date(targetYearMonth.getFullYear(), targetYearMonth.getMonth(), 0);
    return findNthWeekdayOfMonth(prevMonthEnd, weekOfMonth, dayOfWeekInMonth, 1);
  }

  return addYears(lastDate, interval); // Fallback
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

    case RecurrencePattern.YEARLY:
      nextDate = calculateYearlyNext(lastDate, recurrence);
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
  now: Date = new Date(),
  totalInstancesGenerated: number = 0
): boolean {
  if (!lastGeneratedDate) {
    return true; // First instance - create immediately
  }

  // Check if we've hit the occurrence limit
  if (recurrence.endAfterOccurrences && totalInstancesGenerated >= recurrence.endAfterOccurrences) {
    return false;
  }

  // Normalize all dates to start of day for consistent comparison
  const today = startOfDay(now);
  const nextOccurrence = calculateNextOccurrence(lastGeneratedDate, recurrence);

  // Check if next occurrence is past end date
  if (recurrence.endDate && nextOccurrence > recurrence.endDate) {
    return false;
  }

  return today >= nextOccurrence;
}

/**
 * Calculate the next N occurrences for preview purposes
 * Respects end date and occurrence count limits
 */
export function calculateNextNOccurrences(
  startDate: Date,
  recurrence: RecurrenceConfig,
  count: number = 5,
  now: Date = new Date()
): { dates: Date[]; hasMore: boolean; totalPossible: number | null } {
  const dates: Date[] = [];
  let currentDate = startDate;
  let occurrenceCount = 0;
  const maxIterations = 100; // Safety limit

  for (let i = 0; i < maxIterations && dates.length < count; i++) {
    const nextDate = calculateNextOccurrence(currentDate, recurrence);
    occurrenceCount++;

    // Check end conditions
    if (recurrence.endDate && nextDate > recurrence.endDate) {
      break;
    }

    if (recurrence.endAfterOccurrences && occurrenceCount > recurrence.endAfterOccurrences) {
      break;
    }

    // Only include future dates
    if (nextDate >= startOfDay(now)) {
      dates.push(nextDate);
    }

    currentDate = nextDate;
  }

  // Calculate if there are more occurrences beyond what we're showing
  const hasMore = recurrence.endAfterOccurrences
    ? occurrenceCount < recurrence.endAfterOccurrences
    : !recurrence.endDate;

  const totalPossible = recurrence.endAfterOccurrences || null;

  return { dates, hasMore, totalPossible };
}

/**
 * Format a date for preview display (e.g., "Mon, Jan 15, 2026")
 */
export function formatPreviewDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a recurrence config as human-readable text
 */
export function formatRecurrence(recurrence: RecurrenceConfig): string {
  const { pattern, interval = 1, daysOfWeek, dayOfMonth, weekOfMonth, dayOfWeekInMonth, monthOfYear } = recurrence;

  // Daily pattern
  if (pattern === RecurrencePattern.DAILY) {
    return interval === 1 ? 'Daily' : `Every ${interval} days`;
  }

  // Weekly pattern - Advanced (specific days)
  if (pattern === RecurrencePattern.WEEKLY && daysOfWeek?.length) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = daysOfWeek.map(d => dayNames[d]).join(', ');
    if (interval === 1) {
      return `Weekly on ${days}`;
    }
    return `Every ${interval} weeks on ${days}`;
  }

  // Weekly pattern - Simple
  if (pattern === RecurrencePattern.WEEKLY) {
    return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
  }

  // Monthly pattern - Specific date
  if (pattern === RecurrencePattern.MONTHLY && dayOfMonth !== undefined) {
    const prefix = interval === 1 ? 'Monthly' : `Every ${interval} months`;
    return `${prefix} on the ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}`;
  }

  // Monthly pattern - Nth weekday
  if (pattern === RecurrencePattern.MONTHLY && weekOfMonth !== undefined && dayOfWeekInMonth !== undefined) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const occurrenceNames = ['Last', '1st', '2nd', '3rd', '4th', '5th'];
    const occurrence = weekOfMonth === 0 ? 'Last' : occurrenceNames[weekOfMonth];
    const prefix = interval === 1 ? 'Monthly' : `Every ${interval} months`;
    return `${prefix} on the ${occurrence} ${dayNames[dayOfWeekInMonth]}`;
  }

  // Monthly pattern - Simple
  if (pattern === RecurrencePattern.MONTHLY) {
    return interval === 1 ? 'Monthly' : `Every ${interval} months`;
  }

  // Yearly pattern - Specific date
  if (pattern === RecurrencePattern.YEARLY && monthOfYear !== undefined && dayOfMonth !== undefined && weekOfMonth === undefined) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const prefix = interval === 1 ? 'Yearly' : `Every ${interval} years`;
    return `${prefix} on ${monthNames[monthOfYear]} ${dayOfMonth}`;
  }

  // Yearly pattern - Nth weekday of month
  if (pattern === RecurrencePattern.YEARLY && monthOfYear !== undefined && weekOfMonth !== undefined && dayOfWeekInMonth !== undefined) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const occurrenceNames = ['Last', '1st', '2nd', '3rd', '4th', '5th'];
    const occurrence = weekOfMonth === 0 ? 'Last' : occurrenceNames[weekOfMonth];
    const prefix = interval === 1 ? 'Yearly' : `Every ${interval} years`;
    return `${prefix} on the ${occurrence} ${dayNames[dayOfWeekInMonth]} of ${monthNames[monthOfYear]}`;
  }

  // Yearly pattern - Simple
  if (pattern === RecurrencePattern.YEARLY) {
    return interval === 1 ? 'Yearly' : `Every ${interval} years`;
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
 * Now just delegates to formatRecurrence since it includes all details
 */
export function formatRecurrenceDetailed(recurrence: RecurrenceConfig): string {
  return formatRecurrence(recurrence);
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

/**
 * Get date range for "today"
 */
export function getTodayRange(): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  return { start: today, end };
}

/**
 * Get date range for "yesterday"
 */
export function getYesterdayRange(): { start: Date; end: Date } {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const end = new Date(yesterday);
  end.setHours(23, 59, 59, 999);

  return { start: yesterday, end };
}

/**
 * Get date range for "this week" (Monday to Sunday of current week)
 */
export function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate days since Monday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const start = new Date(now);
  start.setDate(start.getDate() - daysSinceMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6); // Sunday
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get date range for "last week" (Monday to Sunday of previous week)
 */
export function getLastWeekRange(): { start: Date; end: Date } {
  const thisWeek = getThisWeekRange();

  const start = new Date(thisWeek.start);
  start.setDate(start.getDate() - 7);

  const end = new Date(thisWeek.start);
  end.setDate(end.getDate() - 1); // Sunday of last week
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get date range for "2 weeks ago"
 */
export function getTwoWeeksAgoRange(): { start: Date; end: Date } {
  const lastWeek = getLastWeekRange();

  const start = new Date(lastWeek.start);
  start.setDate(start.getDate() - 7);

  const end = new Date(lastWeek.end);
  end.setDate(end.getDate() - 7);

  return { start, end };
}

/**
 * Get date range for "this month" (first to last day of current month)
 */
export function getThisMonthRange(): { start: Date; end: Date } {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get date range for "last month" (first to last day of previous month)
 */
export function getLastMonthRange(): { start: Date; end: Date } {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Calculate date range based on completed view timeframe
 */
export function calculateCompletedViewDateRange(
  timeframe: 'today' | 'yesterday' | 'thisweek' | 'thismonth' | 'lastweek' | '2weeksago' | 'lastmonth' | 'custom',
  customRange: { start: Date; end: Date } | null
): { start: Date; end: Date } {
  switch (timeframe) {
    case 'today':
      return getTodayRange();
    case 'yesterday':
      return getYesterdayRange();
    case 'thisweek':
      return getThisWeekRange();
    case 'thismonth':
      return getThisMonthRange();
    case 'lastweek':
      return getLastWeekRange();
    case '2weeksago':
      return getTwoWeeksAgoRange();
    case 'lastmonth':
      return getLastMonthRange();
    case 'custom':
      if (customRange) return customRange;
      // Fallback to last week if custom range not provided
      return getLastWeekRange();
    default:
      return getLastWeekRange();
  }
}

/**
 * Format timeframe as human-readable label
 */
export function formatCompletedViewTimeframe(timeframe: string): string {
  switch (timeframe) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'thisweek':
      return 'This Week';
    case 'thismonth':
      return 'This Month';
    case 'lastweek':
      return 'Last Week';
    case '2weeksago':
      return '2 Weeks Ago';
    case 'lastmonth':
      return 'Last Month';
    case 'custom':
      return 'Custom';
    default:
      return 'Unknown';
  }
}
