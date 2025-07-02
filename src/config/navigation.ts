import { Home, Library, Zap, Users, BookOpen, TestTube } from 'lucide-react';
import { NavigationTab } from '@/types/navigation';

export const navigationTabs: NavigationTab[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
  },
  {
    id: 'library',
    label: 'Library',
    icon: Library,
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: Zap, // Active workout tab - energy/power theme
    notificationDot: false, // Will be set dynamically if workout is active
  },
  {
    id: 'social',
    label: 'Social',
    icon: Users,
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

export const defaultTab = 'home';
