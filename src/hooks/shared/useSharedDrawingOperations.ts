
import { useCallback, useRef } from 'react';
import { LineObject } from '@/types/whiteboard';
import { useDrawingState } from '../useDrawingState';
import { useEraserState } from '../useEraserState';
import { serializeDrawOperation, serializeEraseOperation, serializeUpdateLineOperation, serializeDeleteObjectsOperation } from '@/utils/operationSerializer';

export const useSharedDrawingOperations = (
  state: any,
  setState: any,
  addToHistory: () => void,
  sendOperation: any,
  isApplyingRemoteOperation: React.MutableRefObject<boolean>,
  whiteboardId?: string
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

    // Sync the drawn line ONLY if we're on the teacher's main board
    // and not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current && whiteboardId && whiteboardId.includes('-main')) {
      const drawnLine = state.lines[state.lines.length - 1];
      if (drawnLine && drawnLine.tool === 'pencil') {
        console.log(`[${whiteboardId}] Syncing drawn line to other clients:`, drawnLine.id);
        sendOperation(serializeDrawOperation(drawnLine));
      }
    } else {
      console.log(`[${whiteboardId}] Not syncing drawn line - whiteboard ID: ${whiteboardId}, has sendOperation: ${!!sendOperation}`);
    }
  }, [state.isDrawing, state.lines, baseStopDrawing, sendOperation, isApplyingRemoteOperation, whiteboardId]);

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
    
    // Sync the erased lines ONLY if we're on the teacher's main board
    // and not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current && whiteboardId && whiteboardId.includes('-main')) {
      // Find the IDs of lines that were erased by comparing with the lines before erasing
      const erasedLineIds = linesBeforeErasingRef.current
        .filter(line => !state.lines.some(l => l.id === line.id))
        .map(line => line.id);
      
      console.log(`[${whiteboardId}] Lines before erasing:`, linesBeforeErasingRef.current.length);
      console.log(`[${whiteboardId}] Lines after erasing:`, state.lines.length);
      console.log(`[${whiteboardId}] Erased line IDs:`, erasedLineIds);
      
      if (erasedLineIds.length > 0) {
        console.log(`[${whiteboardId}] Syncing erased lines to other clients:`, erasedLineIds);
        sendOperation(serializeEraseOperation(erasedLineIds));
      }
    } else {
      console.log(`[${whiteboardId}] Not syncing erased lines - whiteboard ID: ${whiteboardId}, has sendOperation: ${!!sendOperation}`);
    }
    
    // Clear the reference
    linesBeforeErasingRef.current = [];
  }, [state.isDrawing, state.lines, baseStopErasing, sendOperation, isApplyingRemoteOperation, whiteboardId]);

  // Update line position/transformation
  const updateLine = useCallback((lineId: string, updates: Partial<LineObject>) => {
    setState((prev: any) => ({
      ...prev,
      lines: prev.lines.map((line: LineObject) =>
        line.id === lineId ? { ...line, ...updates } : line
      )
    }));
    
    // Sync line transformation ONLY if we're on the teacher's main board
    // and not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current && whiteboardId && whiteboardId.includes('-main')) {
      sendOperation(serializeUpdateLineOperation(lineId, updates));
    }
    
    // Add to history after state update
    setTimeout(() => addToHistory(), 0);
  }, [setState, addToHistory, sendOperation, isApplyingRemoteOperation, whiteboardId]);

  // Delete selected objects
  const deleteSelectedObjects = useCallback((selectedObjects: Array<{ id: string; type: 'line' | 'image' }>) => {
    if (!selectedObjects || selectedObjects.length === 0) return;

    const selectedLineIds = selectedObjects
      .filter(obj => obj.type === 'line')
      .map(obj => obj.id);
    const selectedImageIds = selectedObjects
      .filter(obj => obj.type === 'image')
      .map(obj => obj.id);

    setState((prev: any) => ({
      ...prev,
      lines: prev.lines.filter((line: LineObject) => !selectedLineIds.includes(line.id)),
      images: prev.images.filter((image: any) => !selectedImageIds.includes(image.id))
    }));

    // Add to history
    addToHistory();

    // Sync deletion
    if (sendOperation && !isApplyingRemoteOperation.current && whiteboardId && whiteboardId.includes('-main')) {
      console.log(`[${whiteboardId}] Syncing object deletion - lines:`, selectedLineIds, 'images:', selectedImageIds);
      sendOperation(serializeDeleteObjectsOperation(selectedLineIds, selectedImageIds));
    }
  }, [setState, addToHistory, sendOperation, isApplyingRemoteOperation, whiteboardId]);

  return {
    startDrawing,
    continueDrawing,
    stopDrawing,
    startErasing,
    continueErasing,
    stopErasing,
    updateLine,
    deleteSelectedObjects
  };
};
