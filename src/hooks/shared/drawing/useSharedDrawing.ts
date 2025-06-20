
import { useCallback } from 'react';
import { LineObject, ActivityMetadata } from '@/types/whiteboard';
import { useDrawingState } from '../../useDrawingState';
import { serializeDrawOperation } from '@/utils/operationSerializer';
import { calculateLineBounds } from './useDrawingBounds';

/**
 * @fileoverview Shared drawing operations hook
 * @description Handles pencil and highlighter drawing with sync and activity tracking
 */

export const useSharedDrawing = (
  state: any,
  setState: any,
  addToHistory: (snapshot?: any, activityMetadata?: ActivityMetadata) => void,
  sendOperation: any,
  isApplyingRemoteOperation: React.MutableRefObject<boolean>,
  whiteboardId?: string
) => {
  // Drawing operations with sync
  const {
    startDrawing,
    continueDrawing,
    stopDrawing: baseStopDrawing
  } = useDrawingState(state, setState, () => {}); // Don't call addToHistory from base drawing

  const stopDrawing = useCallback(() => {
    if (!state.isDrawing) return;

    console.log(`[DrawingOperations] stopDrawing called - current tool: ${state.currentTool}, lines count: ${state.lines.length}`);

    baseStopDrawing();

    // Calculate activity metadata for the drawn line
    const drawnLine = state.lines[state.lines.length - 1];
    let activityMetadata: ActivityMetadata | undefined;

    if (drawnLine && (drawnLine.tool === 'pencil' || drawnLine.tool === 'highlighter')) {
      const bounds = calculateLineBounds(drawnLine);
      activityMetadata = {
        type: 'draw',
        bounds,
        timestamp: Date.now()
      };
      
      console.log(`[DrawingOperations] Created activity metadata for ${drawnLine.tool}:`, activityMetadata);
    }

    // Add to history with activity metadata
    setTimeout(() => {
      addToHistory({
        lines: state.lines,
        images: state.images,
        selectionState: state.selectionState
      }, activityMetadata);
    }, 0);

    // Always send the operation to the database for persistence
    // But only sync to other clients if we're on the teacher's main board
    if (sendOperation && !isApplyingRemoteOperation.current) {
      console.log(`[DrawingOperations] Last drawn line:`, drawnLine);
      
      // Fix: Include both pencil and highlighter tools for sync
      if (drawnLine && (drawnLine.tool === 'pencil' || drawnLine.tool === 'highlighter')) {
        // Create the operation with proper whiteboardId
        const operation = serializeDrawOperation(drawnLine, whiteboardId);
        
        console.log(`[DrawingOperations] Sending ${drawnLine.tool} operation to sync:`, operation);
        console.log(`[DrawingOperations] sendOperation function exists:`, !!sendOperation);
        console.log(`[DrawingOperations] isApplyingRemoteOperation:`, isApplyingRemoteOperation.current);
        
        // Send it to the database/sync system
        sendOperation(operation);
      } else {
        console.log(`[DrawingOperations] NOT sending operation - drawnLine:`, drawnLine, 'tool check:', drawnLine?.tool);
      }
    } else {
      console.log(`[DrawingOperations] NOT sending operation - sendOperation:`, !!sendOperation, 'isApplyingRemoteOperation:', isApplyingRemoteOperation.current);
    }
  }, [state.isDrawing, state.lines, state.images, state.selectionState, state.currentTool, baseStopDrawing, sendOperation, isApplyingRemoteOperation, addToHistory, whiteboardId]);

  return {
    startDrawing,
    continueDrawing,
    stopDrawing
  };
};
