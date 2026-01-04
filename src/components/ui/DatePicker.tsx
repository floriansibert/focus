import { forwardRef } from 'react';
import { X } from 'lucide-react';

export interface DatePickerProps {
  label?: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  error?: string;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  readOnly?: boolean;
  compact?: boolean;
  allowClear?: boolean;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, value, onChange, error, min, max, disabled, readOnly, compact = false, allowClear = true }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
        onChange(new Date(e.target.value));
        // Close the calendar picker by blurring the input
        e.target.blur();
      } else {
        onChange(undefined);
      }
    };

    const handleClear = () => {
      onChange(undefined);
    };

    const formatDateForInput = (date?: Date) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return (
      <div className={compact ? '' : 'w-full'}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="date"
            value={formatDateForInput(value)}
            onChange={handleChange}
            min={min ? formatDateForInput(min) : undefined}
            max={max ? formatDateForInput(max) : undefined}
            disabled={disabled}
            readOnly={readOnly}
            className={
              compact
                ? `px-2 py-1 text-sm rounded border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${value ? 'pr-7' : ''}`
                : `w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed read-only:cursor-default read-only:bg-gray-50 dark:read-only:bg-gray-900 transition-colors ${error ? 'border-red-500 focus:ring-red-500' : ''} ${value ? 'pr-10' : ''}`
            }
          />
          {value && !readOnly && !disabled && allowClear && (
            <button
              type="button"
              onClick={handleClear}
              className={
                compact
                  ? "absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  : "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              }
              title="Clear date"
            >
              <X size={compact ? 12 : 16} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
