import { useState, useMemo, useEffect } from 'react';
import { addMonths } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { RecurrencePattern, type RecurrenceConfig } from '../../types/task';
import { formatRecurrence, calculateNextNOccurrences, formatPreviewDate } from '../../utils/date';
import { DatePicker } from '../ui/DatePicker';

interface RecurringPreset {
  id: string;
  label: string;
  config: Omit<RecurrenceConfig, 'nextOccurrence'>;
  description?: string;
}

const RECURRING_PRESETS: RecurringPreset[] = [
  // Common patterns
  {
    id: 'daily',
    label: 'Daily',
    config: { pattern: RecurrencePattern.DAILY, interval: 1 }
  },
  {
    id: 'weekdays',
    label: 'Weekdays',
    description: 'Mon-Fri',
    config: {
      pattern: RecurrencePattern.WEEKLY,
      interval: 1,
      daysOfWeek: [1, 2, 3, 4, 5] // Mon-Fri
    }
  },
  {
    id: 'weekly',
    label: 'Weekly',
    description: 'Mondays',
    config: { pattern: RecurrencePattern.WEEKLY, interval: 1, daysOfWeek: [1] }
  },
  {
    id: 'biweekly',
    label: 'Bi-weekly',
    description: 'Mondays',
    config: { pattern: RecurrencePattern.WEEKLY, interval: 2, daysOfWeek: [1] }
  },
  {
    id: 'monthly',
    label: 'Monthly',
    description: '1st day',
    config: { pattern: RecurrencePattern.MONTHLY, interval: 1, dayOfMonth: 1 }
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    description: '1st Mon',
    config: {
      pattern: RecurrencePattern.MONTHLY,
      interval: 3,
      weekOfMonth: 1,
      dayOfWeekInMonth: 1
    }
  },

  // Advanced patterns
  {
    id: 'first-monday',
    label: '1st Monday',
    description: 'of each month',
    config: {
      pattern: RecurrencePattern.MONTHLY,
      interval: 1,
      weekOfMonth: 1,
      dayOfWeekInMonth: 1 // Monday
    }
  },
  {
    id: 'fifteenth',
    label: '15th',
    description: 'of each month',
    config: {
      pattern: RecurrencePattern.MONTHLY,
      interval: 1,
      dayOfMonth: 15
    }
  },
  {
    id: 'last-friday',
    label: 'Last Friday',
    description: 'of each month',
    config: {
      pattern: RecurrencePattern.MONTHLY,
      interval: 1,
      weekOfMonth: 0, // Last
      dayOfWeekInMonth: 5 // Friday
    }
  },
  {
    id: 'last-day',
    label: 'Last day',
    description: 'of each month',
    config: {
      pattern: RecurrencePattern.MONTHLY,
      interval: 1,
      dayOfMonth: 31 // Will be clamped to last day
    }
  },
  {
    id: 'yearly',
    label: 'Yearly',
    config: { pattern: RecurrencePattern.YEARLY, interval: 1 }
  },
];

