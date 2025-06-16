import { useCallback } from 'react';
import { LineObject, ImageObject, HistorySnapshot, SelectionState, ActivityMetadata } from '@/types/whiteboard';
import { WhiteboardOperation, SyncConfig } from '@/types/sync';
import { useHistoryState } from '../useHistoryState';
import { useRemoteOperationHandler } from '../useRemoteOperationHandler';
import { serializeDrawOperation, serializeEraseOperation, serializeAddImageOperation, serializeUpdateImageOperation, serializeDeleteImageOperation, serializeUpdateLineOperation, serializeDeleteObjectsOperation, calculateObjectBounds } from '@/utils/operationSerializer';
import { createDebugLogger } from '@/utils/debug/debugConfig';
import { useSelectionState } from '../useSelectionState';

const debugLog = createDebugLogger('state');

export const useSharedOperationsCoordinator = (
  syncConfig: SyncConfig | undefined,
  state: any,
  setState: any,
  whiteboardId?: string
) => {
  debugLog('OperationsCoordinator', 'Initializing operations coordinator', { whiteboardId });

  const selection = useSelectionState(state, setState);

  const sendOperation = useCallback((operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>) => {
    if (!syncConfig) {
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
          bounds: { x: 0, y: 0, width: 100, height: 100 } // Provide default bounds
        } as ActivityMetadata
      };
      return updatedState;
    });

    // Send the operation to the server
    const fullOperation = {
      ...operation,
      whiteboard_id: syncConfig.whiteboardId,
      timestamp: Date.now(),
      sender_id: syncConfig.senderId
    };

    // Simulate sending the operation and handling the response
    setTimeout(() => {
      console.log(`[${whiteboardId}] Sent operation:`, fullOperation);
    }, 100);

    return fullOperation;
  }, [syncConfig, setState, whiteboardId]);

  // History management with sync integration
  const history = useHistoryState(
    state,
    setState,
    selection?.updateSelectionState,
    syncConfig ? sendOperation : null
  );

  // Remote operation handling with access to local undo/redo functions
  const remoteHandler = useRemoteOperationHandler(
    setState,
    history.performLocalUndo, // Pass the local undo function
    history.performLocalRedo  // Pass the local redo function
  );

  const startDrawing = useCallback((line: LineObject) => {
    debugLog('Draw', 'Start drawing', line);
    const operation = serializeDrawOperation(line);
    sendOperation(operation);
  }, [sendOperation]);

  const continueDrawing = useCallback((line: LineObject) => {
    // No operation needed for continuing drawing
  }, []);

  const stopDrawing = useCallback(() => {
    // No operation needed for stopping drawing
  }, []);

  const startErasing = useCallback((lineId: string) => {
    debugLog('Erase', 'Start erasing', lineId);
    const operation = serializeEraseOperation([lineId]);
    sendOperation(operation);
  }, [sendOperation]);

  const continueErasing = useCallback((lineId: string) => {
    // No operation needed for continuing erasing
  }, []);

  const stopErasing = useCallback(() => {
    // No operation needed for stopping erasing
  }, []);

  const handlePaste = useCallback((event: ClipboardEvent, image: ImageObject | null) => {
    if (image) {
      debugLog('Paste', 'Pasting image', image);
      const operation = serializeAddImageOperation(image);
      sendOperation(operation);
    }
  }, [sendOperation]);

  const updateImageState = useCallback((imageId: string, updates: Partial<ImageObject>) => {
    debugLog('Image', `Updating image state for ${imageId}`, updates);
    const operation = serializeUpdateImageOperation(imageId, updates);
    sendOperation(operation);
  }, [sendOperation]);

  const updateLine = useCallback((lineId: string, updates: Partial<LineObject>) => {
    debugLog('Line', `Updating line state for ${lineId}`, updates);
    const operation = serializeUpdateLineOperation(lineId, updates);
    sendOperation(operation);
  }, [sendOperation]);

  const updateImage = useCallback((imageId: string, updates: Partial<ImageObject>) => {
    debugLog('Image', `Updating image state for ${imageId}`, updates);
    const operation = serializeUpdateImageOperation(imageId, updates);
    sendOperation(operation);
  }, [sendOperation]);

  const toggleImageLock = useCallback((imageId: string) => {
    debugLog('Image', `Toggling image lock for ${imageId}`);
    // const operation = serializeToggleImageLockOperation(imageId); // Assuming you have such a function
    // sendOperation(operation);
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
    const operation = serializeDeleteObjectsOperation(lineIds, imageIds);
    sendOperation(operation);
  }, [sendOperation]);

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
      isConnected: true,
      isReceiveOnly: false,
      lastSyncTimestamp: Date.now(),
      pendingOperations: []
    },
    handleRemoteOperation: remoteHandler.handleRemoteOperation
  };
};
