import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AlertCircle, Calendar, Users, XCircle } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { calculateQuadrantDistribution } from '../../lib/analytics';
import { getContrastColor } from '../../utils/colorHelpers';

// Icon mapping for color-blind support
const QUADRANT_ICONS = {
  'urgent-important': AlertCircle,
  'not-urgent-important': Calendar,
  'urgent-not-important': Users,
  'not-urgent-not-important': XCircle,
};

export function QuadrantDistribution() {
  const tasks = useTaskStore((state) => state.tasks);

  // Memoize active tasks only (exclude completed)
  const activeTasks = useMemo(
    () => tasks.filter(t => !t.completed),
    [tasks]
  );

  // Memoize distribution calculation
  const distribution = useMemo(
    () => calculateQuadrantDistribution(activeTasks, true),
    [activeTasks]
  );

  // Memoize total count
  const totalActiveTasks = useMemo(
    () => distribution.reduce((sum, item) => sum + item.count, 0),
    [distribution]
  );

  // Custom label with smart hiding and contrast
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
    payload: Record<string, unknown>;
  }) => {
    // Hide labels for slices < 5%
    if (percent < 0.05) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={getContrastColor(payload.color)}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // Custom legend with counts
  const CustomLegend = ({ payload }: { payload: Array<Record<string, unknown>> }) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: Record<string, unknown>, index: number) => (
        <div
          key={index}
          className="flex items-center gap-2"
          role="listitem"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {entry.payload.label} ({entry.payload.count})
          </span>
        </div>
      ))}
    </div>
  );

  // Enhanced tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: Record<string, unknown> }> }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const Icon = QUADRANT_ICONS[data.quadrant as keyof typeof QUADRANT_ICONS];

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={18} style={{ color: data.color }} />
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {data.label}
          </p>
        </div>
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <p>Tasks: {data.count} of {totalActiveTasks}</p>
          <p>Percentage: {data.percentage.toFixed(1)}%</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
      role="region"
      aria-label="Task Distribution by Quadrant"
    >
      <h3
        id="quadrant-chart-title"
        className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100"
      >
        Active Task Distribution by Quadrant
      </h3>

      {totalActiveTasks > 0 ? (
        <>
          <div role="img" aria-labelledby="quadrant-chart-title" aria-describedby="quadrant-chart-description">
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <PieChart>
              <Pie
                data={distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius="80%"
                fill="#8884d8"
                dataKey="count"
                paddingAngle={2}
              >
                {distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={CustomTooltip} />
              <Legend content={CustomLegend} />
            </PieChart>
          </ResponsiveContainer>
          </div>

          {/* Screen reader description */}
          <div id="quadrant-chart-description" className="sr-only">
            Pie chart showing the distribution of {totalActiveTasks} active tasks
            across 4 quadrants: {distribution.map(d =>
              `${d.label} (${d.count} tasks, ${d.percentage.toFixed(1)}%)`
            ).join(', ')}.
          </div>
        </>
      ) : (
        <div
          className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400"
          role="status"
          aria-live="polite"
        >
          <p className="text-base font-medium">No active tasks</p>
          <p className="text-sm mt-2">Create some tasks to see the distribution</p>
        </div>
      )}
    </div>
  );
}
