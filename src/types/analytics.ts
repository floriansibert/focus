import { QuadrantType } from './task';

export interface QuadrantDistribution {
  quadrant: QuadrantType;
  count: number;
  percentage: number;
}

export interface CompletionTrendData {
  date: string;
  count: number;
}

export interface ProductivityInsight {
  type: 'warning' | 'info' | 'success';
  message: string;
  icon?: string;
}
