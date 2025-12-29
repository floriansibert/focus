import type { Task, QuadrantType } from '../types/task';
import { QUADRANT_INFO } from '../types/quadrant';
import { QUADRANT_COLORS } from './constants';

export interface QuadrantDistribution {
  quadrant: QuadrantType;
  count: number;
  percentage: number;
  label: string;
  color: string;
}

export interface CompletionTrendPoint {
  date: string;
  completed: number;
  created: number;
}

export interface ProductivityInsight {
  type: 'warning' | 'success' | 'info';
  message: string;
}

export interface WeeklyCompletionData {
  week: string;
  completed: number;
  weekStart: Date;
}

/**
 * Calculate task distribution across quadrants
 * @param tasks - Array of tasks to analyze
 * @param includeCompleted - Whether to include completed tasks (default: false)
 */
export function calculateQuadrantDistribution(
  tasks: Task[],
  includeCompleted: boolean = false
): QuadrantDistribution[] {
  // Filter tasks based on completion status
  const filteredTasks = includeCompleted
    ? tasks
    : tasks.filter(t => !t.completed);

  const total = filteredTasks.length;

  const distribution = Object.keys(QUADRANT_INFO).map((quadrant) => {
    const quadrantType = quadrant as QuadrantType;
    const count = filteredTasks.filter((t) => t.quadrant === quadrantType).length;
    const info = QUADRANT_INFO[quadrantType];

    return {
      quadrant: quadrantType,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      label: info.title,
      color: getQuadrantColor(quadrantType),
    };
  });

  return distribution;
}

/**
 * Calculate completion trend over time
 */
export function calculateCompletionTrend(tasks: Task[], days: number = 7): CompletionTrendPoint[] {
  const now = new Date();
  const trend: CompletionTrendPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const completed = tasks.filter((t) => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= date && completedDate < nextDate;
    }).length;

    const created = tasks.filter((t) => {
      const createdDate = new Date(t.createdAt);
      return createdDate >= date && createdDate < nextDate;
    }).length;

    trend.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed,
      created,
    });
  }

  return trend;
}

/**
 * Calculate weekly completions for the last N weeks
 */
export function calculateWeeklyCompletions(tasks: Task[], weeks: number = 12): WeeklyCompletionData[] {
  const now = new Date();
  const weeklyData: WeeklyCompletionData[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    // Calculate the start of the week (Monday)
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1)); // Get to Monday
    weekStart.setDate(weekStart.getDate() - (i * 7)); // Go back i weeks
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7); // End of week (next Monday)

    // Count completed tasks in this week
    const completed = tasks.filter((t) => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      return completedDate >= weekStart && completedDate < weekEnd;
    }).length;

    // Format week label as Monday date (e.g., "Dec 2")
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekStart.getDate();

    const weekLabel = `${startMonth} ${startDay}`;

    weeklyData.push({
      week: weekLabel,
      completed,
      weekStart,
    });
  }

  return weeklyData;
}

/**
 * Generate productivity insights
 */
export function generateInsights(tasks: Task[]): ProductivityInsight[] {
  const insights: ProductivityInsight[] = [];

  // Check urgent task percentage
  const urgentTasks = tasks.filter(
    (t) =>
      !t.completed &&
      (t.quadrant === 'urgent-important' || t.quadrant === 'urgent-not-important')
  );
  const urgentPercentage = tasks.length > 0 ? (urgentTasks.length / tasks.length) * 100 : 0;

  if (urgentPercentage > 50) {
    insights.push({
      type: 'warning',
      message: `${Math.round(urgentPercentage)}% of your tasks are urgent. Consider better planning to reduce firefighting.`,
    });
  }

  // Check important task focus
  const importantTasks = tasks.filter(
    (t) =>
      !t.completed &&
      (t.quadrant === 'urgent-important' || t.quadrant === 'not-urgent-important')
  );
  const importantPercentage = tasks.length > 0 ? (importantTasks.length / tasks.length) * 100 : 0;

  if (importantPercentage > 60) {
    insights.push({
      type: 'success',
      message: `Great focus! ${Math.round(importantPercentage)}% of your tasks are important.`,
    });
  }

  // Check completion rate (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentTasks = tasks.filter((t) => new Date(t.createdAt) >= weekAgo);
  const completedRecent = recentTasks.filter((t) => t.completed).length;
  const completionRate = recentTasks.length > 0 ? (completedRecent / recentTasks.length) * 100 : 0;

  if (completionRate > 70) {
    insights.push({
      type: 'success',
      message: `Excellent! You've completed ${Math.round(completionRate)}% of tasks created this week.`,
    });
  } else if (completionRate < 30 && recentTasks.length > 5) {
    insights.push({
      type: 'warning',
      message: `Only ${Math.round(completionRate)}% completion rate this week. Consider breaking tasks into smaller chunks.`,
    });
  }

  // Check for not-urgent-not-important tasks
  const timewasters = tasks.filter((t) => !t.completed && t.quadrant === 'not-urgent-not-important');
  if (timewasters.length > 5) {
    insights.push({
      type: 'info',
      message: `You have ${timewasters.length} low-priority tasks. Consider eliminating or delegating them.`,
    });
  }

  return insights;
}

/**
 * Get color for quadrant charts
 */
function getQuadrantColor(quadrant: QuadrantType): string {
  return QUADRANT_COLORS[quadrant];
}
