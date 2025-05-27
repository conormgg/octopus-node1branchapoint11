
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoAuthContextType {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  demoUser: {
    id: string;
    email: string;
    user_metadata: {
      full_name: string;
      role: string;
    };
  } | null;
}

const DemoAuthContext = createContext<DemoAuthContextType | undefined>(undefined);

export const DemoAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    // Initialize from localStorage to persist across page reloads
    return localStorage.getItem('demoMode') === 'true';
  });

  const demoUser = isDemoMode ? {
    id: 'demo-teacher-id',
    email: 'demo@teacher.local',
    user_metadata: {
      full_name: 'Demo Teacher',
      role: 'teacher'
    }
  } : null;

  const setDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled);
    // Persist to localStorage
    if (enabled) {
      localStorage.setItem('demoMode', 'true');
    } else {
      localStorage.removeItem('demoMode');
    }
  };

  return (
    <DemoAuthContext.Provider value={{ isDemoMode, setDemoMode, demoUser }}>
      {children}
    </DemoAuthContext.Provider>
  );
};

export const useDemoAuth = () => {
  const context = useContext(DemoAuthContext);
  if (context === undefined) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  }
  return context;
};
