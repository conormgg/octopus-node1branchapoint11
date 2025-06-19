import { useCallback } from 'react';
import { WhiteboardOperation, DrawOperationData, EraseOperationData, AddImageOperationData, UpdateImageOperationData, DeleteImageOperationData } from '@/types/sync';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('operations');

/**
 * @hook useRemoteOperationHandler
 * @description Handles remote operations received from other clients
 * 
 * @param setState - Function to update whiteboard state
 * @param undo - Undo function from history state
 * @param redo - Redo function from history state
 * @param isApplyingRemoteOperationRef - Ref to track if currently applying remote operation
 * 
 * @returns {Object} Remote operation handlers
 * @returns {Function} handleRemoteOperation - Process incoming remote operations
 */
export const useRemoteOperationHandler = (
  setState: (updater: (prev: any) => any) => void,
  undo: () => void,
  redo: () => void,
  isApplyingRemoteOperationRef?: React.MutableRefObject<boolean>
) => {
  debugLog('Hook', 'Initializing remote operation handler');

  /**
   * @function handleRemoteOperation
   * @description Processes operations received from remote clients
   * @param operation - The remote operation to apply
   */
  const handleRemoteOperation = useCallback((operation: WhiteboardOperation) => {
    debugLog('Operation', 'Handling remote operation', {
      type: operation.operation_type,
      sender: operation.sender_id,
      timestamp: operation.timestamp
    });

    // Set flag to prevent local operation broadcasting during remote operation application
    if (isApplyingRemoteOperationRef) {
      isApplyingRemoteOperationRef.current = true;
    }

    try {
      switch (operation.operation_type) {
        case 'draw':
          const drawData = operation.data as DrawOperationData;
          setState(prev => ({
            ...prev,
            lines: [...prev.lines, drawData.line]
          }));
          break;

        case 'erase':
          const eraseData = operation.data as EraseOperationData;
          setState(prev => ({
            ...prev,
            lines: prev.lines.filter((line: any) => !eraseData.line_ids.includes(line.id))
          }));
          break;

        case 'add_image':
          const addImageData = operation.data as AddImageOperationData;
          setState(prev => ({
            ...prev,
            images: [...prev.images, addImageData.image]
          }));
          break;

        case 'update_image':
          const updateImageData = operation.data as UpdateImageOperationData;
          setState(prev => ({
            ...prev,
            images: prev.images.map((img: any) =>
              img.id === updateImageData.image_id ? { ...img, ...updateImageData.updates } : img
            )
          }));
          break;

        case 'delete_image':
          const deleteImageData = operation.data as DeleteImageOperationData;
          setState(prev => ({
            ...prev,
            images: prev.images.filter((img: any) => img.id !== deleteImageData.image_id)
          }));
          break;

        case 'undo':
          debugLog('Operation', 'Processing remote undo');
          undo();
          break;

        case 'redo':
          debugLog('Operation', 'Processing remote redo');
          redo();
          break;

        default:
          debugLog('Operation', 'Unknown operation type', operation.operation_type);
      }

      debugLog('Operation', 'Remote operation applied successfully');
    } catch (error) {
      debugLog('Operation', 'Error applying remote operation', error);
    } finally {
      // Always reset the flag
      if (isApplyingRemoteOperationRef) {
        isApplyingRemoteOperationRef.current = false;
      }
    }
  }, [setState, undo, redo, isApplyingRemoteOperationRef]);

  return {
    handleRemoteOperation
  };
};
