'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SubNavigationContextType {
  activeSubTabs: Record<string, string>;
  setActiveSubTab: (tabId: string, subTabId: string) => void;
  getActiveSubTab: (tabId: string) => string | undefined;
}

const SubNavigationContext = createContext<SubNavigationContextType | undefined>(undefined);

interface SubNavigationProviderProps {
  children: ReactNode;
}

export function SubNavigationProvider({ children }: SubNavigationProviderProps) {
  const [activeSubTabs, setActiveSubTabs] = useState<Record<string, string>>({
    social: 'all',
    library: 'exercises'
  });

  const setActiveSubTab = (tabId: string, subTabId: string) => {
    setActiveSubTabs(prev => ({
      ...prev,
      [tabId]: subTabId
    }));
  };

  const getActiveSubTab = (tabId: string) => {
    return activeSubTabs[tabId];
  };

  return (
    <SubNavigationContext.Provider value={{
      activeSubTabs,
      setActiveSubTab,
      getActiveSubTab
    }}>
      {children}
    </SubNavigationContext.Provider>
  );
}

export function useSubNavigation() {
  const context = useContext(SubNavigationContext);
  if (context === undefined) {
    throw new Error('useSubNavigation must be used within a SubNavigationProvider');
  }
  return context;
}
