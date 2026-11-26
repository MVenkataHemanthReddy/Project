import React from 'react';
import { Priority } from '../types';

interface PriorityBadgeProps {
  priority: Priority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const configs: Record<Priority, { bg: string; text: string; label: string }> = {
    LOW: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      text: 'text-slate-600',
      label: 'Low',
    },
    MEDIUM: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      text: 'text-amber-600',
      label: 'Medium',
    },
    HIGH: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      text: 'text-orange-600',
      label: 'High',
    },
    URGENT: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
      text: 'text-rose-600',
      label: 'Urgent 🔥',
    },
  };

  const c = configs[priority] || configs.MEDIUM;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${c.bg}`}
    >
      {c.label}
    </span>
  );
};
