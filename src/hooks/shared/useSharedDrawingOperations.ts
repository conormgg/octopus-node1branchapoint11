
import { useCallback, useRef } from 'react';
import { LineObject, ActivityMetadata } from '@/types/whiteboard';
import { useDrawingState } from '../useDrawingState';
import { useEraserState } from '../useEraserState';
import { serializeDrawOperation, serializeEraseOperation, serializeUpdateLineOperation, serializeDeleteObjectsOperation } from '@/utils/operationSerializer';

// Debug flag for line movement - set to true to see line movement logs
const DEBUG_LINE_MOVEMENT = false;

// Helper function to calculate bounds from line points
const calculateLineBounds = (line: LineObject) => {
  if (!line.points || line.points.length < 2) {
    return { x: line.x || 0, y: line.y || 0, width: 1, height: 1 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Process points in pairs (x, y)
  for (let i = 0; i < line.points.length; i += 2) {
    const localX = line.points[i];
    const localY = line.points[i + 1];
    
    // Apply transformations if they exist
    const scaleX = line.scaleX || 1;
    const scaleY = line.scaleY || 1;
    const rotation = line.rotation || 0;
    
    // Apply scale
    let transformedX = localX * scaleX;
    let transformedY = localY * scaleY;
    
    // Apply rotation if present
    if (rotation !== 0) {
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      
      const rotatedX = transformedX * cos - transformedY * sin;
      const rotatedY = transformedX * sin + transformedY * cos;
      
      transformedX = rotatedX;
      transformedY = rotatedY;
    }
    
    // Apply translation
    const finalX = transformedX + (line.x || 0);
    const finalY = transformedY + (line.y || 0);
    
    minX = Math.min(minX, finalX);
    minY = Math.min(minY, finalY);
    maxX = Math.max(maxX, finalX);
    maxY = Math.max(maxY, finalY);
  }

  // Add some padding based on stroke width
  const padding = (line.strokeWidth || 1) / 2;
  
  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2)
  };
};

export const useSharedDrawingOperations = (
  state: any,
  setState: any,
  addToHistory: (snapshot?: any, activityMetadata?: ActivityMetadata) => void,
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
        // Create the operation
        const operation = serializeDrawOperation(drawnLine);
        
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
  }, [state.isDrawing, state.lines, state.images, state.selectionState, state.currentTool, baseStopDrawing, sendOperation, isApplyingRemoteOperation, addToHistory]);

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
      // Calculate combined bounds of all erased lines
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      erasedLines.forEach(line => {
        const bounds = calculateLineBounds(line);
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
      });
      
      if (minX !== Infinity && minY !== Infinity) {
        activityMetadata = {
          type: 'erase',
          bounds: {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
          },
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
    setTimeout(() => {
      addToHistory({
        lines: state.lines,
        images: state.images,
        selectionState: state.selectionState
      });
    }, 0);
  }, [setState, state.lines, state.images, state.selectionState, addToHistory, sendOperation, isApplyingRemoteOperation]);

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
      // Create the operation
      const operation = serializeDeleteObjectsOperation(selectedLineIds, selectedImageIds);
      console.log(`[DeleteObjects] Delete operation:`, operation);
      
      // Send it to the database/sync system
      sendOperation(operation);
    } else {
      console.log(`[DeleteObjects] Not sending operation - sendOperation: ${!!sendOperation}, isApplyingRemoteOperation: ${isApplyingRemoteOperation.current}`);
    }
  }, [setState, state.lines, state.images, state.selectionState, addToHistory, sendOperation, isApplyingRemoteOperation]);

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
