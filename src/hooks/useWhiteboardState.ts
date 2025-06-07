
import { useState, useCallback } from 'react';
import { WhiteboardState, Tool, PanZoomState } from '@/types/whiteboard';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { usePanZoom } from './usePanZoom';

export const useWhiteboardState = () => {
  const [state, setState] = useState<WhiteboardState>({
    lines: [],
    currentTool: 'pencil',
    currentColor: '#000000',
    currentStrokeWidth: 5,
    isDrawing: false,
    panZoomState: { x: 0, y: 0, scale: 1 },
    history: [[]],
    historyIndex: 0
  });

  // Pan/zoom state management
  const setPanZoomState = useCallback((panZoomState: PanZoomState) => {
    setState(prev => ({
      ...prev,
      panZoomState
    }));
  }, []);

  // Pan/zoom operations
  const panZoom = usePanZoom(state.panZoomState, setPanZoomState);

  // History operations
  const {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistoryState(state, setState);

  // Drawing operations (pencil only)
  const {
    startDrawing,
    continueDrawing,
    stopDrawing
  } = useDrawingState(state, setState, addToHistory);

  // Eraser operations
  const {
    startErasing,
    continueErasing,
    stopErasing
  } = useEraserState(state, setState, addToHistory);

  // Tool change
  const setTool = useCallback((tool: Tool) => {
    setState(prev => ({
      ...prev,
      currentTool: tool
    }));
  }, []);

  // Color change
  const setColor = useCallback((color: string) => {
    setState(prev => ({
      ...prev,
      currentColor: color
    }));
  }, []);

  // Stroke width change
  const setStrokeWidth = useCallback((width: number) => {
    setState(prev => ({
      ...prev,
      currentStrokeWidth: width
    }));
  }, []);

  // Handle pointer down
  const handlePointerDown = useCallback((x: number, y: number) => {
    // Don't start drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      startErasing(x, y);
    }
  }, [state.currentTool, startDrawing, startErasing, panZoom]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't continue drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      continueErasing(x, y);
    }
  }, [state.currentTool, continueDrawing, continueErasing, panZoom]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (state.currentTool === 'pencil') {
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      stopErasing();
    }
  }, [state.currentTool, stopDrawing, stopErasing]);

  return {
    state,
    setTool,
    setColor,
    setStrokeWidth,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    undo,
    redo,
    canUndo,
    canRedo,
    panZoom
  };
};
