
import { useCallback, useRef } from 'react';
import { LineObject, ActivityMetadata } from '@/types/whiteboard';
import { useEraserState } from '../../useEraserState';
import { serializeEraseOperation } from '@/utils/operationSerializer';
import { calculateCombinedLineBounds } from './useDrawingBounds';

/**
 * @fileoverview Shared erasing operations hook
 * @description Handles eraser operations with sync and activity tracking
 */

export const useSharedErasing = (
  state: any,
  setState: any,
  addToHistory: (snapshot?: any, activityMetadata?: ActivityMetadata) => void,
  sendOperation: any,
  isApplyingRemoteOperation: React.MutableRefObject<boolean>
) => {
  // Track lines before erasing to detect what was erased
  const linesBeforeErasingRef = useRef<LineObject[]>([]);

  // Eraser operations with sync
  const {
    startErasing: baseStartErasing,
    continueErasing,
    stopErasing: baseStopErasing
  } = useEraserState(state, setState, () => {}); // Don't call addToHistory from base erasing

  const startErasing = useCallback((x: number, y: number) => {
    if (!state.isDrawing) {
      // Store the current lines before erasing starts
      linesBeforeErasingRef.current = [...state.lines];
    }
    baseStartErasing(x, y);
  }, [state.lines, state.isDrawing, baseStartErasing]);

  const stopErasing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopErasing();
    
    // Find the lines that were erased
    const erasedLines = linesBeforeErasingRef.current
      .filter(line => !state.lines.some(l => l.id === line.id));
    
    const erasedLineIds = erasedLines.map(line => line.id);
    
    // Calculate activity metadata for erased objects
    let activityMetadata: ActivityMetadata | undefined;
    
    if (erasedLines.length > 0) {
      const bounds = calculateCombinedLineBounds(erasedLines);
      
      if (bounds.width > 0 && bounds.height > 0) {
        activityMetadata = {
          type: 'erase',
          bounds,
          timestamp: Date.now()
        };
        
        console.log(`[DrawingOperations] Created activity metadata for erase:`, activityMetadata);
      }
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
    if (sendOperation && !isApplyingRemoteOperation.current && erasedLineIds.length > 0) {
      // Create the operation
      const operation = serializeEraseOperation(erasedLineIds);
      console.log(`[DrawingOperations] Sending erase operation with ${erasedLineIds.length} lines:`, operation);
      
      // Send it to the database/sync system
      sendOperation(operation);
    }
    
    // Clear the reference
    linesBeforeErasingRef.current = [];
  }, [state.isDrawing, state.lines, state.images, state.selectionState, baseStopErasing, sendOperation, isApplyingRemoteOperation, addToHistory]);

  return {
    startErasing,
    continueErasing,
    stopErasing
  };
};
