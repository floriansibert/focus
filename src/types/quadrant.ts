import { QuadrantType } from './task';

export interface QuadrantInfo {
  type: QuadrantType;
  title: string;
  description: string;
  color: string;
  action: string;
}

export const QUADRANT_INFO: Record<QuadrantType, QuadrantInfo> = {
  [QuadrantType.URGENT_IMPORTANT]: {
    type: QuadrantType.URGENT_IMPORTANT,
    title: 'Do First',
    description: 'Urgent & Important',
    color: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    action: 'Handle immediately',
  },
  [QuadrantType.NOT_URGENT_IMPORTANT]: {
    type: QuadrantType.NOT_URGENT_IMPORTANT,
    title: 'Schedule',
    description: 'Not Urgent & Important',
    color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    action: 'Plan and prioritize',
  },
  [QuadrantType.URGENT_NOT_IMPORTANT]: {
    type: QuadrantType.URGENT_NOT_IMPORTANT,
    title: 'Delegate',
    description: 'Urgent & Not Important',
    color: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
    action: 'Delegate if possible',
  },
  [QuadrantType.NOT_URGENT_NOT_IMPORTANT]: {
    type: QuadrantType.NOT_URGENT_NOT_IMPORTANT,
    title: 'Eliminate',
    description: 'Not Urgent & Not Important',
    color: 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800',
    action: 'Minimize or eliminate',
  },
};
