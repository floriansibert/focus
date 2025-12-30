interface SubtaskProgressPieProps {
  completed: number;
  total: number;
  size?: number;
  onClick?: (e: React.MouseEvent) => void;
  isCollapsed?: boolean;
}

export function SubtaskProgressPie({
  completed,
  total,
  size = 20,
  onClick,
  isCollapsed = false
}: SubtaskProgressPieProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const radius = (size - 4) / 2; // Account for 2px stroke
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <button
      onClick={onClick}
      tabIndex={-1}
      className="flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-80 transition-opacity relative group"
      title={`${completed} of ${total} subtasks - Click to ${isCollapsed ? 'expand' : 'collapse'}`}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle (incomplete portion) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-300 dark:text-gray-600"
        />

        {/* Progress circle (completed portion) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-600 dark:text-blue-400 transition-all duration-300"
        />

        {/* Count text in center */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(90, ${size / 2}, ${size / 2})`}
          className="text-[9px] font-bold fill-gray-700 dark:fill-gray-300 select-none"
          style={{ pointerEvents: 'none' }}
        >
          {total}
        </text>
      </svg>
    </button>
  );
}
