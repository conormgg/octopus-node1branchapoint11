
import { useRef } from 'react';
import { SyncConfig } from '@/types/sync';
import { useWhiteboardPersistence } from '../useWhiteboardPersistence';

/**
 * @hook useDataLoader
 * @description Handles database loading and initial data management
 */
export const useDataLoader = (
  syncConfig?: SyncConfig,
  whiteboardId?: string
) => {
  // Track if we've loaded initial data to prevent re-loading
  const hasLoadedInitialData = useRef(false);
  
  // Load persisted whiteboard data if available
  const persistence = syncConfig && whiteboardId ? useWhiteboardPersistence({
    whiteboardId,
    sessionId: syncConfig.sessionId
  }) : { 
    isLoading: false, 
    error: null, 
    lines: [], 
    images: [], 
    lastActivity: null, 
    orderedOperations: [] 
  };

  return {
    persistence,
    hasLoadedInitialData
  };
};
