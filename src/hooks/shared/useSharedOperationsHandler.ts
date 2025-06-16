
/**
 * @fileoverview Operations handler for shared whiteboards
 * @description Coordinates operations, persistence, and pointer handling
 */

import { useCallback } from 'react';
import { SyncConfig } from '@/types/sync';
import { useSharedOperationsCoordinator } from './useSharedOperationsCoordinator';
import { useSharedPersistenceIntegration } from './useSharedPersistenceIntegration';
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

  // Handle persistence and context integration
  useSharedPersistenceIntegration(state, setState, syncConfig, whiteboardId);

  // Simple pointer handlers that match the expected signature
  const handlePointerDown = useCallback((x: number, y: number) => {
    // Pointer down logic will be handled by the canvas components
    debugLog('Pointer', 'Pointer down', { x, y });
  }, []);

  const handlePointerMove = useCallback((x: number, y: number) => {
    // Pointer move logic will be handled by the canvas components
    debugLog('Pointer', 'Pointer move', { x, y });
  }, []);

  const handlePointerUp = useCallback(() => {
    // Pointer up logic will be handled by the canvas components
    debugLog('Pointer', 'Pointer up');
  }, []);

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
