'use client';

import React from 'react';
import { SubNavItem } from '@/config/subNavigation';

interface SubNavigationProps {
  items: SubNavItem[];
  activeItem: string;
  onItemChange: (itemId: string) => void;
}

export function SubNavigation({ items, activeItem, onItemChange }: SubNavigationProps) {
  return (
    <div className="flex border-b border-border bg-background">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemChange(item.id)}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeItem === item.id
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
