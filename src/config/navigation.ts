import { Home, Dumbbell, TrendingUp, User, Zap } from 'lucide-react';
import { NavigationTab } from '@/types/navigation';

export const navigationTabs: NavigationTab[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
  },
  {
    id: 'workouts',
    label: 'Workouts',
    icon: Dumbbell,
  },
  {
    id: 'active',
    label: 'Active',
    icon: Zap, // Changed from Play to Zap for more energy/power theme
    notificationDot: false, // Will be set dynamically if workout is active
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: TrendingUp,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
  },
];

export const defaultTab = 'home';
