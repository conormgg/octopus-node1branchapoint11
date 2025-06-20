
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
  isApplyingRemoteOperation: React.MutableRefObject<boolean>,
  whiteboardId?: string
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
      
      return {
        ...prev,
        lines: updatedLines
      };
    });
    
    // Always send the operation to the database for persistence
    // But only sync to other clients if we're on the teacher's main board
    if (sendOperation && !isApplyingRemoteOperation.current) {
      // Create the operation with proper whiteboardId
      const operation = serializeUpdateLineOperation(lineId, updates, whiteboardId);
      
      if (DEBUG_LINE_MOVEMENT) {
        console.log(`[Line Movement] Sending operation to database:`, operation);
      }
      
      // Send it to the database/sync system
      sendOperation(operation);
    }
    
    // Add to history after state update with activity metadata if generated
    setTimeout(() => {
      addToHistory({
        lines: state.lines,
        images: state.images,
        selectionState: state.selectionState
      }, activityMetadata);
    }, 0);
  }, [setState, state.lines, state.images, state.selectionState, addToHistory, sendOperation, isApplyingRemoteOperation, whiteboardId]);

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

    setState((prev: any) => ({
      ...prev,
      lines: prev.lines.filter((line: LineObject) => !selectedLineIds.includes(line.id)),
      images: prev.images.filter((image: any) => !selectedImageIds.includes(image.id))
    }));

    // Add to history
    setTimeout(() => {
      addToHistory({
        lines: state.lines,
        images: state.images,
        selectionState: state.selectionState
      });
    }, 0);

    // Always send the operation to the database for persistence
    // But only sync to other clients if we're on the teacher's main board
    if (sendOperation && !isApplyingRemoteOperation.current) {
      console.log(`[DeleteObjects] Sending delete operation to sync`);
      // Create the operation with proper whiteboardId
      const operation = serializeDeleteObjectsOperation(selectedLineIds, selectedImageIds, whiteboardId);
      console.log(`[DeleteObjects] Delete operation:`, operation);
      
      // Send it to the database/sync system
      sendOperation(operation);
    } else {
      console.log(`[DeleteObjects] Not sending operation - sendOperation: ${!!sendOperation}, isApplyingRemoteOperation: ${isApplyingRemoteOperation.current}`);
    }
  }, [setState, state.lines, state.images, state.selectionState, addToHistory, sendOperation, isApplyingRemoteOperation, whiteboardId]);

  return {
    updateLine,
    deleteSelectedObjects
  };
};
