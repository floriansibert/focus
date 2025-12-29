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
