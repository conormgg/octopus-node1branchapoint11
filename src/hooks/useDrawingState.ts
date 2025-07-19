
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

  console.log('[DrawingState] Initializing drawing state:', {
    hasState: !!state,
    hasSetState: !!setState,
    hasAddToHistory: !!addToHistory,
    currentTool: state?.currentTool,
    currentColor: state?.currentColor,
    currentStrokeWidth: state?.currentStrokeWidth,
    linesCount: state?.lines?.length || 0,
    isDrawing: state?.isDrawing
  });

  const startDrawing = useCallback((x: number, y: number) => {
    if (!state || !setState) {
      console.log('[DrawingState] ERROR: Missing state or setState in startDrawing');
      return;
    }
    
    if (state.currentTool !== 'pencil' && state.currentTool !== 'highlighter') {
      console.log('[DrawingState] ERROR: Invalid tool for drawing:', state.currentTool);
      return;
    }

    console.log('[DrawingState] STARTING DRAWING:', {
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
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    };

    console.log('[DrawingState] Creating new line:', newLine);

    setState(prev => {
      console.log('[DrawingState] Previous state lines count:', prev.lines?.length || 0);
      const newState = {
        ...prev,
        lines: [...(prev.lines || []), newLine],
        isDrawing: true
      };
      console.log('[DrawingState] New state lines count:', newState.lines.length);
      return newState;
    });

    console.log('[DrawingState] Drawing stroke started with ID:', newLine.id);
  }, [state?.currentTool, state?.currentColor, state?.currentStrokeWidth, state, setState]);

  const continueDrawing = useCallback((x: number, y: number) => {
    if (!state || !setState) {
      console.log('[DrawingState] ERROR: Missing state or setState in continueDrawing');
      return;
    }
    
    if (!state.isDrawing || (state.currentTool !== 'pencil' && state.currentTool !== 'highlighter')) {
      console.log('[DrawingState] WARNING: Continue drawing called but not drawing or wrong tool:', {
        isDrawing: state.isDrawing,
        currentTool: state.currentTool
      });
      return;
    }

    console.log('[DrawingState] CONTINUING DRAWING at:', { x, y });

    setState(prev => {
      if (!prev.lines || prev.lines.length === 0) {
        console.log('[DrawingState] ERROR: No lines to continue drawing');
        return prev;
      }
      
      const lastLine = prev.lines[prev.lines.length - 1];
      const newPoints = [...lastLine.points, x, y];
      const updatedLines = [...prev.lines];
      updatedLines[updatedLines.length - 1] = {
        ...lastLine,
        points: newPoints
      };

      console.log('[DrawingState] Added point to line, total points now:', newPoints.length);

      return {
        ...prev,
        lines: updatedLines
      };
    });
  }, [state?.isDrawing, state?.currentTool, state, setState]);

  const stopDrawing = useCallback(() => {
    if (!state || !setState) {
      console.log('[DrawingState] ERROR: Missing state or setState in stopDrawing');
      return;
    }
    
    if (!state.isDrawing) {
      console.log('[DrawingState] WARNING: Stop drawing called but not currently drawing');
      return;
    }

    console.log('[DrawingState] STOPPING DRAWING');

    setState(prev => ({
      ...prev,
      isDrawing: false
    }));

    // Add to history after drawing is complete
    if (addToHistory) {
      setTimeout(() => {
        addToHistory();
        console.log('[DrawingState] Drawing stroke finalized and saved to history');
      }, 0);
    } else {
      console.log('[DrawingState] WARNING: No addToHistory function provided');
    }
  }, [state?.isDrawing, state, setState, addToHistory]);

  console.log('[DrawingState] Drawing methods created:', {
    hasStartDrawing: !!startDrawing,
    hasContinueDrawing: !!continueDrawing,
    hasStopDrawing: !!stopDrawing
  });

  return {
    startDrawing,
    continueDrawing,
    stopDrawing
  };
};
