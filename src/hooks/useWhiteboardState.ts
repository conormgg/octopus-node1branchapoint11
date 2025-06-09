
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WhiteboardState, Tool, PanZoomState, ImageObject } from '@/types/whiteboard';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { useSelectionState } from './useSelectionState';
import { usePanZoom } from './usePanZoom';
import Konva from 'konva';

export const useWhiteboardState = () => {
  const [state, setState] = useState<WhiteboardState>({
    lines: [],
    images: [],
    currentTool: 'pencil',
    currentColor: '#000000',
    currentStrokeWidth: 5,
    isDrawing: false,
    panZoomState: { x: 0, y: 0, scale: 1 },
    history: [{ lines: [], images: [] }],
    historyIndex: 0,
    selectionState: {
      selectedIds: [],
      isTransforming: false,
      selectionRect: null
    }
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
    addToHistory: baseAddToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistoryState(state, setState);

  const addToHistory = useCallback(() => {
    baseAddToHistory({ lines: state.lines, images: state.images });
  }, [baseAddToHistory, state.lines, state.images]);

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

  // Handle paste functionality
  const handlePaste = useCallback((e: ClipboardEvent, stage: Konva.Stage | null) => {
    console.log('Paste event triggered in whiteboard state');
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items || !stage) {
      console.log('No clipboard items or stage available');
      return;
    }

    console.log('Processing clipboard items:', items.length);
    for (let i = 0; i < items.length; i++) {
      console.log('Item type:', items[i].type);
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) {
          console.log('Could not get file from clipboard item');
          continue;
        }

        console.log('Processing image file:', file.name, file.type);
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          const image = new window.Image();
          image.src = imageUrl;
          image.onload = () => {
            console.log('Image loaded, creating image object');
            const pointerPosition = stage.getPointerPosition() ?? { x: stage.width() / 2, y: stage.height() / 2 };
            const position = {
              x: (pointerPosition.x - state.panZoomState.x) / state.panZoomState.scale,
              y: (pointerPosition.y - state.panZoomState.y) / state.panZoomState.scale,
            };

            const newImage: ImageObject = {
              id: `image_${uuidv4()}`,
              src: imageUrl,
              x: position.x - (image.width / 4),
              y: position.y - (image.height / 4),
              width: image.width / 2,
              height: image.height / 2,
            };
            
            setState(prev => ({
              ...prev,
              images: [...prev.images, newImage]
            }));
            
            // Add to history after state update
            setTimeout(() => addToHistory(), 0);
            console.log('Image added to whiteboard');
          };
        };
        reader.readAsDataURL(file);
      }
    }
  }, [state.panZoomState, addToHistory]);

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

  // Selection operations
  const {
    selectObject,
    addToSelection,
    removeFromSelection,
    clearSelection,
    selectAll,
    startSelectionRect,
    updateSelectionRect,
    completeSelectionRect,
    setTransforming,
    applyTransformation
  } = useSelectionState(state, setState, addToHistory);

  // Handle pointer down
  const handlePointerDown = useCallback((x: number, y: number) => {
    // Don't start drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      startErasing(x, y);
    } else if (state.currentTool === 'select') {
      // Clear selection if not clicking on a selected object
      // This will be handled by the KonvaStage component's checkDeselect function
      // Start selection rectangle
      startSelectionRect(x, y);
    }
  }, [state.currentTool, startDrawing, startErasing, startSelectionRect, panZoom]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't continue drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      continueErasing(x, y);
    } else if (state.currentTool === 'select' && state.selectionState.selectionRect) {
      // Update selection rectangle
      updateSelectionRect(x, y);
    }
  }, [state.currentTool, state.selectionState.selectionRect, continueDrawing, continueErasing, updateSelectionRect, panZoom]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (state.currentTool === 'pencil') {
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      stopErasing();
    } else if (state.currentTool === 'select' && state.selectionState.selectionRect) {
      // Complete selection rectangle and select objects within it
      completeSelectionRect();
    }
  }, [state.currentTool, state.selectionState.selectionRect, stopDrawing, stopErasing, completeSelectionRect]);

  return {
    state,
    setTool,
    setColor,
    setStrokeWidth,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePaste,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    panZoom,
    // Selection methods
    selectObject,
    addToSelection,
    removeFromSelection,
    clearSelection,
    selectAll,
    setTransforming,
    applyTransformation
  };
};