interface RecurringTaskConfigProps {
  isRecurring: boolean;
  recurrence: RecurrenceConfig | undefined;
  onRecurringChange: (isRecurring: boolean) => void;
  onRecurrenceChange: (recurrence: RecurrenceConfig) => void;
  disabled?: boolean;
  disabledReason?: string;
  hideCheckbox?: boolean; // Hide checkbox and label (for templates)
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
      // Prevent deselecting the last day - at least one must be selected
      if (selectedDays.length > 1) {
        onChange(selectedDays.filter(d => d !== day));
      }
    } else {
      onChange([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="space-y-2">
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
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Select which day(s) of the week to repeat
      </p>
    </div>
  );
}

type EndConditionMode = 'never' | 'date' | 'count';

interface EndConditionSelectorProps {
  recurrence: RecurrenceConfig;
  onChange: (recurrence: RecurrenceConfig) => void;
}

function EndConditionSelector({ recurrence, onChange }: EndConditionSelectorProps) {
  // Determine current mode
  const getCurrentMode = (): EndConditionMode => {
    if (recurrence.endAfterOccurrences) return 'count';
    if (recurrence.endDate) return 'date';
    return 'never';
  };

  const [mode, setMode] = useState<EndConditionMode>(getCurrentMode);

  // Collapse state - start expanded if there's an active end condition
  const [isExpanded, setIsExpanded] = useState(() => {
    const currentMode = getCurrentMode();
    return currentMode === 'date' || currentMode === 'count';
  });

  // Auto-expand when user sets an end condition
  useEffect(() => {
    if (mode !== 'never') {
      setIsExpanded(true);
    }
  }, [mode]);

  const handleModeChange = (newMode: EndConditionMode) => {
    setMode(newMode);

    // Clear end conditions based on mode
    if (newMode === 'never') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing fields
      const { endDate: _endDate, endAfterOccurrences: _endAfterOccurrences, ...rest } = recurrence;
      onChange(rest);
    } else if (newMode === 'date') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing field
      const { endAfterOccurrences: _endAfterOccurrences, ...rest } = recurrence;
      onChange({ ...rest, endDate: recurrence.endDate || addMonths(new Date(), 3) });
    } else if (newMode === 'count') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing field
      const { endDate: _endDate, ...rest } = recurrence;
      onChange({ ...rest, endAfterOccurrences: recurrence.endAfterOccurrences || 10 });
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      onChange({ ...recurrence, endDate: date });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing field
      const { endDate: _endDate, ...rest } = recurrence;
      onChange(rest);
    }
  };

  const handleOccurrenceCountChange = (count: number) => {
    onChange({ ...recurrence, endAfterOccurrences: Math.max(1, count) });
  };

  // Helper to format date for summary
  const formatShortDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper to get summary text for collapsed state
  const getSummaryText = (): string => {
    if (mode === 'date' && recurrence.endDate) {
      return `On ${formatShortDate(recurrence.endDate)}`;
    }
    if (mode === 'count' && recurrence.endAfterOccurrences) {
      return `After ${recurrence.endAfterOccurrences} occurrence${recurrence.endAfterOccurrences === 1 ? '' : 's'}`;
    }
    return 'Never';
  };

  return (
    <div className="space-y-3">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 px-1 -mx-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            size={16}
            className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            End condition
          </span>
        </div>

        {/* Summary text when collapsed */}
        {!isExpanded && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getSummaryText()}
          </span>
        )}
      </button>

      {/* Radio options - only show when expanded */}
      {isExpanded && (
        <div className="space-y-3 pl-6">
        {/* Option 1: Never ends */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={mode === 'never'}
            onChange={() => handleModeChange('never')}
            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Never ends</span>
        </label>

        {/* Option 2: On date - inline date picker */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'date'}
              onChange={() => handleModeChange('date')}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">On date</span>
            <DatePicker
              value={recurrence.endDate}
              onChange={handleEndDateChange}
              compact
            />
          </label>
          {mode === 'date' && recurrence.endDate && recurrence.endDate < new Date() && (
            <p className="text-xs text-amber-600 dark:text-amber-500 ml-6">
              End date should be in the future
            </p>
          )}
        </div>

        {/* Option 3: After N occurrences - inline input */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={mode === 'count'}
            onChange={() => handleModeChange('count')}
            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">After</span>
          <input
            type="number"
            min="1"
            max="999"
            value={recurrence.endAfterOccurrences || 10}
            onChange={(e) => handleOccurrenceCountChange(parseInt(e.target.value) || 1)}
            className="
              w-16 px-2 py-1 text-sm rounded border
              bg-white dark:bg-gray-700
              border-gray-300 dark:border-gray-600
              text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            "
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            occurrence{(recurrence.endAfterOccurrences || 1) !== 1 ? 's' : ''}
          </span>
        </label>
        </div>
      )}
    </div>
  );
}

interface RecurrencePreviewProps {
  recurrence: RecurrenceConfig;
  dueDate?: Date;
}

function RecurrencePreview({ recurrence, dueDate }: RecurrencePreviewProps) {
  // Calculate next 5 occurrences
  const { dates, hasMore, totalPossible } = useMemo(() => {
    const startDate = dueDate || new Date();
    return calculateNextNOccurrences(startDate, recurrence, 5);
  }, [recurrence, dueDate]);

  if (dates.length === 0) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400">
        No future occurrences (may have reached end condition)
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Next occurrences
      </label>

      <div className="space-y-1">
        {dates.map((date, index) => (
          <div
            key={index}
            className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
          >
            <span className="w-4 text-gray-400">{index + 1}.</span>
            <span className="font-medium">{formatPreviewDate(date)}</span>
          </div>
        ))}

        {hasMore && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic ml-6">
            {totalPossible
              ? `...and ${totalPossible - dates.length} more`
              : '...and more'}
          </p>
        )}

        {!hasMore && totalPossible && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic ml-6">
            (Total: {totalPossible} occurrences)
          </p>
        )}
      </div>
    </div>
  );
}

