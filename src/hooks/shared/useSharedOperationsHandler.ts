/**
 * @fileoverview Operations handler for shared whiteboards
 * @description Coordinates operations, persistence, and pointer handling
 */

import { useCallback } from 'react';
import { SyncConfig } from '@/types/sync';
import { useSharedOperationsCoordinator } from './useSharedOperationsCoordinator';
import { useSharedPersistenceIntegration } from './useSharedPersistenceIntegration';
import { useSharedPointerHandlers } from './useSharedPointerHandlers';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('state');

/**
 * @hook useSharedOperationsHandler
 * @description Handles all operations for shared whiteboards
 */
export const useSharedOperationsHandler = (
  syncConfig: SyncConfig | undefined,
  state: any,
  setState: any,
  panZoom: any,
  selection: any,
  whiteboardId?: string
) => {
  debugLog('Operations', 'Initializing operations handler', { whiteboardId });

  // Coordinate all operations (drawing, sync, history, etc.) with whiteboard ID
  const operations = useSharedOperationsCoordinator(syncConfig, state, setState, whiteboardId);

  // Handle persistence and context integration - no longer needs addToHistory for pure replay
  useSharedPersistenceIntegration(
    state, 
    setState, 
    syncConfig, 
    whiteboardId, 
    undefined // isApplyingRemoteOperation - will be passed from parent if needed
    // Removed addToHistory parameter - pure replay doesn't need it
  );

  // Pointer event handlers with proper safety checks
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useSharedPointerHandlers(
    state, 
    operations.startDrawing, 
    operations.continueDrawing, 
    operations.stopDrawing, 
    operations.startErasing, 
    operations.continueErasing, 
    operations.stopErasing,
    syncConfig, 
    panZoom, 
    selection
  );

  debugLog('Operations', 'Operations handler initialized', { whiteboardId });

  return {
    operations,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
};
