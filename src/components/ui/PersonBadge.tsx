import { type ReactNode } from 'react';

export interface PersonBadgeProps {
  children: ReactNode;
  color: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function PersonBadge({ children, color, size = 'md', className = '' }: PersonBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`
        inline-flex items-center rounded-full
        border-2 font-medium
        ${sizeClasses}
        ${className}
      `}
      style={{
        borderColor: color,
        color: color,
        backgroundColor: 'transparent',
      }}
    >
      {children}
    </span>
  );
}
