import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { DatePicker } from '../ui/DatePicker';
import { getToday, getTomorrow, getNextMonday } from '../../utils/date';
import type { Task } from '../../types/task';

interface DueDateQuickMenuProps {
  task: Task;
  onDateChange: (date: Date) => void;
}

export function DueDateQuickMenu({ task, onDateChange }: DueDateQuickMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
        setShowCustomPicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleQuickDate = (date: Date) => {
    onDateChange(date);
    setIsMenuOpen(false);
    setShowCustomPicker(false);
  };

  const handleCustomDate = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setIsMenuOpen(false);
      setShowCustomPicker(false);
      setCustomDate(undefined);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent task card click
    setIsMenuOpen(!isMenuOpen);
  };

  // Menu options
  const quickOptions = [
    { label: 'Today', getValue: getToday },
    { label: 'Tomorrow', getValue: getTomorrow },
    { label: 'Next Monday', getValue: getNextMonday },
  ];

  return (
    <div className="relative inline-block">
      {/* Trigger: Overdue date in red */}
      <span
        ref={triggerRef}
        onMouseEnter={() => setIsMenuOpen(true)}
        onClick={handleTriggerClick}
        className="text-xs text-red-600 dark:text-red-400 font-medium cursor-pointer hover:underline"
      >
        {new Date(task.dueDate!).toLocaleDateString()}
      </span>

      {/* Hover Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          onMouseLeave={() => {
            // Delay closing to allow moving to menu
            setTimeout(() => setIsMenuOpen(false), 200);
          }}
          className="absolute z-50 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg animate-fadeIn"
        >
          {!showCustomPicker ? (
            <>
              {/* Quick date options */}
              {quickOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleQuickDate(option.getValue())}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg"
                >
                  <Calendar size={14} />
                  <span>{option.label}</span>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {option.getValue().toLocaleDateString()}
                  </span>
                </button>
              ))}

              {/* Custom date option */}
              <button
                type="button"
                onClick={() => setShowCustomPicker(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 rounded-b-lg"
              >
                <Calendar size={14} />
                <span>Custom date...</span>
              </button>
            </>
          ) : (
            /* Custom date picker view */
            <div className="p-3">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Select a date (auto-saves on selection)
              </p>
              <DatePicker
                value={customDate}
                onChange={handleCustomDate}
                label=""
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomPicker(false);
                  setCustomDate(undefined);
                }}
                className="w-full mt-3 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
