
/**
 * @fileoverview Drawing operations state management
 * @description Handles pencil and highlighter drawing operations with immediate state management.
 */

import { useCallback, useRef } from 'react';
import { LineObject, Tool } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('drawing');

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
  const lineIdRef = useRef(0);

  const startDrawing = useCallback((x: number, y: number) => {
    if (state.currentTool !== 'pencil' && state.currentTool !== 'highlighter') {
      debugLog('Start', 'Invalid tool for drawing', state.currentTool);
      return;
    }

    debugLog('Start', 'Starting drawing stroke', {
      tool: state.currentTool,
      position: { x, y },
      color: state.currentColor,
      strokeWidth: state.currentStrokeWidth
    });

    const newLine: LineObject = {
      id: `line_${Date.now()}_${lineIdRef.current++}`,
      tool: state.currentTool,
      points: [x, y],
      color: state.currentColor,
      strokeWidth: state.currentStrokeWidth,
      x: 0,
      y: 0
    };

    setState(prev => ({
      ...prev,
      lines: [...prev.lines, newLine],
      isDrawing: true
    }));

    debugLog('Start', 'Drawing stroke started', { lineId: newLine.id });
  }, [state.currentTool, state.currentColor, state.currentStrokeWidth, setState]);

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

    // Add to history immediately (no timeout)
    if (addToHistory) {
      addToHistory();
      debugLog('Stop', 'Drawing stroke finalized and saved to history');
    }
  }, [state.isDrawing, setState, addToHistory]);

  return {
    startDrawing,
    continueDrawing,
    stopDrawing
  };
};
