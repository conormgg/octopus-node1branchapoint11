
import React, { createContext, useContext } from 'react';
import { useSessionExpiration } from '@/hooks/sessionExpiration';
import { SessionExpirationContextType, SessionExpirationProviderProps } from './types';

const SessionExpirationContext = createContext<SessionExpirationContextType | undefined>(undefined);

export const SessionExpirationProvider: React.FC<SessionExpirationProviderProps> = ({
  children,
  sessionId,
  onSessionExpired
}) => {
  const contextValue = useSessionExpiration({ sessionId, onSessionExpired });

  return (
    <SessionExpirationContext.Provider value={contextValue}>
      {children}
    </SessionExpirationContext.Provider>
  );
};

export const useSessionExpirationContext = () => {
  const context = useContext(SessionExpirationContext);
  if (context === undefined) {
    throw new Error('useSessionExpirationContext must be used within a SessionExpirationProvider');
  }
  return context;
};
