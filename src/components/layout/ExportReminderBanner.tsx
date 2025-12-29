import { useState } from 'react';
import { AlertCircle, X, Download, ChevronDown } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { Button } from '../ui/Button';

interface ExportReminderBannerProps {
  onExport: () => void;
  daysSinceLastExport: number | null;
}

export function ExportReminderBanner({ onExport, daysSinceLastExport }: ExportReminderBannerProps) {
  const dismissExportReminder = useUIStore((state) => state.dismissExportReminder);
  const snoozeExportReminder = useUIStore((state) => state.snoozeExportReminder);
  const [showSnoozeDropdown, setShowSnoozeDropdown] = useState(false);

  const handleSnooze = (days: number) => {
    snoozeExportReminder(days);
    setShowSnoozeDropdown(false);
  };

  const handleDismiss = () => {
    dismissExportReminder();
  };

  const getMessage = () => {
    if (daysSinceLastExport === null) {
      return "You haven't exported your data yet. Regular backups keep your data safe!";
    }
    return `It's been ${daysSinceLastExport} ${daysSinceLastExport === 1 ? 'day' : 'days'} since your last export. Regular backups keep your data safe!`;
  };

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left side: Icon and message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AlertCircle className="flex-shrink-0 text-amber-600 dark:text-amber-400" size={20} />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {getMessage()}
            </p>
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Export Now button */}
            <Button
              onClick={onExport}
              variant="primary"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
            >
              <Download size={14} />
              Export Now
            </Button>

            {/* Snooze dropdown */}
            <div className="relative">
              <Button
                onClick={() => setShowSnoozeDropdown(!showSnoozeDropdown)}
                variant="secondary"
                size="sm"
                className="border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                Snooze
                <ChevronDown size={14} />
              </Button>

              {showSnoozeDropdown && (
                <>
                  {/* Backdrop to close dropdown */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSnoozeDropdown(false)}
                  />

                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                    <button
                      onClick={() => handleSnooze(1)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
                    >
                      1 day
                    </button>
                    <button
                      onClick={() => handleSnooze(3)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      3 days
                    </button>
                    <button
                      onClick={() => handleSnooze(7)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors"
                    >
                      7 days
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Dismiss button */}
            <Button
              onClick={handleDismiss}
              variant="secondary"
              size="sm"
              className="border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              Dismiss
            </Button>

            {/* Close X button */}
            <button
              onClick={handleDismiss}
              className="p-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
              aria-label="Close banner"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
