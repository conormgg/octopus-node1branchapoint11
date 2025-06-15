
/**
 * @fileoverview Performance dashboard provider for developer access
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerPerformanceDashboardCallback, getPerformanceDashboardState } from '@/utils/debug/globalDebugExports';
import PerformanceDashboard from './PerformanceDashboard';

interface PerformanceDashboardContextType {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
}

const PerformanceDashboardContext = createContext<PerformanceDashboardContextType | null>(null);

export const usePerformanceDashboard = () => {
  const context = useContext(PerformanceDashboardContext);
  if (!context) {
    throw new Error('usePerformanceDashboard must be used within PerformanceDashboardProvider');
  }
  return context;
};

interface PerformanceDashboardProviderProps {
  children: React.ReactNode;
}

export const PerformanceDashboardProvider: React.FC<PerformanceDashboardProviderProps> = ({
  children
}) => {
  const [isVisible, setIsVisible] = useState(getPerformanceDashboardState());

  useEffect(() => {
    // Only register in development mode
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const unregister = registerPerformanceDashboardCallback(() => {
      setIsVisible(getPerformanceDashboardState());
    });

    return unregister;
  }, []);

  const show = () => {
    if (window.debug?.showPerformanceDashboard) {
      window.debug.showPerformanceDashboard();
    }
  };

  const hide = () => {
    if (window.debug?.hidePerformanceDashboard) {
      window.debug.hidePerformanceDashboard();
    }
  };

  const contextValue: PerformanceDashboardContextType = {
    isVisible,
    show,
    hide
  };

  return (
    <PerformanceDashboardContext.Provider value={contextValue}>
      {children}
      {/* Only render dashboard in development mode when visible */}
      {process.env.NODE_ENV === 'development' && isVisible && (
        <PerformanceDashboard 
          isVisible={isVisible} 
          onClose={hide}
        />
      )}
    </PerformanceDashboardContext.Provider>
  );
};
