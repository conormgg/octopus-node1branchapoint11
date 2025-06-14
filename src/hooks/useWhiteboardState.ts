import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { WhiteboardState, Tool, PanZoomState, ImageObject } from '@/types/whiteboard';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { usePanZoom } from './usePanZoom';
import { useSelectionState } from './useSelectionState';
import Konva from 'konva';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @function debugLog
 * @description Centralized debug logging for whiteboard operations
 * @param context - The context/component name
 * @param action - The action being performed
 * @param data - Additional data to log
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[WhiteboardState:${context}] ${action}`, data || '');
  }
};

/**
 * @hook useWhiteboardState
 * @description Main hook for managing whiteboard state and operations
 * 
 * @returns {Object} Whiteboard state and operations
 * @returns {WhiteboardState} state - Current whiteboard state
 * @returns {Function} setTool - Change active drawing tool
 * @returns {Function} setColor - Change drawing color (with tool auto-switching)
 * @returns {Function} handlePointerDown - Start drawing/selection operation
 * @returns {Function} handlePointerMove - Continue drawing/selection operation
 * @returns {Function} handlePointerUp - Finish drawing/selection operation
 * @returns {Function} undo - Undo last operation
 * @returns {Function} redo - Redo last undone operation
 * @returns {Object} panZoom - Pan and zoom operations
 * @returns {Object} selection - Selection state and operations
 * 
 * @ai-understanding
 * This hook coordinates multiple sub-hooks:
 * - useDrawingState: Handles pencil/highlighter drawing
 * - useEraserState: Handles eraser operations
 * - useHistoryState: Manages undo/redo functionality
 * - useSelectionState: Manages object selection
 * - usePanZoom: Handles canvas pan and zoom
 */
export const useWhiteboardState = () => {
  debugLog('Hook', 'Initializing useWhiteboardState');

  // Selection operations - initialize first so we can use its state
  const selection = useSelectionState();

  const [state, setState] = useState<WhiteboardState>({
    lines: [],
    images: [],
    currentTool: 'pencil',
    currentColor: '#000000',
    currentStrokeWidth: 5,
    pencilSettings: {
      color: '#000000',
      strokeWidth: 5
    },
    highlighterSettings: {
      color: '#FFFF00',
      strokeWidth: 12
    },
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
        debugLog('Selection', 'Selection state updated', {
          selectedCount: selection.selectionState.selectedObjects?.length || 0,
          isSelecting: selection.selectionState.isSelecting
        });
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
    debugLog('Paste', 'Paste event triggered');
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items || !stage) {
      debugLog('Paste', 'No clipboard items or stage available');
      return;
    }

    debugLog('Paste', 'Processing clipboard items', { count: items.length });
    for (let i = 0; i < items.length; i++) {
      debugLog('Paste', 'Item type', items[i].type);
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) {
          debugLog('Paste', 'Could not get file from clipboard item');
          continue;
        }

        debugLog('Paste', 'Processing image file', { name: file.name, type: file.type });
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          const image = new window.Image();
          image.src = imageUrl;
          image.onload = () => {
            debugLog('Paste', 'Image loaded, creating image object');
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
            debugLog('Paste', 'Image added to whiteboard', { id: newImage.id });
          };
        };
        reader.readAsDataURL(file);
      }
    }
  }, [state.panZoomState, addToHistory]);

  // Tool change with settings sync
  const setTool = useCallback((tool: Tool) => {
    debugLog('Tool', 'Tool change requested', { from: state.currentTool, to: tool });
    setState(prev => {
      let newColor = prev.currentColor;
      let newStrokeWidth = prev.currentStrokeWidth;
      
      // Apply tool-specific settings when switching tools
      if (tool === 'pencil') {
        newColor = prev.pencilSettings.color;
        newStrokeWidth = prev.pencilSettings.strokeWidth;
      } else if (tool === 'highlighter') {
        newColor = prev.highlighterSettings.color;
        newStrokeWidth = prev.highlighterSettings.strokeWidth;
      }
      
      debugLog('Tool', 'Tool changed', { 
        tool, 
        color: newColor, 
        strokeWidth: newStrokeWidth 
      });
      
      return {
        ...prev,
        currentTool: tool,
        currentColor: newColor,
        currentStrokeWidth: newStrokeWidth
      };
    });
  }, [state.currentTool]);

  // Color change with tool-specific storage and auto-switching
  const setColor = useCallback((color: string) => {
    debugLog('Color', 'Color change requested', { from: state.currentColor, to: color });
    setState(prev => {
      const newState = {
        ...prev,
        currentColor: color
      };
      
      // Update the appropriate tool settings and switch to that tool
      if (prev.currentTool === 'pencil' || prev.currentTool === 'highlighter') {
        // Update current tool's settings
        if (prev.currentTool === 'pencil') {
          newState.pencilSettings = { ...prev.pencilSettings, color };
        } else {
          newState.highlighterSettings = { ...prev.highlighterSettings, color };
        }
      } else {
        // If not on a drawing tool, determine which tool this color belongs to
        const pencilColors = ['#000000', '#FF0000', '#0080FF', '#00C851'];
        const highlighterColors = ['#FFFF00', '#FFA500', '#00BFFF', '#32CD32'];
        
        if (pencilColors.includes(color)) {
          newState.currentTool = 'pencil';
          newState.pencilSettings = { ...prev.pencilSettings, color };
          newState.currentStrokeWidth = prev.pencilSettings.strokeWidth;
        } else if (highlighterColors.includes(color)) {
          newState.currentTool = 'highlighter';
          newState.highlighterSettings = { ...prev.highlighterSettings, color };
          newState.currentStrokeWidth = prev.highlighterSettings.strokeWidth;
        }
      }
      
      debugLog('Color', 'Color changed', { color: newState.currentColor });
      
      return newState;
    });
  }, [state.currentColor]);

  // Pencil-specific color change with auto-switching
  const setPencilColor = useCallback((color: string) => {
    debugLog('Color', 'Pencil color change requested', { from: state.pencilSettings.color, to: color });
    setState(prev => ({
      ...prev,
      currentTool: 'pencil',
      currentColor: color,
      currentStrokeWidth: prev.pencilSettings.strokeWidth,
      pencilSettings: { ...prev.pencilSettings, color }
    }));
  }, [state.pencilSettings.color]);

  // Highlighter-specific color change with auto-switching
  const setHighlighterColor = useCallback((color: string) => {
    debugLog('Color', 'Highlighter color change requested', { from: state.highlighterSettings.color, to: color });
    setState(prev => ({
      ...prev,
      currentTool: 'highlighter',
      currentColor: color,
      currentStrokeWidth: prev.highlighterSettings.strokeWidth,
      highlighterSettings: { ...prev.highlighterSettings, color }
    }));
  }, [state.highlighterSettings.color]);

  // Stroke width change with tool-specific storage
  const setStrokeWidth = useCallback((width: number) => {
    debugLog('StrokeWidth', 'Stroke width change requested', { from: state.currentStrokeWidth, to: width });
    setState(prev => {
      const newState = {
        ...prev,
        currentStrokeWidth: width
      };
      
      // Update the appropriate tool settings
      if (prev.currentTool === 'pencil') {
        newState.pencilSettings = { ...prev.pencilSettings, strokeWidth: width };
      } else if (prev.currentTool === 'highlighter') {
        newState.highlighterSettings = { ...prev.highlighterSettings, strokeWidth: width };
      }
      
      debugLog('StrokeWidth', 'Stroke width changed', { width: newState.currentStrokeWidth });
      
      return newState;
    });
  }, [state.currentStrokeWidth]);

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
    debugLog('Pointer', 'Pointer down', { x, y, tool: state.currentTool });
    
    // Don't start drawing if a pan/zoom gesture is active
    if (panZoom.isGestureActive()) {
      debugLog('Pointer', 'Ignoring pointer down - gesture active');
      return;
    }
    
    if (state.currentTool === 'pencil' || state.currentTool === 'highlighter') {
      debugLog('Drawing', 'Starting drawing operation');
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      debugLog('Eraser', 'Starting eraser operation');
      startErasing(x, y);
    } else if (state.currentTool === 'select') {
      // Handle selection logic with priority:
      // 1. Check if clicking within existing selection bounds (for group dragging)
      // 2. Check if clicking on individual objects
      // 3. Start new selection or clear existing selection
      
      const isInSelectionBounds = selection.isPointInSelectionBounds({ x, y });
      
      if (isInSelectionBounds && selection.selectionState.selectedObjects.length > 0) {
        debugLog('Selection', 'Clicked within selection bounds');
        // Clicking within selection bounds - this will allow dragging the entire group
        // The actual dragging logic will be handled by the SelectionGroup component
        // We don't need to change the selection here, just maintain it
        return;
      }
      
      // Check for individual objects
      const foundObjects = selection.findObjectsAtPoint({ x, y }, state.lines, state.images);
      
      if (foundObjects.length > 0) {
        debugLog('Selection', 'Found objects at point', { count: foundObjects.length });
        // Select the first found object
        selection.selectObjects([foundObjects[0]]);
        // Update selection bounds for the selected object
        setTimeout(() => {
          selection.updateSelectionBounds([foundObjects[0]], state.lines, state.images);
        }, 0);
      } else {
        debugLog('Selection', 'Starting drag-to-select');
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
    
    if (state.currentTool === 'pencil' || state.currentTool === 'highlighter') {
      debugLog('Drawing', 'Continuing drawing operation');
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      debugLog('Eraser', 'Continuing eraser operation');
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
    if (state.currentTool === 'pencil' || state.currentTool === 'highlighter') {
      debugLog('Drawing', 'Finishing drawing operation');
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      debugLog('Eraser', 'Finishing eraser operation');
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
    debugLog('Image', 'Toggle image lock', { id: imageId });
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
    setPencilColor,
    setHighlighterColor,
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
