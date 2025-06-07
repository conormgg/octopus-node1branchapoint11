
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SessionContextType {
  currentSessionId: string | null;
  setCurrentSessionId: (sessionId: string | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  return (
    <SessionContext.Provider value={{ currentSessionId, setCurrentSessionId }}>
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
