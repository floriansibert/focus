import { RecurrencePattern, type RecurrenceConfig } from '../../types/task';

interface RecurringTaskConfigProps {
  isRecurring: boolean;
  recurrence: RecurrenceConfig | undefined;
  onRecurringChange: (isRecurring: boolean) => void;
  onRecurrenceChange: (recurrence: RecurrenceConfig) => void;
}

export function RecurringTaskConfig({
  isRecurring,
  recurrence,
  onRecurringChange,
  onRecurrenceChange,
}: RecurringTaskConfigProps) {
  const defaultRecurrence: RecurrenceConfig = {
    pattern: RecurrencePattern.DAILY,
    interval: 1,
  };

  const currentRecurrence = recurrence || defaultRecurrence;

  const getPatternLabel = (pattern: RecurrencePattern): string => {
    switch (pattern) {
      case RecurrencePattern.DAILY:
        return 'Daily';
      case RecurrencePattern.WEEKLY:
        return 'Weekly';
      case RecurrencePattern.MONTHLY:
        return 'Monthly';
      default:
        return 'Custom';
    }
  };

  const getIntervalLabel = (pattern: RecurrencePattern, interval: number): string => {
    switch (pattern) {
      case RecurrencePattern.DAILY:
        return interval === 1 ? 'day' : 'days';
      case RecurrencePattern.WEEKLY:
        return interval === 1 ? 'week' : 'weeks';
      case RecurrencePattern.MONTHLY:
        return interval === 1 ? 'month' : 'months';
      default:
        return 'intervals';
    }
  };

  const handleFrequencyChange = (pattern: RecurrenceConfig['pattern']) => {
    onRecurrenceChange({
      ...currentRecurrence,
      pattern,
    });
  };

  const handleIntervalChange = (interval: number) => {
    onRecurrenceChange({
      ...currentRecurrence,
      interval: Math.max(1, interval),
    });
  };

  return (
    <div className="space-y-3">
      {/* Enable Recurring Checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => onRecurringChange(e.target.checked)}
          className="
            w-4 h-4 rounded border-gray-300 dark:border-gray-600
            text-blue-600 focus:ring-2 focus:ring-blue-500
            dark:bg-gray-700 cursor-pointer
          "
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Make this a recurring task
        </span>
      </label>

      {/* Recurrence Configuration (shown when enabled) */}
      {isRecurring && (
        <div className="ml-6 space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Frequency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repeat
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([RecurrencePattern.DAILY, RecurrencePattern.WEEKLY, RecurrencePattern.MONTHLY]).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => handleFrequencyChange(freq)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      currentRecurrence.pattern === freq
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-500'
                    }
                  `}
                >
                  {getPatternLabel(freq)}
                </button>
              ))}
            </div>
          </div>

          {/* Interval Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Every
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={currentRecurrence.interval || 1}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                className="
                  w-20 px-3 py-2 rounded-lg border
                  bg-white dark:bg-gray-700
                  border-gray-300 dark:border-gray-600
                  text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                "
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getIntervalLabel(currentRecurrence.pattern, currentRecurrence.interval)}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            A new instance will be created automatically when the previous one is completed or when the due date arrives.
          </p>
        </div>
      )}
    </div>
  );
}
