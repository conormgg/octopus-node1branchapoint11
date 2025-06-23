
import { useCallback } from 'react';
import { LineObject, ActivityMetadata } from '@/types/whiteboard';
import { serializeUpdateLineOperation, serializeDeleteObjectsOperation } from '@/utils/operationSerializer';
import { calculateLineBounds } from './useDrawingBounds';

/**
 * @fileoverview Shared object operations hook
 * @description Handles line updates and object deletion with sync
 */

// Debug flag for line movement - set to true to see line movement logs
const DEBUG_LINE_MOVEMENT = false;

export const useSharedObjectOperations = (
  state: any,
  setState: any,
  addToHistory: (snapshot?: any, activityMetadata?: ActivityMetadata) => void,
  sendOperation: any,
  isApplyingRemoteOperation: React.MutableRefObject<boolean>
) => {
  // Update line position/transformation
  const updateLine = useCallback((lineId: string, updates: Partial<LineObject>) => {
    if (DEBUG_LINE_MOVEMENT) {
      console.log(`[Line Movement] Updating line ${lineId}:`, updates);
    }
    
    // Check if this is a transformational update (move, scale, rotate)
    const isTransformationalUpdate = updates.x !== undefined || 
                                   updates.y !== undefined || 
                                   updates.scaleX !== undefined || 
                                   updates.scaleY !== undefined || 
                                   updates.rotation !== undefined;
    
    let activityMetadata: ActivityMetadata | undefined = undefined;
    
    setState((prev: any) => {
      const updatedLines = prev.lines.map((line: LineObject) =>
        line.id === lineId ? { ...line, ...updates } : line
      );
      
      // If this is a transformational update, generate activity metadata
      if (isTransformationalUpdate) {
        const updatedLine = updatedLines.find((line: LineObject) => line.id === lineId);
        if (updatedLine) {
          const bounds = calculateLineBounds(updatedLine);
          activityMetadata = {
            type: 'move',
            bounds,
            timestamp: Date.now()
          };
          
          if (DEBUG_LINE_MOVEMENT) {
            console.log(`[Line Movement] Generated activity metadata:`, activityMetadata);
          }
        }
      }
      
      const newState = {
        ...prev,
        lines: updatedLines
      };
      
      // Use the updated state for history - call addToHistory synchronously with correct state
      if (activityMetadata) {
        // Use setTimeout(0) to ensure setState completes, but with the correct state
        setTimeout(() => {
          addToHistory({
            lines: newState.lines,
            images: newState.images,
            selectionState: newState.selectionState
          }, activityMetadata);
        }, 0);
      } else {
        setTimeout(() => {
          addToHistory({
            lines: newState.lines,
            images: newState.images,
            selectionState: newState.selectionState
          });
        }, 0);
      }
      
      return newState;
    });
    
    // Always send the operation to the database for persistence
    // But only sync to other clients if we're on the teacher's main board
    if (sendOperation && !isApplyingRemoteOperation.current) {
      // Create the operation
      const operation = serializeUpdateLineOperation(lineId, updates);
      
      if (DEBUG_LINE_MOVEMENT) {
        console.log(`[Line Movement] Sending operation to database:`, operation);
      }
      
      // Send it to the database/sync system
      sendOperation(operation);
    }
  }, [setState, addToHistory, sendOperation, isApplyingRemoteOperation]);

  // Delete selected objects
  const deleteSelectedObjects = useCallback((selectedObjects: Array<{ id: string; type: 'line' | 'image' }>) => {
    if (!selectedObjects || selectedObjects.length === 0) return;

    const selectedLineIds = selectedObjects
      .filter(obj => obj.type === 'line')
      .map(obj => obj.id);
    const selectedImageIds = selectedObjects
      .filter(obj => obj.type === 'image')
      .map(obj => obj.id);

    console.log(`[DeleteObjects] Deleting ${selectedLineIds.length} lines and ${selectedImageIds.length} images`);
    console.log(`[DeleteObjects] isApplyingRemoteOperation: ${isApplyingRemoteOperation.current}`);

    setState((prev: any) => {
      const newState = {
        ...prev,
        lines: prev.lines.filter((line: LineObject) => !selectedLineIds.includes(line.id)),
        images: prev.images.filter((image: any) => !selectedImageIds.includes(image.id))
      };
      
      // Add to history with correct state
      setTimeout(() => {
        addToHistory({
          lines: newState.lines,
          images: newState.images,
          selectionState: newState.selectionState
        });
      }, 0);
      
      return newState;
    });

    // Always send the operation to the database for persistence
    // But only sync to other clients if we're on the teacher's main board
    if (sendOperation && !isApplyingRemoteOperation.current) {
      console.log(`[DeleteObjects] Sending delete operation to sync`);
      // Create the operation
      const operation = serializeDeleteObjectsOperation(selectedLineIds, selectedImageIds);
      console.log(`[DeleteObjects] Delete operation:`, operation);
      
      // Send it to the database/sync system
      sendOperation(operation);
    } else {
      console.log(`[DeleteObjects] Not sending operation - sendOperation: ${!!sendOperation}, isApplyingRemoteOperation: ${isApplyingRemoteOperation.current}`);
    }
  }, [setState, addToHistory, sendOperation, isApplyingRemoteOperation]);

  return {
    updateLine,
    deleteSelectedObjects
  };
};
