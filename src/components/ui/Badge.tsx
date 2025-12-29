import type { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  color?: string;
  variant?: 'solid' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  color = '#3B82F6',
  variant = 'solid',
  size = 'sm',
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const variantStyles =
    variant === 'solid'
      ? {
          backgroundColor: color,
          color: 'white',
        }
      : {
          backgroundColor: 'transparent',
          borderColor: color,
          color: color,
          borderWidth: '1px',
        };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeStyles[size]} ${className}`}
      style={variantStyles}
    >
      {children}
    </span>
  );
}
