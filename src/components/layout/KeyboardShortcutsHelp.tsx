import { Keyboard } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? '⌘' : 'Ctrl';

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'General',
      shortcuts: [
        { keys: `${mod}+K`, description: 'Open command palette' },
        { keys: `${mod}+/ or ?`, description: 'Show keyboard shortcuts' },
        { keys: 'F1', description: 'Open help & documentation' },
        { keys: `${mod}+D`, description: 'Toggle dark mode' },
      ],
    },
    {
      title: 'Navigation',
      shortcuts: [
        { keys: `${mod}+M`, description: 'Go to Matrix view' },
        { keys: `${mod}+A`, description: 'Go to Analytics view' },
        { keys: `${mod}+H`, description: 'Go to History view' },
        { keys: 'Esc', description: 'Close modal or dropdown' },
      ],
    },
    {
      title: 'Quick Task Entry',
      shortcuts: [
        { keys: `${mod}+1`, description: 'Add task to Urgent & Important' },
        { keys: `${mod}+2`, description: 'Add task to Not Urgent & Important' },
        { keys: `${mod}+3`, description: 'Add task to Urgent & Not Important' },
        { keys: `${mod}+4`, description: 'Add task to Not Urgent & Not Important' },
      ],
    },
    {
      title: 'Search & Filters',
      shortcuts: [
        { keys: `${mod}+F`, description: 'Focus search bar' },
        { keys: `${mod}+L`, description: 'Clear filters' },
      ],
    },
    {
      title: 'Task Management',
      shortcuts: [
        { keys: `${mod}+Z`, description: 'Undo' },
        { keys: `${mod}+Shift+Z`, description: 'Redo' },
        { keys: `${mod}+Enter`, description: 'Save task (in modal)' },
        { keys: 'Esc', description: 'Cancel/close modal' },
      ],
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Keyboard size={24} className="text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Keyboard Shortcuts
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Navigate faster with these shortcuts
            </p>
          </div>
        </div>

        {/* Shortcut Groups */}
        <div className="space-y-6">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> or
            click outside to close
          </p>
        </div>
      </div>
    </Modal>
  );
}
