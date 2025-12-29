import type { QuadrantType } from '../types/task';

export const QUADRANT_COLORS: Record<QuadrantType, string> = {
  'urgent-important': '#EF4444',       // Red
  'not-urgent-important': '#3B82F6',   // Blue
  'urgent-not-important': '#F59E0B',   // Amber
  'not-urgent-not-important': '#6B7280' // Gray
} as const;
