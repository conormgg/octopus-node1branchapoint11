
import { useCallback, useRef } from 'react';
import { LineObject } from '@/types/whiteboard';
import { useDrawingState } from '../useDrawingState';
import { useEraserState } from '../useEraserState';
import { serializeDrawOperation, serializeEraseOperation } from '@/utils/operationSerializer';

export const useSharedDrawingOperations = (
  state: any,
  setState: any,
  addToHistory: () => void,
  sendOperation: any,
  isApplyingRemoteOperation: React.MutableRefObject<boolean>
) => {
  // Track lines before erasing to detect what was erased
  const linesBeforeErasingRef = useRef<LineObject[]>([]);

  // Drawing operations with sync
  const {
    startDrawing,
    continueDrawing,
    stopDrawing: baseStopDrawing
  } = useDrawingState(state, setState, addToHistory);

  const stopDrawing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopDrawing();

    // Sync the drawn line if we're not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current) {
      const drawnLine = state.lines[state.lines.length - 1];
      if (drawnLine && drawnLine.tool === 'pencil') {
        sendOperation(serializeDrawOperation(drawnLine));
      }
    }
  }, [state.isDrawing, state.lines, baseStopDrawing, sendOperation, isApplyingRemoteOperation]);

  // Eraser operations with sync
  const {
    startErasing: baseStartErasing,
    continueErasing,
    stopErasing: baseStopErasing
  } = useEraserState(state, setState, addToHistory);

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
    
    // Sync the erased lines if we're not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current) {
      // Find the IDs of lines that were erased by comparing with the lines before erasing
      const erasedLineIds = linesBeforeErasingRef.current
        .filter(line => !state.lines.some(l => l.id === line.id))
        .map(line => line.id);
      
      console.log('Lines before erasing:', linesBeforeErasingRef.current.length);
      console.log('Lines after erasing:', state.lines.length);
      console.log('Erased line IDs:', erasedLineIds);
      
      if (erasedLineIds.length > 0) {
        sendOperation(serializeEraseOperation(erasedLineIds));
      }
    }
    
    // Clear the reference
    linesBeforeErasingRef.current = [];
  }, [state.isDrawing, state.lines, baseStopErasing, sendOperation, isApplyingRemoteOperation]);

  return {
    startDrawing,
    continueDrawing,
    stopDrawing,
    startErasing,
    continueErasing,
    stopErasing
  };
};
