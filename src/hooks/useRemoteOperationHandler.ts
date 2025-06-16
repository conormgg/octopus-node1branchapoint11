
import { useCallback, useRef } from 'react';
import { WhiteboardOperation } from '@/types/sync';
import { ActivityMetadata } from '@/types/whiteboard';
import { applyOperation } from '@/utils/operationSerializer';
import { calculateLineBounds } from './shared/drawing/useDrawingBounds';

export const useRemoteOperationHandler = (
  setState: (updater: (prev: any) => any) => void,
  undo?: () => void,
  redo?: () => void
) => {
  const isApplyingRemoteOperation = useRef(false);

  // Helper function to create activity metadata from operations
  const createActivityFromOperation = (operation: WhiteboardOperation, updatedState: any): ActivityMetadata | undefined => {
    const timestamp = operation.timestamp || Date.now();

    switch (operation.operation_type) {
      case 'draw': {
        const drawnLine = operation.data?.line;
        if (drawnLine) {
          const bounds = calculateLineBounds(drawnLine);
          return {
            type: 'draw',
            bounds,
            timestamp
          };
        }
        break;
      }
      
      case 'erase': {
        const lineIds = operation.data?.line_ids || [];
        const erasedBounds = operation.data?.erased_bounds;
        
        if (lineIds.length > 0) {
          // Use stored bounds if available, otherwise create default bounds
          const bounds = erasedBounds || { x: 0, y: 0, width: 50, height: 50 };
          return {
            type: 'erase',
            bounds,
            timestamp
          };
        }
        break;
      }
      
      case 'add_image': {
        const image = operation.data?.image;
        if (image) {
          return {
            type: 'paste',
            bounds: {
              x: image.x || 0,
              y: image.y || 0,
              width: image.width || 100,
              height: image.height || 100
            },
            timestamp
          };
        }
        break;
      }
      
      case 'update_line': {
        const lineId = operation.data?.line_id;
        const updates = operation.data?.updates;
        if (lineId && updates && (updates.x !== undefined || updates.y !== undefined)) {
          // Find the updated line to get its bounds
          const updatedLine = updatedState.lines.find((line: any) => line.id === lineId);
          if (updatedLine) {
            const bounds = calculateLineBounds(updatedLine);
            return {
              type: 'move',
              bounds,
              timestamp
            };
          }
        }
        break;
      }
      
      case 'update_image': {
        const imageId = operation.data?.image_id;
        const updates = operation.data?.updates;
        if (imageId && updates && (updates.x !== undefined || updates.y !== undefined)) {
          // Find the updated image to get its bounds
          const updatedImage = updatedState.images.find((image: any) => image.id === imageId);
          if (updatedImage) {
            return {
              type: 'move',
              bounds: {
                x: updatedImage.x || 0,
                y: updatedImage.y || 0,
                width: updatedImage.width || 100,
                height: updatedImage.height || 100
              },
              timestamp
            };
          }
        }
        break;
      }

      case 'undo': {
        // Create a generic activity for undo operations
        return {
          type: 'erase', // Use 'erase' type as it's the closest to undo visually
          bounds: { x: 0, y: 0, width: 100, height: 100 }, // Generic bounds
          timestamp
        };
      }

      case 'redo': {
        // Create a generic activity for redo operations
        return {
          type: 'draw', // Use 'draw' type as it's the closest to redo visually
          bounds: { x: 0, y: 0, width: 100, height: 100 }, // Generic bounds
          timestamp
        };
      }
    }
    
    return undefined;
  };

  // Handle incoming operations from other clients
  const handleRemoteOperation = useCallback((operation: WhiteboardOperation) => {
    console.log(`[RemoteOperationHandler] Processing operation: ${operation.operation_type} from sender: ${operation.sender_id}`);
    
    // Handle undo/redo operations directly without applying to state
    if (operation.operation_type === 'undo' && undo) {
      console.log('[RemoteOperationHandler] Calling local undo from remote operation');
      undo();
      return;
    }

    if (operation.operation_type === 'redo' && redo) {
      console.log('[RemoteOperationHandler] Calling local redo from remote operation');
      redo();
      return;
    }
    
    isApplyingRemoteOperation.current = true;
    
    setState(prev => {
      // First, make sure we have the original state saved to apply the operation to
      const originalState = {
        lines: [...prev.lines],
        images: [...prev.images]
      };
      
      // Apply the operation to get the updated state
      const updatedState = applyOperation(originalState, operation);
      
      console.log(`[RemoteOperationHandler] State updated - Lines: ${prev.lines.length} -> ${updatedState.lines.length}, Images: ${prev.images.length} -> ${updatedState.images.length}`);
      
      // Check for deletions
      if (operation.operation_type === 'delete_objects' || operation.operation_type === 'erase') {
        console.log('[RemoteOperationHandler] Processing deletion operation', operation.data);
      }

      // Create activity metadata from the remote operation
      const activityMetadata = createActivityFromOperation(operation, updatedState);
      
      if (activityMetadata) {
        console.log('[RemoteOperationHandler] Created activity metadata from remote operation:', activityMetadata);
      }
      
      // Create new history snapshot with activity metadata
      const newHistorySnapshot = {
        lines: [...updatedState.lines],
        images: [...updatedState.images],
        selectionState: prev.selectionState,
        lastActivity: activityMetadata
      };
      
      // Ensure we do a deep copy of the state to force a re-render
      return {
        ...prev,
        lines: [...updatedState.lines],
        images: [...updatedState.images],
        // Update history to reflect the new state with activity metadata
        history: [
          newHistorySnapshot,
          ...prev.history.slice(0, 9) // Keep only the last 10 history entries
        ],
        historyIndex: 0
      };
    });
    
    // Keep the flag set longer for delete operations to prevent persistence interference
    const clearDelay = (operation.operation_type === 'delete_objects' || operation.operation_type === 'erase') ? 200 : 0;
    setTimeout(() => {
      isApplyingRemoteOperation.current = false;
    }, clearDelay);
  }, [setState, undo, redo]);

  return {
    handleRemoteOperation,
    isApplyingRemoteOperation
  };
};
