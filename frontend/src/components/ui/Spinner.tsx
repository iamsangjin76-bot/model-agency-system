import React from 'react';

// Size map — matches existing inline spinner sizes across the codebase
const SIZE: Record<string, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string; // sr-only accessibility text
}

export default function Spinner({ size = 'md', className = '', label }: SpinnerProps) {
  return (
    <span role="status" className={`inline-flex items-center justify-center ${className}`}>
      <span
        className={`animate-spin rounded-full border-4 border-purple-500 border-t-transparent ${SIZE[size]}`}
      />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