export function RecurringTaskConfig({
  isRecurring,
  recurrence,
  onRecurringChange,
  onRecurrenceChange,
  disabled = false,
  disabledReason,
  hideCheckbox = false,
}: RecurringTaskConfigProps) {
  const defaultRecurrence: RecurrenceConfig = {
    pattern: RecurrencePattern.DAILY,
    interval: 1,
  };

  const currentRecurrence = recurrence || defaultRecurrence;

  const [monthlyMode, setMonthlyMode] = useState<MonthlyMode>(() => {
    if (currentRecurrence.dayOfMonth !== undefined) return 'date';
    if (currentRecurrence.weekOfMonth !== undefined) return 'weekday';
    return 'simple';
  });

  // Sync monthlyMode when recurrence config changes (e.g., when reopening a task)
  useEffect(() => {
    if (currentRecurrence.pattern === RecurrencePattern.MONTHLY) {
      if (currentRecurrence.dayOfMonth !== undefined) {
        setMonthlyMode('date');
      } else if (currentRecurrence.weekOfMonth !== undefined) {
        setMonthlyMode('weekday');
      } else {
        setMonthlyMode('simple');
      }
    }
  }, [currentRecurrence.pattern, currentRecurrence.dayOfMonth, currentRecurrence.weekOfMonth]);

  const [yearlyMode, setYearlyMode] = useState<'simple' | 'date' | 'weekday'>(() => {
    if (currentRecurrence.monthOfYear !== undefined) {
      if (currentRecurrence.dayOfMonth !== undefined && currentRecurrence.weekOfMonth === undefined) return 'date';
      if (currentRecurrence.weekOfMonth !== undefined) return 'weekday';
    }
    return 'simple';
  });

  // Sync yearlyMode when recurrence config changes (e.g., when reopening a task)
  useEffect(() => {
    if (currentRecurrence.pattern === RecurrencePattern.YEARLY) {
      if (currentRecurrence.monthOfYear !== undefined) {
        if (currentRecurrence.dayOfMonth !== undefined && currentRecurrence.weekOfMonth === undefined) {
          setYearlyMode('date');
        } else if (currentRecurrence.weekOfMonth !== undefined) {
          setYearlyMode('weekday');
        } else {
          setYearlyMode('simple');
        }
      } else {
        setYearlyMode('simple');
      }
    }
  }, [currentRecurrence.pattern, currentRecurrence.monthOfYear, currentRecurrence.dayOfMonth, currentRecurrence.weekOfMonth]);

  const getPatternLabel = (pattern: RecurrencePattern): string => {
    switch (pattern) {
      case RecurrencePattern.DAILY:
        return 'Daily';
      case RecurrencePattern.WEEKLY:
        return 'Weekly';
      case RecurrencePattern.MONTHLY:
        return 'Monthly';
      case RecurrencePattern.YEARLY:
        return 'Yearly';
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
      case RecurrencePattern.YEARLY:
        return interval === 1 ? 'year' : 'years';
      default:
        return 'intervals';
    }
  };

  // Check if current config matches a preset
  const getActivePreset = (config: RecurrenceConfig): string | null => {
    for (const preset of RECURRING_PRESETS) {
      const matches =
        preset.config.pattern === config.pattern &&
        preset.config.interval === config.interval &&
        JSON.stringify(preset.config.daysOfWeek || []) === JSON.stringify(config.daysOfWeek || []) &&
        preset.config.dayOfMonth === config.dayOfMonth &&
        preset.config.weekOfMonth === config.weekOfMonth &&
        preset.config.dayOfWeekInMonth === config.dayOfWeekInMonth &&
        preset.config.monthOfYear === config.monthOfYear;

      if (matches) return preset.id;
    }
    return null;
  };

  const [activePreset, setActivePreset] = useState<string | null>(() =>
    getActivePreset(currentRecurrence)
  );

  const handlePresetSelect = (presetId: string) => {
    const preset = RECURRING_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setActivePreset(presetId);
    onRecurrenceChange({ ...currentRecurrence, ...preset.config });

    // Update monthlyMode state if preset is monthly
    if (preset.config.pattern === RecurrencePattern.MONTHLY) {
      if (preset.config.dayOfMonth !== undefined) {
        setMonthlyMode('date');
      } else if (preset.config.weekOfMonth !== undefined) {
        setMonthlyMode('weekday');
      } else {
        setMonthlyMode('simple');
      }
    }
  };

  const handleCustomChange = (newRecurrence: RecurrenceConfig) => {
    onRecurrenceChange(newRecurrence);
    // Check if still matches a preset
    setActivePreset(getActivePreset(newRecurrence));
  };

  const handleFrequencyChange = (pattern: RecurrenceConfig['pattern']) => {
    handleCustomChange({
      ...currentRecurrence,
      pattern,
    });
  };

  const handleIntervalChange = (interval: number) => {
    handleCustomChange({
      ...currentRecurrence,
      interval: Math.max(1, interval),
    });
  };

  const handleMonthlyModeChange = (mode: MonthlyMode) => {
    setMonthlyMode(mode);

    if (mode === 'simple') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing fields
      const { dayOfMonth: _dayOfMonth, weekOfMonth: _weekOfMonth, dayOfWeekInMonth: _dayOfWeekInMonth, ...rest } = currentRecurrence;
      handleCustomChange(rest);
    } else if (mode === 'date') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing fields
      const { weekOfMonth: _weekOfMonth, dayOfWeekInMonth: _dayOfWeekInMonth, ...rest } = currentRecurrence;
      handleCustomChange({ ...rest, dayOfMonth: 15 });
    } else if (mode === 'weekday') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing field
      const { dayOfMonth: _dayOfMonth, ...rest } = currentRecurrence;
      handleCustomChange({
        ...rest,
        weekOfMonth: 1,
        dayOfWeekInMonth: 1
      });
    }
  };

  const handleMonthlySimpleIntervalChange = (interval: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing fields
    const { dayOfMonth: _dayOfMonth, weekOfMonth: _weekOfMonth, dayOfWeekInMonth: _dayOfWeekInMonth, ...rest } = currentRecurrence;
    handleCustomChange({ ...rest, interval });
    setMonthlyMode('simple');
  };

  const handleMonthlyDateChange = (day: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing fields
    const { weekOfMonth: _weekOfMonth, dayOfWeekInMonth: _dayOfWeekInMonth, ...rest } = currentRecurrence;
    handleCustomChange({ ...rest, dayOfMonth: day });
    setMonthlyMode('date');
  };

  const handleMonthlyWeekChange = (week: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing field
    const { dayOfMonth: _dayOfMonth, ...rest } = currentRecurrence;
    handleCustomChange({
      ...rest,
      weekOfMonth: week,
      dayOfWeekInMonth: currentRecurrence.dayOfWeekInMonth ?? 1
    });
    setMonthlyMode('weekday');
  };

  const handleMonthlyDayChange = (day: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing field
    const { dayOfMonth: _dayOfMonth, ...rest } = currentRecurrence;
    handleCustomChange({
      ...rest,
      weekOfMonth: currentRecurrence.weekOfMonth ?? 1,
      dayOfWeekInMonth: day
    });
    setMonthlyMode('weekday');
  };

  const handleYearlyModeChange = (mode: 'simple' | 'date' | 'weekday') => {
    setYearlyMode(mode);
    if (mode === 'simple') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing fields
      const { monthOfYear: _m, dayOfMonth: _d, weekOfMonth: _w, dayOfWeekInMonth: _dw, ...rest } = currentRecurrence;
      handleCustomChange(rest);
    } else if (mode === 'date') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing fields
      const { weekOfMonth: _w, dayOfWeekInMonth: _dw, ...rest } = currentRecurrence;
      handleCustomChange({ ...rest, monthOfYear: 0, dayOfMonth: 1 });
    } else if (mode === 'weekday') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing field
      const { dayOfMonth: _d, ...rest } = currentRecurrence;
      handleCustomChange({ ...rest, monthOfYear: 0, weekOfMonth: 1, dayOfWeekInMonth: 1 });
    }
  };

  const handleYearlyMonthChange = (month: number) => {
    handleCustomChange({ ...currentRecurrence, monthOfYear: month });
  };

  const handleYearlyDateChange = (day: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing fields
    const { weekOfMonth: _w, dayOfWeekInMonth: _dw, ...rest } = currentRecurrence;
    handleCustomChange({ ...rest, dayOfMonth: day });
    setYearlyMode('date');
  };

  const handleYearlyWeekChange = (week: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing field
    const { dayOfMonth: _d, ...rest } = currentRecurrence;
    handleCustomChange({ ...rest, weekOfMonth: week, dayOfWeekInMonth: currentRecurrence.dayOfWeekInMonth ?? 1 });
    setYearlyMode('weekday');
  };

  const handleYearlyDayChange = (day: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Intentionally removing field
    const { dayOfMonth: _d, ...rest } = currentRecurrence;
    handleCustomChange({ ...rest, weekOfMonth: currentRecurrence.weekOfMonth ?? 1, dayOfWeekInMonth: day });
    setYearlyMode('weekday');
  };

  return (
    <div className="space-y-3">
      {/* Enable Recurring Checkbox (hidden for templates) */}
      {!hideCheckbox && (
        <div>
          <label className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => onRecurringChange(e.target.checked)}
              disabled={disabled}
              className={`
                w-4 h-4 rounded border-gray-300 dark:border-gray-600
                text-blue-600 focus:ring-2 focus:ring-blue-500
                dark:bg-gray-700
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Make this a recurring task
            </span>
          </label>
          {disabled && disabledReason && (
            <p className="mt-1 ml-6 text-xs text-amber-600 dark:text-amber-500">
              {disabledReason}
            </p>
          )}
        </div>
      )}

      {/* Recurrence Configuration (shown when enabled or when checkbox is hidden for templates) */}
      {(isRecurring || hideCheckbox) && (
        <div className="space-y-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* QUICK PRESETS GRID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {RECURRING_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      activePreset === preset.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-500'
                    }
                  `}
                  title={preset.description}
                >
                  <div>{preset.label}</div>
                  {preset.description && (
                    <div className="text-xs opacity-75 mt-0.5">{preset.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* PATTERN SELECTOR */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pattern
            </label>

            {/* Pattern summary */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {formatRecurrence(currentRecurrence)}
            </p>

            <div className="grid grid-cols-4 gap-2">
              {([RecurrencePattern.DAILY, RecurrencePattern.WEEKLY, RecurrencePattern.MONTHLY, RecurrencePattern.YEARLY]).map((freq) => (
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

          {/* DAILY OPTIONS */}
          {currentRecurrence.pattern === RecurrencePattern.DAILY && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Every</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={currentRecurrence.interval || 1}
                  onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                  className="
                    w-16 px-2 py-1 text-sm rounded border
                    bg-white dark:bg-gray-700
                    border-gray-300 dark:border-gray-600
                    text-gray-900 dark:text-gray-100
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  "
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {currentRecurrence.interval === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          )}

          {/* YEARLY OPTIONS */}
          {currentRecurrence.pattern === RecurrencePattern.YEARLY && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="space-y-3">
                {/* Interval */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Every</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={currentRecurrence.interval || 1}
                    onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 text-sm rounded border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentRecurrence.interval === 1 ? 'year' : 'years'}
                  </span>
                </div>

                {/* Date selection */}
                <div className="space-y-2">
                  {/* Option 1: Specific date */}
                  <label className="flex items-center gap-2 cursor-pointer flex-wrap">
                    <input
                      type="radio"
                      checked={yearlyMode === 'date'}
                      onChange={() => handleYearlyModeChange('date')}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">On</span>
                    <select
                      value={currentRecurrence.monthOfYear ?? 0}
                      onChange={(e) => handleYearlyMonthChange(parseInt(e.target.value))}
                      className="px-2 py-1 text-sm rounded border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">January</option>
                      <option value="1">February</option>
                      <option value="2">March</option>
                      <option value="3">April</option>
                      <option value="4">May</option>
                      <option value="5">June</option>
                      <option value="6">July</option>
                      <option value="7">August</option>
                      <option value="8">September</option>
                      <option value="9">October</option>
                      <option value="10">November</option>
                      <option value="11">December</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={currentRecurrence.dayOfMonth || 1}
                      onChange={(e) => handleYearlyDateChange(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-sm rounded border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </label>

                  {/* Option 2: Weekday pattern */}
                  <label className="flex items-center gap-2 cursor-pointer flex-wrap">
                    <input
                      type="radio"
                      checked={yearlyMode === 'weekday'}
                      onChange={() => handleYearlyModeChange('weekday')}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">On</span>
                    <select
                      value={currentRecurrence.weekOfMonth ?? 1}
                      onChange={(e) => handleYearlyWeekChange(parseInt(e.target.value))}
                      className="px-2 py-1 text-sm rounded border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="1">1st</option>
                      <option value="2">2nd</option>
                      <option value="3">3rd</option>
                      <option value="4">4th</option>
                      <option value="5">5th</option>
                      <option value="0">Last</option>
                    </select>
                    <select
                      value={currentRecurrence.dayOfWeekInMonth ?? 1}
                      onChange={(e) => handleYearlyDayChange(parseInt(e.target.value))}
                      className="px-2 py-1 text-sm rounded border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                    <span className="text-sm text-gray-700 dark:text-gray-300">of</span>
                    <select
                      value={currentRecurrence.monthOfYear ?? 0}
                      onChange={(e) => handleYearlyMonthChange(parseInt(e.target.value))}
                      className="px-2 py-1 text-sm rounded border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="0">January</option>
                      <option value="1">February</option>
                      <option value="2">March</option>
                      <option value="3">April</option>
                      <option value="4">May</option>
                      <option value="5">June</option>
                      <option value="6">July</option>
                      <option value="7">August</option>
                      <option value="8">September</option>
                      <option value="9">October</option>
                      <option value="10">November</option>
                      <option value="11">December</option>
                    </select>
                  </label>

                  {/* Warning for 5th occurrence */}
                  {yearlyMode === 'weekday' && currentRecurrence.weekOfMonth === 5 && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 ml-6">
                      If the month doesn't have a 5th occurrence, it will skip to the next year
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* WEEKLY OPTIONS */}
          {currentRecurrence.pattern === RecurrencePattern.WEEKLY && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="space-y-3">
                {/* Interval */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Every</span>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={currentRecurrence.interval || 1}
                    onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                    className="
                      w-16 px-2 py-1 text-sm rounded border
                      bg-white dark:bg-gray-700
                      border-gray-300 dark:border-gray-600
                      text-gray-900 dark:text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    "
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentRecurrence.interval === 1 ? 'week' : 'weeks'}
                  </span>
                </div>

                {/* Days of week */}
                <WeeklyDayPicker
                  selectedDays={currentRecurrence.daysOfWeek && currentRecurrence.daysOfWeek.length > 0 ? currentRecurrence.daysOfWeek : [1]}
                  onChange={(days) => {
                    handleCustomChange({ ...currentRecurrence, daysOfWeek: days });
                  }}
                />
              </div>
            </div>
          )}

          {/* MONTHLY OPTIONS */}
          {currentRecurrence.pattern === RecurrencePattern.MONTHLY && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="space-y-3">
                {/* Interval */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Every</span>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={currentRecurrence.interval || 1}
                    onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 1)}
                    className="
                      w-16 px-2 py-1 text-sm rounded border
                      bg-white dark:bg-gray-700
                      border-gray-300 dark:border-gray-600
                      text-gray-900 dark:text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    "
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {currentRecurrence.interval === 1 ? 'month' : 'months'}
                  </span>
                </div>

                {/* Day selection */}
                <div className="space-y-2">
                  {/* Option 1: Specific date */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={monthlyMode === 'date'}
                      onChange={() => handleMonthlyModeChange('date')}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">On date</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={currentRecurrence.dayOfMonth || 15}
                      onChange={(e) => handleMonthlyDateChange(parseInt(e.target.value) || 15)}
                      className="
                        w-16 px-2 py-1 text-sm rounded border
                        bg-white dark:bg-gray-700
                        border-gray-300 dark:border-gray-600
                        text-gray-900 dark:text-gray-100
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      "
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">of the month</span>
                  </label>

                  {/* Option 2: Day pattern */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={monthlyMode === 'weekday'}
                      onChange={() => handleMonthlyModeChange('weekday')}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">On</span>
                    <select
                      value={currentRecurrence.weekOfMonth ?? 1}
                      onChange={(e) => handleMonthlyWeekChange(parseInt(e.target.value))}
                      className="
                        px-2 py-1 text-sm rounded border
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
                    <select
                      value={currentRecurrence.dayOfWeekInMonth ?? 1}
                      onChange={(e) => handleMonthlyDayChange(parseInt(e.target.value))}
                      className="
                        px-2 py-1 text-sm rounded border
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
                  </label>

                  {/* Warning for 5th occurrence */}
                  {monthlyMode === 'weekday' && currentRecurrence.weekOfMonth === 5 && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 ml-6">
                      If a month doesn't have a 5th occurrence, it will skip to the next month
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* END CONDITIONS */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <EndConditionSelector
              recurrence={currentRecurrence}
              onChange={handleCustomChange}
            />
          </div>

          {/* PREVIEW */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <RecurrencePreview
              recurrence={currentRecurrence}
              dueDate={undefined}
            />

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              A new instance will be created automatically when the previous one is completed or when the due date arrives.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
