import { QuadrantType } from '../../types/task';
import { QUADRANT_INFO } from '../../types/quadrant';

interface QuadrantGridSelectorProps {
  value: QuadrantType;
  onChange: (quadrant: QuadrantType) => void;
  disabled?: boolean;
}

export function QuadrantGridSelector({ value, onChange, disabled }: QuadrantGridSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(QUADRANT_INFO).map(([key, info]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key as QuadrantType)}
          disabled={disabled}
          className={`
            p-4 rounded-lg border-2 text-left transition-all
            ${
              value === key
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {info.title}
          </div>
        </button>
      ))}
    </div>
  );
}
