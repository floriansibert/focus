import { useState, useRef, useEffect } from 'react';
import { QuadrantType } from '../../types/task';
import { QUADRANT_INFO } from '../../types/quadrant';
import { QuadrantIcon } from './QuadrantIcon';

interface CompactQuadrantSelectorProps {
  value: QuadrantType;
  onChange: (quadrant: QuadrantType) => void;
  disabled?: boolean;
}

// Hex color mapping for colored squares in popover
const QUADRANT_HEX_COLORS: Record<QuadrantType, string> = {
  [QuadrantType.URGENT_IMPORTANT]: '#EF4444',
  [QuadrantType.NOT_URGENT_IMPORTANT]: '#3B82F6',
  [QuadrantType.URGENT_NOT_IMPORTANT]: '#F59E0B',
  [QuadrantType.NOT_URGENT_NOT_IMPORTANT]: '#9CA3AF',
};

export function CompactQuadrantSelector({ value, onChange, disabled }: CompactQuadrantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (quadrant: QuadrantType, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange(quadrant);
    setIsOpen(false);
  };

  // Background color mapping for light mode only
  const quadrantBgLight: Record<QuadrantType, string> = {
    [QuadrantType.URGENT_IMPORTANT]: 'bg-red-50',
    [QuadrantType.NOT_URGENT_IMPORTANT]: 'bg-blue-50',
    [QuadrantType.URGENT_NOT_IMPORTANT]: 'bg-amber-50',
    [QuadrantType.NOT_URGENT_NOT_IMPORTANT]: 'bg-gray-50',
  };

  // Border color mapping for dark mode
  const quadrantBorderDark: Record<QuadrantType, string> = {
    [QuadrantType.URGENT_IMPORTANT]: 'dark:border-red-500',
    [QuadrantType.NOT_URGENT_IMPORTANT]: 'dark:border-blue-500',
    [QuadrantType.URGENT_NOT_IMPORTANT]: 'dark:border-amber-500',
    [QuadrantType.NOT_URGENT_NOT_IMPORTANT]: 'dark:border-gray-500',
  };

  return (
    <div className="relative">
      {/* Compact Icon Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          p-1 rounded transition-colors border-2
          ${quadrantBgLight[value]}
          dark:bg-gray-800
          ${quadrantBorderDark[value]}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
          ${isOpen ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
        `}
        title="Select quadrant"
      >
        <QuadrantIcon selectedQuadrant={value} size={24} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-1 z-[100] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 min-w-[280px]"
        >
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Select Quadrant
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(QUADRANT_INFO).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={(e) => handleSelect(key as QuadrantType, e)}
                className={`
                  p-2 rounded-lg border-2 text-left transition-all
                  hover:shadow-md cursor-pointer
                  ${value === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: QUADRANT_HEX_COLORS[key as QuadrantType] }}
                  />
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {info.title}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {info.action}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
