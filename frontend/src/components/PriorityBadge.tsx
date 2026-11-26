import React from 'react';
import { Priority } from '../types';

interface PriorityBadgeProps {
  priority: Priority;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, showIcon = true }) => {
  const configs: Record<
    Priority,
    { label: string; textClass: string; bgClass: string; dotClass: string }
  > = {
    LOW: {
      label: 'Low',
      textClass: 'text-zinc-600',
      bgClass: 'bg-zinc-100/70 border-zinc-200/60',
      dotClass: 'bg-zinc-400',
    },
    MEDIUM: {
      label: 'Medium',
      textClass: 'text-blue-700',
      bgClass: 'bg-blue-50/60 border-blue-200/50',
      dotClass: 'bg-blue-500',
    },
    HIGH: {
      label: 'High',
      textClass: 'text-amber-800',
      bgClass: 'bg-amber-50/70 border-amber-200/60',
      dotClass: 'bg-amber-600',
    },
    URGENT: {
      label: 'Urgent',
      textClass: 'text-rose-700 font-semibold',
      bgClass: 'bg-rose-50/80 border-rose-200/70',
      dotClass: 'bg-rose-600',
    },
  };

  const c = configs[priority] || configs.MEDIUM;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${c.bgClass} ${c.textClass}`}
    >
      {showIcon && <span className={`w-1.5 h-1.5 rounded-full ${c.dotClass}`} />}
      {c.label}
    </span>
  );
};
