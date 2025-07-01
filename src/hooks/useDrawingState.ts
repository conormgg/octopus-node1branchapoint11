/**
 * @fileoverview Drawing operations state management
 * @description Handles pencil and highlighter drawing operations with proper state management.
 * 
 * @ai-context This hook manages the drawing lifecycle:
 * 1. startDrawing: Creates new LineObject and begins drawing
 * 2. continueDrawing: Adds points to active line
 * 3. stopDrawing: Finalizes line and saves to history
 */

import { useCallback, useRef } from 'react';
import { LineObject, Tool } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';
import { toast } from './use-toast';

import { coordinateBuffer, maybeShowConsolidatedToast } from './coordinateDebugBuffer';

const debugLog = createDebugLogger('drawing');

/**
 * @hook useDrawingState
 * @description Manages drawing operations for pencil and highlighter tools
 * 
 * @param state - Current whiteboard state subset
 * @param setState - State update function
 * @param addToHistory - Function to save state to history (optional, can be no-op)
 * 
 * @returns {Object} Drawing operations
 * @returns {Function} startDrawing - Begin new drawing stroke
 * @returns {Function} continueDrawing - Add point to current stroke
 * @returns {Function} stopDrawing - Finalize current stroke
 * 
 * @ai-understanding
 * Drawing state management:
 * - Uses unique line IDs with timestamp + counter for collision avoidance
 * - Only operates on pencil/highlighter tools
 * - Manages isDrawing flag to prevent overlapping operations
 * - Automatically saves to history when drawing completes (if addToHistory provided)
 */
export const useDrawingState = (
  state: {
    currentTool: Tool;
    currentColor: string;
    currentStrokeWidth: number;
    lines: LineObject[];
    isDrawing: boolean;
  },
  setState: (updater: (prev: any) => any) => void,
  addToHistory: () => void
) => {
  /**
   * @ref lineIdRef
   * @description Counter for generating unique line IDs within the same timestamp
   */
  const lineIdRef = useRef(0);

  /**
   * @function startDrawing
   * @description Initiates a new drawing stroke
   * @param x - Starting X coordinate
   * @param y - Starting Y coordinate
   * 
   * @ai-context Creates a new LineObject with current tool settings and
   * adds it to the lines array. Sets isDrawing flag to true.
   */
  const startDrawing = useCallback((x: number, y: number, coords?: any) => {
    if (state.currentTool !== 'pencil' && state.currentTool !== 'highlighter') {
      debugLog('Start', 'Invalid tool for drawing', state.currentTool);
      return;
    }

    debugLog('Start', 'Starting drawing stroke', {
      tool: state.currentTool,
      position: { x, y },
      color: state.currentColor,
      strokeWidth: state.currentStrokeWidth,
      coords
    });

    // Store in buffer for consolidated toast
    if (!coordinateBuffer.drawA) {
      coordinateBuffer.drawA = coords || { world: { x, y }, screen: { x, y }, viewport: { x, y }, local: { x: 0, y: 0 } };
    } else if (!coordinateBuffer.drawB) {
      coordinateBuffer.drawB = coords || { world: { x, y }, screen: { x, y }, viewport: { x, y }, local: { x: 0, y: 0 } };
    }
    maybeShowConsolidatedToast();

    const newLine: LineObject = {
      id: `line_${Date.now()}_${lineIdRef.current++}`,
      tool: state.currentTool,
      points: [x, y],
      color: state.currentColor,
      strokeWidth: state.currentStrokeWidth,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    };

    setState(prev => ({
      ...prev,
      lines: [...prev.lines, newLine],
      isDrawing: true
    }));

    debugLog('Start', 'Drawing stroke started', { lineId: newLine.id });
  }, [state.currentTool, state.currentColor, state.currentStrokeWidth, setState]);

  /**
   * @function continueDrawing
   * @description Adds a point to the current drawing stroke
   * @param x - New X coordinate
   * @param y - New Y coordinate
   * 
   * @ai-context Appends new coordinates to the last line's points array.
   * Only operates when isDrawing is true and tool is appropriate.
   */
  const continueDrawing = useCallback((x: number, y: number) => {
    if (!state.isDrawing || (state.currentTool !== 'pencil' && state.currentTool !== 'highlighter')) {
      return;
    }

    setState(prev => {
      const lastLine = prev.lines[prev.lines.length - 1];
      const newPoints = [...lastLine.points, x, y];
      const updatedLines = [...prev.lines];
      updatedLines[updatedLines.length - 1] = {
        ...lastLine,
        points: newPoints
      };

      return {
        ...prev,
        lines: updatedLines
      };
    });
  }, [state.isDrawing, state.currentTool, setState]);

  /**
   * @function stopDrawing
   * @description Finalizes the current drawing stroke
   * 
   * @ai-context Sets isDrawing to false and triggers history save if provided.
   * The history save is delayed to ensure state update completes first.
   */
  const stopDrawing = useCallback(() => {
    if (!state.isDrawing) {
      debugLog('Stop', 'No active drawing to stop');
      return;
    }

    debugLog('Stop', 'Stopping drawing stroke');

    setState(prev => ({
      ...prev,
      isDrawing: false
    }));

    // Add to history after drawing is complete (if function provided)
    if (addToHistory) {
      setTimeout(() => {
        addToHistory();
        debugLog('Stop', 'Drawing stroke finalized and saved to history');
      }, 0);
    }
  }, [state.isDrawing, setState, addToHistory]);

  return {
    startDrawing,
    continueDrawing,
    stopDrawing
  };
};
