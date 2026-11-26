import React from 'react';
import { Category } from '../types';

interface CategoryBadgeProps {
  category: Category;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const configs: Record<Category, { label: string; bg: string }> = {
    TECHNICAL: { label: 'Technical', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    BILLING: { label: 'Billing', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    ACCOUNT: { label: 'Account', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    FEATURE_REQUEST: { label: 'Feature Request', bg: 'bg-violet-50 text-violet-700 border-violet-200' },
    GENERAL: { label: 'General', bg: 'bg-slate-50 text-slate-700 border-slate-200' },
  };

  const c = configs[category] || configs.GENERAL;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border font-medium ${c.bg}`}>
      {c.label}
    </span>
  );
};
