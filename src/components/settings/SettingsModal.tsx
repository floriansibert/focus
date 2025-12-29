import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useUIStore } from '../../store/uiStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsCategory = 'history' | 'export';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<SettingsCategory>('export');

  const historyRetentionDays = useUIStore((state) => state.historyRetentionDays);
  const setHistoryRetentionDays = useUIStore((state) => state.setHistoryRetentionDays);

  const exportReminderEnabled = useUIStore((state) => state.exportReminderEnabled);
  const exportReminderFrequencyDays = useUIStore((state) => state.exportReminderFrequencyDays);
  const setExportReminderEnabled = useUIStore((state) => state.setExportReminderEnabled);
  const setExportReminderFrequencyDays = useUIStore((state) => state.setExportReminderFrequencyDays);

  const retentionOptions = [
    { value: null, label: 'Keep forever', description: 'Never delete history events' },
    { value: 1, label: '1 day', description: 'Delete events older than 1 day' },
    { value: 7, label: '7 days', description: 'Delete events older than 7 days' },
    { value: 30, label: '30 days', description: 'Delete events older than 30 days' },
    { value: 90, label: '90 days', description: 'Delete events older than 90 days' },
    { value: 365, label: '1 year', description: 'Delete events older than 1 year' },
  ];

  const frequencyOptions = [
    { value: 7, label: 'Weekly', description: 'Remind me every 7 days' },
    { value: 14, label: 'Bi-weekly', description: 'Remind me every 14 days' },
    { value: 30, label: 'Monthly', description: 'Remind me every 30 days' },
    { value: 90, label: 'Quarterly', description: 'Remind me every 90 days' },
  ];

  const categories = [
    { id: 'export' as const, label: 'Export Reminders', icon: '📤' },
    { id: 'history' as const, label: 'History Retention', icon: '🕐' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      size="lg"
      footer={
        <Button onClick={onClose} variant="primary">
          Close
        </Button>
      }
    >
      <div className="flex gap-6 min-h-[550px]">
        {/* Left Sidebar Menu */}
        <div className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 pr-4">
          <nav className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                  transition-all flex items-center gap-2
                  ${
                    selectedCategory === category.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content Pane */}
        <div className="flex-1 overflow-y-auto">
          {/* History Retention Section */}
          {selectedCategory === 'history' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                History Retention
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Automatically delete old history events on app load. This helps keep your browser storage clean.
              </p>

              {/* Radio button group */}
              <div className="space-y-2">
                {retentionOptions.map((option) => (
                  <label
                    key={option.value ?? 'forever'}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer
                      transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50
                      ${
                        historyRetentionDays === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="historyRetention"
                      checked={historyRetentionDays === option.value}
                      onChange={() => setHistoryRetentionDays(option.value)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Info message */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> Cleanup happens automatically when the app loads.
                  {historyRetentionDays === null
                    ? ' Currently keeping all history.'
                    : ` Currently deleting events older than ${historyRetentionDays} days.`}
                </p>
              </div>
            </div>
          )}

          {/* Export Reminder Section */}
          {selectedCategory === 'export' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Export Reminders
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get reminded to export your data regularly to prevent data loss.
              </p>

              {/* Enable/Disable Toggle */}
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportReminderEnabled}
                  onChange={(e) => setExportReminderEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable export reminders
                </span>
              </label>

              {/* Frequency Options (shown only when enabled) */}
              {exportReminderEnabled && (
                <div className="ml-6 space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reminder frequency
                  </label>
                  {frequencyOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer
                        transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50
                        ${
                          exportReminderFrequencyDays === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="exportReminderFrequency"
                        checked={exportReminderFrequencyDays === option.value}
                        onChange={() => setExportReminderFrequencyDays(option.value)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-600"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Info message */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>Note:</strong> Export reminders appear as a banner at the top of the app.
                  {exportReminderEnabled
                    ? ` Currently checking every ${exportReminderFrequencyDays} days.`
                    : ' Currently disabled.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
