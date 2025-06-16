
import { useCallback, useEffect } from 'react';
import { LineObject, ImageObject, HistorySnapshot, SelectionState, ActivityMetadata } from '@/types/whiteboard';
import { WhiteboardOperation, SyncConfig } from '@/types/sync';
import { useHistoryState } from '../useHistoryState';
import { useSyncState } from '../useSyncState';
import { useRemoteOperationHandler } from '../useRemoteOperationHandler';
import { serializeDrawOperation, serializeEraseOperation, serializeAddImageOperation, serializeUpdateImageOperation, serializeDeleteImageOperation, serializeUpdateLineOperation, serializeDeleteObjectsOperation, calculateObjectBounds } from '@/utils/operationSerializer';
import { createDebugLogger } from '@/utils/debug/debugConfig';
import { useSelectionState } from '../useSelectionState';
import { SyncConnectionManager } from '@/utils/sync';

const debugLog = createDebugLogger('state');

export const useSharedOperationsCoordinator = (
  syncConfig: SyncConfig | undefined,
  state: any,
  setState: any,
  whiteboardId?: string
) => {
  debugLog('OperationsCoordinator', 'Initializing operations coordinator', { whiteboardId });

  const selection = useSelectionState(state, setState);

  // History management with sync integration
  const { syncState, sendOperation } = syncConfig 
    ? useSyncState(syncConfig, () => {}) // Temporary handler, will be replaced
    : { syncState: null, sendOperation: null };

  const history = useHistoryState(
    state,
    setState,
    selection?.updateSelectionState,
    sendOperation
  );

  // Remote operation handling with access to local undo/redo functions
  const remoteHandler = useRemoteOperationHandler(
    setState,
    history.performLocalUndo,
    history.performLocalRedo
  );

  // Register the proper remote operation handler with sync
  useEffect(() => {
    if (syncConfig) {
      const handler = (operation: WhiteboardOperation) => {
        debugLog('RemoteOp', 'Received remote operation', operation.operation_type);
        remoteHandler.handleRemoteOperation(operation);
      };
      
      SyncConnectionManager.registerHandler(syncConfig, handler);
      
      return () => {
        SyncConnectionManager.unregisterHandler(syncConfig, handler);
      };
    }
  }, [syncConfig, remoteHandler.handleRemoteOperation]);

  const sendOperationIfSync = useCallback((operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>) => {
    if (!sendOperation) {
      console.warn('Attempted to send operation without sync config. Operation dropped.');
      return null;
    }

    // Optimistically apply the operation locally
    setState(prev => {
      const updatedState = {
        ...prev,
        lastActivity: {
          type: operation.operation_type,
          timestamp: Date.now(),
          bounds: { x: 0, y: 0, width: 100, height: 100 }
        } as ActivityMetadata
      };
      return updatedState;
    });

    return sendOperation(operation);
  }, [sendOperation, setState]);

  const startDrawing = useCallback((line: LineObject) => {
    debugLog('Draw', 'Start drawing', line);
    if (sendOperation) {
      const operation = serializeDrawOperation(line);
      sendOperationIfSync(operation);
    }
  }, [sendOperationIfSync, sendOperation]);

  const continueDrawing = useCallback((line: LineObject) => {
    // No operation needed for continuing drawing
  }, []);

  const stopDrawing = useCallback(() => {
    // No operation needed for stopping drawing
  }, []);

  const startErasing = useCallback((lineId: string) => {
    debugLog('Erase', 'Start erasing', lineId);
    if (sendOperation) {
      const operation = serializeEraseOperation([lineId]);
      sendOperationIfSync(operation);
    }
  }, [sendOperationIfSync, sendOperation]);

  const continueErasing = useCallback((lineId: string) => {
    // No operation needed for continuing erasing
  }, []);

  const stopErasing = useCallback(() => {
    // No operation needed for stopping erasing
  }, []);

  const handlePaste = useCallback((event: ClipboardEvent, stage: any) => {
    // This will be handled by the image operations in the parent hook
    debugLog('Paste', 'Paste event received in coordinator');
  }, []);

  const updateImageState = useCallback((imageId: string, updates: Partial<ImageObject>) => {
    debugLog('Image', `Updating image state for ${imageId}`, updates);
    if (sendOperation) {
      const operation = serializeUpdateImageOperation(imageId, updates);
      sendOperationIfSync(operation);
    }
  }, [sendOperationIfSync, sendOperation]);

  const updateLine = useCallback((lineId: string, updates: Partial<LineObject>) => {
    debugLog('Line', `Updating line state for ${lineId}`, updates);
    if (sendOperation) {
      const operation = serializeUpdateLineOperation(lineId, updates);
      sendOperationIfSync(operation);
    }
  }, [sendOperationIfSync, sendOperation]);

  const updateImage = useCallback((imageId: string, updates: Partial<ImageObject>) => {
    debugLog('Image', `Updating image state for ${imageId}`, updates);
    if (sendOperation) {
      const operation = serializeUpdateImageOperation(imageId, updates);
      sendOperationIfSync(operation);
    }
  }, [sendOperationIfSync, sendOperation]);

  const toggleImageLock = useCallback((imageId: string) => {
    debugLog('Image', `Toggling image lock for ${imageId}`);
    // Implementation would go here
  }, []);

  const deleteSelectedObjects = useCallback((selectedObjects: any[]) => {
    if (!selectedObjects || selectedObjects.length === 0) {
      console.warn('No objects selected to delete.');
      return;
    }
  
    const lineIds = selectedObjects
      .filter(obj => obj.type === 'line')
      .map(obj => obj.id);
  
    const imageIds = selectedObjects
      .filter(obj => obj.type === 'image')
      .map(obj => obj.id);
  
    if (lineIds.length === 0 && imageIds.length === 0) {
      console.warn('No lines or images selected to delete.');
      return;
    }
  
    debugLog('Delete', `Deleting objects - lines: ${lineIds.length}, images: ${imageIds.length}`);
    if (sendOperation) {
      const operation = serializeDeleteObjectsOperation(lineIds, imageIds);
      sendOperationIfSync(operation);
    }
  }, [sendOperationIfSync, sendOperation]);

  return {
    startDrawing,
    continueDrawing,
    stopDrawing,
    startErasing,
    continueErasing,
    stopErasing,
    handlePaste,
    updateImageState,
    updateLine,
    updateImage,
    toggleImageLock,
    deleteSelectedObjects,
    addToHistory: history.addToHistory,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    getLastActivity: history.getLastActivity,
    syncState: {
      isConnected: syncState?.isConnected || false,
      isReceiveOnly: syncState?.isReceiveOnly || false,
      lastSyncTimestamp: syncState?.lastSyncTimestamp || Date.now(),
      pendingOperations: syncState?.pendingOperations || []
    },
    handleRemoteOperation: remoteHandler.handleRemoteOperation
  };
};
