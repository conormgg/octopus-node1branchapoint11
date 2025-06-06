
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface SessionContextType {
  sessionId: string;
  userId: string;
  generateNewSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>(() => {
    // Try to get existing session from localStorage or generate new one
    const existing = localStorage.getItem('whiteboard-session-id');
    return existing || uuidv4();
  });

  const [userId, setUserId] = useState<string>(() => {
    // Try to get existing user ID or generate new one
    const existing = localStorage.getItem('whiteboard-user-id');
    return existing || uuidv4();
  });

  useEffect(() => {
    // Persist session and user IDs
    localStorage.setItem('whiteboard-session-id', sessionId);
    localStorage.setItem('whiteboard-user-id', userId);
  }, [sessionId, userId]);

  const generateNewSession = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    localStorage.setItem('whiteboard-session-id', newSessionId);
  };

  return (
    <SessionContext.Provider value={{ sessionId, userId, generateNewSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
