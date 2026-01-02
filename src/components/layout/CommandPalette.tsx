import { useState, useEffect, useRef } from 'react';
import { Search, LayoutGrid, BarChart3, History, Repeat, Moon, Sun, Undo, Redo, Download, Upload, Info, BookOpen, Settings } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useUndoRedo } from '../../hooks/useUndoRedo';

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  onExport?: () => void;
  onImport?: () => void;
  onAbout?: () => void;
  onHelp?: () => void;
  onSettings?: () => void;
}

export function CommandPalette({ onExport, onImport, onAbout, onHelp, onSettings }: CommandPaletteProps) {
  const { commandPaletteOpen, toggleCommandPalette, setActiveView, theme, toggleTheme } =
    useUIStore();
  const { undo, redo } = useUndoRedo();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: 'matrix',
      label: 'Go to Matrix View',
      icon: <LayoutGrid size={18} />,
      action: () => {
        setActiveView('matrix');
        toggleCommandPalette();
      },
      keywords: ['matrix', 'grid', 'tasks'],
    },
    {
      id: 'analytics',
      label: 'Go to Analytics',
      icon: <BarChart3 size={18} />,
      action: () => {
        setActiveView('analytics');
        toggleCommandPalette();
      },
      keywords: ['analytics', 'stats', 'dashboard', 'insights'],
    },
    {
      id: 'history',
      label: 'Go to History',
      icon: <History size={18} />,
      action: () => {
        setActiveView('history');
        toggleCommandPalette();
      },
      keywords: ['history', 'timeline', 'events', 'log', 'activity'],
    },
    {
      id: 'templates',
      label: 'Go to Templates',
      icon: <Repeat size={18} />,
      action: () => {
        setActiveView('templates');
        toggleCommandPalette();
      },
      keywords: ['templates', 'recurring', 'repeat', 'schedule'],
    },
    {
      id: 'undo',
      label: 'Undo',
      icon: <Undo size={18} />,
      action: () => {
        undo();
        toggleCommandPalette();
      },
      keywords: ['undo', 'revert', 'back'],
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: <Redo size={18} />,
      action: () => {
        redo();
        toggleCommandPalette();
      },
      keywords: ['redo', 'forward', 'again'],
    },
    {
      id: 'theme',
      label: `Toggle ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
      icon: theme === 'light' ? <Moon size={18} /> : <Sun size={18} />,
      action: () => {
        toggleTheme();
        toggleCommandPalette();
      },
      keywords: ['theme', 'dark', 'light', 'mode'],
    },
    {
      id: 'export',
      label: 'Export Data',
      icon: <Download size={18} />,
      action: () => {
        if (onExport) onExport();
        toggleCommandPalette();
      },
      keywords: ['export', 'download', 'backup', 'save'],
    },
    {
      id: 'import',
      label: 'Import Data',
      icon: <Upload size={18} />,
      action: () => {
        if (onImport) onImport();
        toggleCommandPalette();
      },
      keywords: ['import', 'upload', 'restore', 'load'],
    },
    {
      id: 'about',
      label: 'About Focus',
      icon: <Info size={18} />,
      action: () => {
        if (onAbout) onAbout();
        toggleCommandPalette();
      },
      keywords: ['about', 'info', 'version'],
    },
    {
      id: 'help',
      label: 'Help & Documentation',
      icon: <BookOpen size={18} />,
      action: () => {
        if (onHelp) onHelp();
        toggleCommandPalette();
      },
      keywords: ['help', 'docs', 'documentation', 'guide', 'tutorial', 'how to'],
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: <Settings size={18} />,
      action: () => {
        if (onSettings) onSettings();
        toggleCommandPalette();
      },
      keywords: ['settings', 'preferences', 'history', 'retention'],
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase();
    const labelMatch = cmd.label.toLowerCase().includes(searchLower);
    const keywordMatch = cmd.keywords?.some((kw) => kw.includes(searchLower));
    return labelMatch || keywordMatch;
  });

  useEffect(() => {
    if (commandPaletteOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset selection when search changes
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!commandPaletteOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filteredCommands[selectedIndex]?.action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, filteredCommands, selectedIndex, toggleCommandPalette]);

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
      onClick={toggleCommandPalette}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-950'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <div className="text-gray-600 dark:text-gray-400">{cmd.icon}</div>
                <div className="flex-1 text-sm text-gray-900 dark:text-gray-100">
                  {cmd.label}
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              No commands found
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
          <span>Press ? for keyboard shortcuts</span>
        </div>
      </div>
    </div>
  );
}
