import React from 'react';
import { TicketStatus } from '../types';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const configs: Record<
    TicketStatus,
    { label: string; dotClass: string; badgeClass: string }
  > = {
    OPEN: {
      label: 'Open',
      dotClass: 'bg-blue-500',
      badgeClass: 'bg-blue-50/70 text-blue-700 border-blue-200/60',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      dotClass: 'bg-amber-500',
      badgeClass: 'bg-amber-50/70 text-amber-800 border-amber-200/60',
    },
    RESOLVED: {
      label: 'Resolved',
      dotClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-50/70 text-emerald-800 border-emerald-200/60',
    },
    CLOSED: {
      label: 'Closed',
      dotClass: 'bg-zinc-400',
      badgeClass: 'bg-zinc-100/80 text-zinc-600 border-zinc-200/60',
    },
  };

  const c = configs[status] || configs.OPEN;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border tracking-tight ${c.badgeClass} ${padding}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dotClass}`} />
      {c.label}
    </span>
  );
};
