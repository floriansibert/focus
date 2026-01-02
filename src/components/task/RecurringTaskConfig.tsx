import { useState } from 'react';
import { RecurrencePattern, type RecurrenceConfig } from '../../types/task';
import { formatRecurrence } from '../../utils/date';

interface RecurringTaskConfigProps {
  isRecurring: boolean;
  recurrence: RecurrenceConfig | undefined;
  onRecurringChange: (isRecurring: boolean) => void;
  onRecurrenceChange: (recurrence: RecurrenceConfig) => void;
}

type MonthlyMode = 'simple' | 'date' | 'weekday';

interface WeeklyDayPickerProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

function WeeklyDayPicker({ selectedDays, onChange }: WeeklyDayPickerProps) {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayValues = [1, 2, 3, 4, 5, 6, 0]; // Monday-Sunday

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Repeat on
      </label>
      <div className="grid grid-cols-7 gap-2">
        {dayValues.map((day, index) => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            title={dayNames[index]}
            className={`
              w-10 h-10 rounded-full text-sm font-medium transition-all
              ${
                selectedDays.includes(day)
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500'
              }
            `}
          >
            {dayLabels[index]}
          </button>
        ))}
      </div>
      {selectedDays.length === 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-500">
          Select at least one day or leave empty for simple weekly pattern
        </p>
      )}
    </div>
  );
}

interface MonthlyAdvancedOptionsProps {
  mode: MonthlyMode;
  onModeChange: (mode: MonthlyMode) => void;
  recurrence: RecurrenceConfig;
  onChange: (recurrence: RecurrenceConfig) => void;
}

function MonthlyAdvancedOptions({ mode, onModeChange, recurrence, onChange }: MonthlyAdvancedOptionsProps) {
  const handleModeChange = (newMode: MonthlyMode) => {
    onModeChange(newMode);

    // Clear advanced fields when switching to simple mode
    if (newMode === 'simple') {
      const { dayOfMonth, weekOfMonth, dayOfWeekInMonth, ...rest } = recurrence;
      onChange(rest);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Repeat by
      </label>

      {/* Mode Selection: Radio buttons */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={mode === 'simple'}
            onChange={() => handleModeChange('simple')}
            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Month interval only</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={mode === 'date'}
            onChange={() => handleModeChange('date')}
            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Specific date of month</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={mode === 'weekday'}
            onChange={() => handleModeChange('weekday')}
            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Specific day pattern</span>
        </label>
      </div>

      {/* Date mode: Day of month picker */}
      {mode === 'date' && (
        <div className="ml-6 space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Day of month
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={recurrence.dayOfMonth || 1}
            onChange={e => {
              const { weekOfMonth, dayOfWeekInMonth, ...rest } = recurrence;
              onChange({ ...rest, dayOfMonth: parseInt(e.target.value) || 1 });
            }}
            className="
              w-20 px-3 py-2 rounded-lg border
              bg-white dark:bg-gray-700
              border-gray-300 dark:border-gray-600
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            "
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            For months with fewer days, the last day will be used
          </p>
        </div>
      )}

      {/* Weekday mode: Occurrence + Day selectors */}
      {mode === 'weekday' && (
        <div className="ml-6 space-y-3">
          {/* Occurrence: 1st, 2nd, 3rd, 4th, 5th, Last */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Occurrence
            </label>
            <select
              value={recurrence.weekOfMonth ?? 1}
              onChange={e => {
                const { dayOfMonth, ...rest } = recurrence;
                onChange({
                  ...rest,
                  weekOfMonth: parseInt(e.target.value),
                  dayOfWeekInMonth: recurrence.dayOfWeekInMonth ?? 1,
                });
              }}
              className="
                w-full px-3 py-2 rounded-lg border
                bg-white dark:bg-gray-700
                border-gray-300 dark:border-gray-600
                text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
            >
              <option value="1">1st</option>
              <option value="2">2nd</option>
              <option value="3">3rd</option>
              <option value="4">4th</option>
              <option value="5">5th</option>
              <option value="0">Last</option>
            </select>
          </div>

          {/* Day of week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Day of week
            </label>
            <select
              value={recurrence.dayOfWeekInMonth ?? 1}
              onChange={e => {
                const { dayOfMonth, ...rest } = recurrence;
                onChange({
                  ...rest,
                  weekOfMonth: recurrence.weekOfMonth ?? 1,
                  dayOfWeekInMonth: parseInt(e.target.value),
                });
              }}
              className="
                w-full px-3 py-2 rounded-lg border
                bg-white dark:bg-gray-700
                border-gray-300 dark:border-gray-600
                text-gray-900 dark:text-gray-100
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              "
            >
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
            </select>
          </div>

          {recurrence.weekOfMonth === 5 && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              If a month doesn't have a 5th occurrence, it will skip to the next month
            </p>
          )}
        </div>
      )}
    </div>
  );
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

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [monthlyMode, setMonthlyMode] = useState<MonthlyMode>(() => {
    if (currentRecurrence.dayOfMonth !== undefined) return 'date';
    if (currentRecurrence.weekOfMonth !== undefined) return 'weekday';
    return 'simple';
  });

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

          {/* Advanced Options Toggle */}
          {(currentRecurrence.pattern === RecurrencePattern.WEEKLY ||
            currentRecurrence.pattern === RecurrencePattern.MONTHLY) && (
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showAdvanced ? 'Hide' : 'Show'} advanced options
            </button>
          )}

          {/* WEEKLY ADVANCED */}
          {showAdvanced && currentRecurrence.pattern === RecurrencePattern.WEEKLY && (
            <WeeklyDayPicker
              selectedDays={currentRecurrence.daysOfWeek || []}
              onChange={(days) => {
                onRecurrenceChange({ ...currentRecurrence, daysOfWeek: days });
              }}
            />
          )}

          {/* MONTHLY ADVANCED */}
          {showAdvanced && currentRecurrence.pattern === RecurrencePattern.MONTHLY && (
            <MonthlyAdvancedOptions
              mode={monthlyMode}
              onModeChange={setMonthlyMode}
              recurrence={currentRecurrence}
              onChange={onRecurrenceChange}
            />
          )}

          {/* Preview */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Pattern:</strong> {formatRecurrence(currentRecurrence)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              A new instance will be created automatically when the previous one is completed or when the due date arrives.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
