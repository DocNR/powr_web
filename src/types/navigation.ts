export interface NavigationTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  notificationDot?: boolean;
  href?: string;
}

export interface NavigationState {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}
