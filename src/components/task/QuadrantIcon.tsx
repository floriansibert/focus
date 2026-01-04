import { QuadrantType } from '../../types/task';

interface QuadrantIconProps {
  selectedQuadrant: QuadrantType;
  size?: number;
  showBorder?: boolean;
}

// Hex color mapping for SVG rendering (matches focus.svg and Tailwind theme)
const QUADRANT_COLORS: Record<QuadrantType, string> = {
  [QuadrantType.URGENT_IMPORTANT]: '#EF4444',        // red-500
  [QuadrantType.NOT_URGENT_IMPORTANT]: '#3B82F6',    // blue-500
  [QuadrantType.URGENT_NOT_IMPORTANT]: '#F59E0B',    // amber-500
  [QuadrantType.NOT_URGENT_NOT_IMPORTANT]: '#9CA3AF', // gray-400
};

export function QuadrantIcon({ selectedQuadrant, size = 24, showBorder = false }: QuadrantIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={showBorder ? 'rounded border border-gray-300 dark:border-gray-600' : ''}
    >
      {/* Q1: Top-left (Urgent & Important) */}
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="2"
        fill={QUADRANT_COLORS[QuadrantType.URGENT_IMPORTANT]}
        opacity={selectedQuadrant === QuadrantType.URGENT_IMPORTANT ? 1 : 0.3}
      />

      {/* Q2: Top-right (Not Urgent & Important) */}
      <rect
        x="18"
        y="2"
        width="12"
        height="12"
        rx="2"
        fill={QUADRANT_COLORS[QuadrantType.NOT_URGENT_IMPORTANT]}
        opacity={selectedQuadrant === QuadrantType.NOT_URGENT_IMPORTANT ? 1 : 0.3}
      />

      {/* Q3: Bottom-left (Urgent & Not Important) */}
      <rect
        x="2"
        y="18"
        width="12"
        height="12"
        rx="2"
        fill={QUADRANT_COLORS[QuadrantType.URGENT_NOT_IMPORTANT]}
        opacity={selectedQuadrant === QuadrantType.URGENT_NOT_IMPORTANT ? 1 : 0.3}
      />

      {/* Q4: Bottom-right (Not Urgent & Not Important) */}
      <rect
        x="18"
        y="18"
        width="12"
        height="12"
        rx="2"
        fill={QUADRANT_COLORS[QuadrantType.NOT_URGENT_NOT_IMPORTANT]}
        opacity={selectedQuadrant === QuadrantType.NOT_URGENT_NOT_IMPORTANT ? 1 : 0.3}
      />
    </svg>
  );
}
