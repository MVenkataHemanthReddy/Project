import React from 'react';
import { Category } from '../types';

interface CategoryBadgeProps {
  category: Category;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const configs: Record<Category, { label: string }> = {
    TECHNICAL: { label: 'Technical' },
    BILLING: { label: 'Billing' },
    ACCOUNT: { label: 'Account' },
    FEATURE_REQUEST: { label: 'Feature Request' },
    GENERAL: { label: 'General' },
  };

  const label = configs[category]?.label || 'General';

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium text-zinc-600 bg-white border border-zinc-200 shadow-[0_1px_1px_rgba(0,0,0,0.02)]">
      {label}
    </span>
  );
};
