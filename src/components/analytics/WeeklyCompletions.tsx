import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTaskStore } from '../../store/taskStore';
import { calculateWeeklyCompletions } from '../../lib/analytics';

export function WeeklyCompletions() {
  const tasks = useTaskStore((state) => state.tasks);
  const weeklyData = calculateWeeklyCompletions(tasks, 12);

  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains('dark');
  const axisColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb';

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Weekly Completions - Last 12 Weeks
      </h3>

      {tasks.filter((t) => t.completed).length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: axisColor }}
              angle={-45}
              textAnchor="end"
              height={60}
              stroke={axisColor}
            />
            <YAxis
              tick={{ fontSize: 12, fill: axisColor }}
              allowDecimals={false}
              stroke={axisColor}
            />
            <Tooltip
              cursor={{ fill: isDarkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)' }}
              contentStyle={{
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                borderRadius: '0.5rem',
                padding: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{
                color: isDarkMode ? '#f3f4f6' : '#111827',
                fontWeight: 500,
                fontSize: '0.875rem',
                marginBottom: '0.25rem',
              }}
              itemStyle={{
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                fontSize: '0.875rem',
              }}
              formatter={(value: number | undefined) => [`${value ?? 0}`, 'Completed']}
            />
            <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
          No completed tasks yet
        </div>
      )}
    </div>
  );
}
