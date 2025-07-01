export interface SubNavItem {
  id: string;
  label: string;
}

export interface SubNavigationConfig {
  [tabId: string]: SubNavItem[];
}

export const subNavigationConfig: SubNavigationConfig = {
  social: [
    { id: 'all', label: 'All users' },
    { id: 'me', label: 'Me' },
    { id: 'leaderboard', label: 'Leaderboard' }
  ],
  library: [
    { id: 'exercises', label: 'Exercises' },
    { id: 'templates', label: 'Templates' },
    { id: 'programs', label: 'Programs' }
  ]
};

export function getSubNavigation(tabId: string): SubNavItem[] | undefined {
  return subNavigationConfig[tabId];
}
