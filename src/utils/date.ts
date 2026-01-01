import { RecurrencePattern, type RecurrenceConfig } from '../types/task';

/**
 * Calculate the next occurrence date based on recurrence configuration
 */
export function calculateNextOccurrence(
  lastDate: Date,
  recurrence: RecurrenceConfig
): Date {
  const next = new Date(lastDate);

  // Handle undefined pattern (for backwards compatibility)
  if (!recurrence.pattern) {
    console.warn('Recurrence pattern is undefined, defaulting to DAILY');
    next.setDate(next.getDate() + (recurrence.interval || 1));
    return next;
  }

  switch (recurrence.pattern) {
    case RecurrencePattern.DAILY:
      next.setDate(next.getDate() + (recurrence.interval || 1));
      break;

    case RecurrencePattern.WEEKLY:
      next.setDate(next.getDate() + 7 * (recurrence.interval || 1));
      break;

    case RecurrencePattern.MONTHLY:
      next.setMonth(next.getMonth() + (recurrence.interval || 1));
      break;

    default:
      throw new Error(`Unknown pattern: ${recurrence.pattern}`);
  }

  return next;
}

/**
 * Check if a recurring task should generate a new instance
 */
export function shouldGenerateInstance(
  lastGeneratedDate: Date | undefined,
  recurrence: RecurrenceConfig,
  now: Date = new Date()
): boolean {
  if (!lastGeneratedDate) {
    return true; // First instance
  }

  const nextOccurrence = calculateNextOccurrence(lastGeneratedDate, recurrence);
  return now >= nextOccurrence;
}

/**
 * Format a recurrence config as human-readable text
 */
export function formatRecurrence(recurrence: RecurrenceConfig): string {
  const interval = recurrence.interval || 1;

  if (interval === 1) {
    switch (recurrence.pattern) {
      case RecurrencePattern.DAILY:
        return 'Daily';
      case RecurrencePattern.WEEKLY:
        return 'Weekly';
      case RecurrencePattern.MONTHLY:
        return 'Monthly';
    }
  }

  switch (recurrence.pattern) {
    case RecurrencePattern.DAILY:
      return `Every ${interval} days`;
    case RecurrencePattern.WEEKLY:
      return `Every ${interval} weeks`;
    case RecurrencePattern.MONTHLY:
      return `Every ${interval} months`;
    default:
      return 'Unknown';
  }
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
