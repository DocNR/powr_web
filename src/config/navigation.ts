import { Library, Dumbbell, BookOpen, TestTube } from 'lucide-react';
import { NavigationTab } from '@/types/navigation';

const allTabs: NavigationTab[] = [
  {
    id: 'library',
    label: 'Library',
    icon: Library,
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: Dumbbell, // Active workout tab - fitness/strength theme
    notificationDot: false, // Will be set dynamically if workout is active
  },
  {
    id: 'log',
    label: 'Log',
    icon: BookOpen,
  },
  {
    id: 'test',
    label: 'Debug',
    icon: TestTube,
  },
];

// Filter out test tab in production
export const navigationTabs: NavigationTab[] = process.env.NODE_ENV === 'production' 
  ? allTabs.filter(tab => tab.id !== 'test')
  : allTabs;

export const defaultTab = 'workout';
