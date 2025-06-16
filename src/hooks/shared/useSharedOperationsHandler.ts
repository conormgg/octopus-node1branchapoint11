
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
  whiteboardId?: string,
  onLastActivityUpdate?: (activity: any) => void
) => {
  debugLog('Operations', 'Initializing operations handler', { whiteboardId });

  // Coordinate all operations (drawing, sync, history, etc.) with whiteboard ID
  const operations = useSharedOperationsCoordinator(syncConfig, state, setState, whiteboardId);

  // Handle persistence and context integration with activity tracking
  useSharedPersistenceIntegration(
    state, 
    setState, 
    syncConfig, 
    whiteboardId, 
    undefined, 
    onLastActivityUpdate
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

  /**
   * @function deleteSelectedObjects
   * @description Deletes currently selected objects and syncs the operation
   */
  const deleteSelectedObjects = useCallback(() => {
    const selectedObjects = selection.selectionState.selectedObjects;
    debugLog('Delete', 'Delete selected objects requested', { 
      count: selectedObjects?.length || 0 
    });
    
    if (selectedObjects && operations.deleteSelectedObjects) {
      operations.deleteSelectedObjects(selectedObjects);
      selection.clearSelection();
      debugLog('Delete', 'Objects deleted and selection cleared');
    }
  }, [selection, operations]);

  debugLog('Operations', 'Operations handler initialized', { whiteboardId });

  return {
    operations,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    deleteSelectedObjects
  };
};
