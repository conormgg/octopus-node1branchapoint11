
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SessionContextType {
  currentSessionId: string | null;
  setCurrentSessionId: (sessionId: string | null) => void;
  clearCurrentSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const clearCurrentSession = () => {
    setCurrentSessionId(null);
  };

  return (
    <SessionContext.Provider value={{ 
      currentSessionId, 
      setCurrentSessionId,
      clearCurrentSession 
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
};
