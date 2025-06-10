
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WhiteboardState, Tool, PanZoomState, ImageObject } from '@/types/whiteboard';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { usePanZoom } from './usePanZoom';
import { useSelectionState } from './useSelectionState';
import Konva from 'konva';

export const useWhiteboardState = () => {
  // Selection operations - initialize first so we can use its state
  const selection = useSelectionState();

  const [state, setState] = useState<WhiteboardState>({
    lines: [],
    images: [],
    currentTool: 'pencil',
    currentColor: '#000000',
    currentStrokeWidth: 5,
    isDrawing: false,
    panZoomState: { x: 0, y: 0, scale: 1 },
    selectionState: selection.selectionState,
    history: [{
      lines: [],
      images: [],
      selectionState: {
        selectedObjects: [],
        selectionBounds: null,
        isSelecting: false,
        transformationData: {}
      }
    }],
    historyIndex: 0
  });

  // Update state when selection state changes (but not from history operations)
  useEffect(() => {
    setState(prev => {
      // Only update if the selection state is actually different
      if (JSON.stringify(prev.selectionState) !== JSON.stringify(selection.selectionState)) {
        return {
          ...prev,
          selectionState: selection.selectionState
        };
      }
      return prev;
    });
  }, [selection.selectionState]);

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
  } = useHistoryState(state, setState, selection.updateSelectionState);

  const addToHistory = useCallback(() => {
    baseAddToHistory({
      lines: state.lines,
      images: state.images,
      selectionState: state.selectionState
    });
  }, [baseAddToHistory, state.lines, state.images, state.selectionState]);

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

  // Update line position
  const updateLine = useCallback((lineId: string, updates: Partial<typeof state.lines[0]>) => {
    setState(prev => ({
      ...prev,
      lines: prev.lines.map(line => 
        line.id === lineId ? { ...line, ...updates } : line
      )
    }));
    // Add to history after state update
    setTimeout(() => addToHistory(), 0);
  }, [addToHistory]);

  // Update image position/attributes
  const updateImage = useCallback((imageId: string, updates: Partial<ImageObject>) => {
    setState(prev => ({
      ...prev,
      images: prev.images.map(image => 
        image.id === imageId ? { ...image, ...updates } : image
      )
    }));
    // Add to history after state update
    setTimeout(() => addToHistory(), 0);
  }, [addToHistory]);

  // Handle pointer down
  const handlePointerDown = useCallback((x: number, y: number) => {
    // Don't start drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      startErasing(x, y);
    } else if (state.currentTool === 'select') {
      // Handle selection logic with priority:
      // 1. Check if clicking within existing selection bounds (for group dragging)
      // 2. Check if clicking on individual objects
      // 3. Start new selection or clear existing selection
      
      const isInSelectionBounds = selection.isPointInSelectionBounds({ x, y });
      
      if (isInSelectionBounds && selection.selectionState.selectedObjects.length > 0) {
        // Clicking within selection bounds - this will allow dragging the entire group
        // The actual dragging logic will be handled by the SelectionGroup component
        // We don't need to change the selection here, just maintain it
        return;
      }
      
      // Check for individual objects
      const foundObjects = selection.findObjectsAtPoint({ x, y }, state.lines, state.images);
      
      if (foundObjects.length > 0) {
        // Select the first found object
        selection.selectObjects([foundObjects[0]]);
        // Update selection bounds for the selected object
        setTimeout(() => {
          selection.updateSelectionBounds([foundObjects[0]], state.lines, state.images);
        }, 0);
      } else {
        // Clear selection when clicking on empty space
        selection.clearSelection();
        // Start drag-to-select
        selection.setIsSelecting(true);
        selection.setSelectionBounds({ x, y, width: 0, height: 0 });
      }
    }
  }, [state.currentTool, state.lines, state.images, startDrawing, startErasing, panZoom, selection]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't continue drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      continueErasing(x, y);
    } else if (state.currentTool === 'select' && selection.selectionState.isSelecting) {
      // Update drag-to-select rectangle
      const bounds = selection.selectionState.selectionBounds;
      if (bounds) {
        const newBounds = {
          x: Math.min(bounds.x, x),
          y: Math.min(bounds.y, y),
          width: Math.abs(x - bounds.x),
          height: Math.abs(y - bounds.y)
        };
        selection.setSelectionBounds(newBounds);
      }
    }
  }, [state.currentTool, continueDrawing, continueErasing, panZoom, selection]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (state.currentTool === 'pencil') {
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      stopErasing();
    } else if (state.currentTool === 'select' && selection.selectionState.isSelecting) {
      // Complete drag-to-select
      const bounds = selection.selectionState.selectionBounds;
      if (bounds && (bounds.width > 5 || bounds.height > 5)) {
        // Find objects within selection bounds
        const objectsInBounds = selection.findObjectsInBounds(bounds, state.lines, state.images);
        selection.selectObjects(objectsInBounds);
        // Update selection bounds for the selected objects
        setTimeout(() => {
          selection.updateSelectionBounds(objectsInBounds, state.lines, state.images);
        }, 0);
      }
      
      // End selection
      selection.setIsSelecting(false);
      selection.setSelectionBounds(null);
    }
  }, [state.currentTool, state.lines, state.images, stopDrawing, stopErasing, selection]);

  // Toggle image lock state
  const toggleImageLock = useCallback((imageId: string) => {
    setState(prev => ({
      ...prev,
      images: prev.images.map(img =>
        img.id === imageId ? { ...img, locked: !img.locked } : img
      )
    }));

    // Add to history after state update
    setTimeout(() => addToHistory(), 0);
  }, [addToHistory]);

  // Delete selected objects
  const deleteSelectedObjects = useCallback(() => {
    const selectedObjects = selection.selectionState.selectedObjects;
    if (!selectedObjects || selectedObjects.length === 0) return;

    setState(prev => {
      const selectedLineIds = selectedObjects
        .filter(obj => obj.type === 'line')
        .map(obj => obj.id);
      const selectedImageIds = selectedObjects
        .filter(obj => obj.type === 'image')
        .map(obj => obj.id);

      return {
        ...prev,
        lines: prev.lines.filter(line => !selectedLineIds.includes(line.id)),
        images: prev.images.filter(image => !selectedImageIds.includes(image.id))
      };
    });

    // Clear selection after deletion
    selection.clearSelection();
    
    // Add to history
    addToHistory();
  }, [selection.selectionState.selectedObjects, selection, addToHistory]);

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
    selection,
    updateLine,
    updateImage,
    toggleImageLock,
    deleteSelectedObjects
  };
};
