
import React, { createContext, useContext, ReactNode } from 'react';
import { UnifiedWhiteboardState } from '@/types/unifiedWhiteboard';
import { SyncConfig } from '@/types/sync';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { useSyncWhiteboardState } from '@/hooks/useSyncWhiteboardState';

interface WhiteboardContextType {
  whiteboardState: UnifiedWhiteboardState;
  isReadOnly: boolean;
}

const WhiteboardContext = createContext<WhiteboardContextType | undefined>(undefined);

interface WhiteboardProviderProps {
  children: ReactNode;
  syncConfig?: SyncConfig;
  isReadOnly?: boolean;
}

export const WhiteboardProvider: React.FC<WhiteboardProviderProps> = ({
  children,
  syncConfig,
  isReadOnly = false
}) => {
  // Use sync whiteboard state if sync config is provided, otherwise use local state
  const whiteboardState = syncConfig 
    ? useSyncWhiteboardState(syncConfig)
    : useWhiteboardState();

  return (
    <WhiteboardContext.Provider value={{ 
      whiteboardState: {
        ...whiteboardState,
        isReadOnly: isReadOnly || whiteboardState.isReadOnly
      },
      isReadOnly: isReadOnly || whiteboardState.isReadOnly || false
    }}>
      {children}
    </WhiteboardContext.Provider>
  );
};

export const useWhiteboard = () => {
  const context = useContext(WhiteboardContext);
  if (context === undefined) {
    throw new Error('useWhiteboard must be used within a WhiteboardProvider');
  }
  return context;
};
