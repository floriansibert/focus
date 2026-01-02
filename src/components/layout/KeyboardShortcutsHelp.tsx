import { useState } from 'react';
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
  const [selectedCategory, setSelectedCategory] = useState(0);

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
      title: 'Focus Mode',
      shortcuts: [
        { keys: `${mod}+Space`, description: 'Create task in focused quadrant' },
        { keys: `${mod}+Shift+Space`, description: 'Create subtask for selected task' },
        { keys: `${mod}+S`, description: 'Toggle star on selected task' },
        { keys: '↑ / ↓', description: 'Navigate between tasks' },
        { keys: '← / →', description: 'Collapse/expand subtasks' },
        { keys: 'Esc', description: 'Close panel or exit focus mode' },
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

  const selectedGroup = shortcutGroups[selectedCategory];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-4">
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

        {/* Two-column layout */}
        <div className="flex gap-4 min-h-[400px]">
          {/* Left sidebar - Categories */}
          <div className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 pr-4">
            <div className="space-y-1">
              {shortcutGroups.map((group, index) => (
                <button
                  key={group.title}
                  onClick={() => setSelectedCategory(index)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      selectedCategory === index
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {group.title}
                </button>
              ))}
            </div>
          </div>

          {/* Right content - Shortcuts */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {selectedGroup.title}
            </h3>
            <div className="space-y-3">
              {selectedGroup.shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded whitespace-nowrap">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
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
