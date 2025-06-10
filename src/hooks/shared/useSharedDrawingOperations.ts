
import { useCallback, useRef } from 'react';
import { LineObject } from '@/types/whiteboard';
import { useDrawingState } from '../useDrawingState';
import { useEraserState } from '../useEraserState';
import { serializeDrawOperation, serializeEraseOperation, serializeUpdateLineOperation, serializeDeleteObjectsOperation } from '@/utils/operationSerializer';

// Debug flag for line movement - set to true to see line movement logs
const DEBUG_LINE_MOVEMENT = false;

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

    // Always send the operation to the database for persistence
    // But only sync to other clients if we're on the teacher's main board
    if (sendOperation && !isApplyingRemoteOperation.current) {
      const drawnLine = state.lines[state.lines.length - 1];
      if (drawnLine && drawnLine.tool === 'pencil') {
        // Create the operation
        const operation = serializeDrawOperation(drawnLine);
        
        // Send it to the database/sync system
        sendOperation(operation);
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
    
    // Find the IDs of lines that were erased
    const erasedLineIds = linesBeforeErasingRef.current
      .filter(line => !state.lines.some(l => l.id === line.id))
      .map(line => line.id);
    
    // Always send the operation to the database for persistence
    // But only sync to other clients if we're on the teacher's main board
    if (sendOperation && !isApplyingRemoteOperation.current && erasedLineIds.length > 0) {
      // Create the operation
      const operation = serializeEraseOperation(erasedLineIds);
      
      // Send it to the database/sync system
      sendOperation(operation);
    }
    
    // Clear the reference
    linesBeforeErasingRef.current = [];
  }, [state.isDrawing, state.lines, baseStopErasing, sendOperation, isApplyingRemoteOperation]);

  // Update line position/transformation
  const updateLine = useCallback((lineId: string, updates: Partial<LineObject>) => {
    if (DEBUG_LINE_MOVEMENT) {
      console.log(`[Line Movement] Updating line ${lineId}:`, updates);
    }
    
    setState((prev: any) => ({
      ...prev,
      lines: prev.lines.map((line: LineObject) =>
        line.id === lineId ? { ...line, ...updates } : line
      )
    }));
    
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
    
    // Add to history after state update
    setTimeout(() => addToHistory(), 0);
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

    setState((prev: any) => ({
      ...prev,
      lines: prev.lines.filter((line: LineObject) => !selectedLineIds.includes(line.id)),
      images: prev.images.filter((image: any) => !selectedImageIds.includes(image.id))
    }));

    // Add to history
    addToHistory();

    // Always send the operation to the database for persistence
    // But only sync to other clients if we're on the teacher's main board
    if (sendOperation && !isApplyingRemoteOperation.current) {
      console.log(`[DeleteObjects] Sending delete operation to sync`);
      // Create the operation
      const operation = serializeDeleteObjectsOperation(selectedLineIds, selectedImageIds);
      
      // Send it to the database/sync system
      sendOperation(operation);
    } else {
      console.log(`[DeleteObjects] Not sending operation - sendOperation: ${!!sendOperation}, isApplyingRemoteOperation: ${isApplyingRemoteOperation.current}`);
    }
  }, [setState, addToHistory, sendOperation, isApplyingRemoteOperation]);

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
