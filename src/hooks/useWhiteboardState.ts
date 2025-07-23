import { useState, useCallback, useEffect } from 'react';
import { WhiteboardState, PanZoomState, LineObject } from '@/types/whiteboard';
import { useHistoryState } from './useHistoryState';
import { usePanZoom } from './usePanZoom';
// import { useSelectionState } from './useSelectionState'; // Removed - now using select2 system
import { useWhiteboardToolManagement } from './useWhiteboardToolManagement';
import { useWhiteboardDrawingCoordination } from './useWhiteboardDrawingCoordination';
import { useWhiteboardImageOperations } from './useWhiteboardImageOperations';
import { useWhiteboardPointerHandlers } from './useWhiteboardPointerHandlers';
import { useNormalizedWhiteboardState } from './performance/useNormalizedWhiteboardState';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const USE_NORMALIZED_STATE = true; // Feature flag for gradual rollout
const debugLog = createDebugLogger('state');

/**
 * @hook useWhiteboardState
 * @description Main hook for managing whiteboard state and operations
 */
export const useWhiteboardState = () => {
  debugLog('Hook', 'Initializing useWhiteboardState');

  // Tool management
  const toolManagement = useWhiteboardToolManagement();

  // Note: Selection now handled by select2 system integrated in stage event handlers

  const [state, setState] = useState<WhiteboardState>({
    lines: [],
    images: [],
    currentTool: toolManagement.currentTool,
    currentColor: toolManagement.currentColor,
    currentStrokeWidth: toolManagement.currentStrokeWidth,
    pencilSettings: toolManagement.pencilSettings,
    highlighterSettings: toolManagement.highlighterSettings,
    isDrawing: false,
    panZoomState: { x: 0, y: 0, scale: 1 },
    selectionState: { // Default empty selection state
      selectedObjects: [],
      selectionBounds: null,
      isSelecting: false,
      transformationData: {}
    },
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

  // Normalized state for performance optimization
  const normalizedState = useNormalizedWhiteboardState(state.lines, state.images);

  debugLog('Performance', 'Normalized state stats', {
    lineCount: normalizedState.lineCount,
    imageCount: normalizedState.imageCount,
    totalObjects: normalizedState.totalObjectCount
  });

  // Update state when tool management changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      currentTool: toolManagement.currentTool,
      currentColor: toolManagement.currentColor,
      currentStrokeWidth: toolManagement.currentStrokeWidth,
      pencilSettings: toolManagement.pencilSettings,
      highlighterSettings: toolManagement.highlighterSettings
    }));
  }, [
    toolManagement.currentTool,
    toolManagement.currentColor,
    toolManagement.currentStrokeWidth,
    toolManagement.pencilSettings,
    toolManagement.highlighterSettings
  ]);

  // Note: Selection state now managed by select2 system

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
  } = useHistoryState(state, setState, () => {}); // Empty function since selection handled by select2

  const addToHistory = useCallback(() => {
    baseAddToHistory({
      lines: state.lines,
      images: state.images,
      selectionState: state.selectionState
    });
  }, [baseAddToHistory, state.lines, state.images, state.selectionState]);

  // Drawing coordination
  const drawingCoordination = useWhiteboardDrawingCoordination(state, setState, addToHistory);

  // Image operations
  const imageOperations = useWhiteboardImageOperations(state, setState, addToHistory);

  // Pointer handlers for drawing tools (selection now handled by select2 system)
  const pointerHandlers = useWhiteboardPointerHandlers(state, panZoom, null, drawingCoordination);

  // Update line position
  const updateLine = useCallback((lineId: string, updates: Partial<LineObject>) => {
    setState(prev => ({
      ...prev,
      lines: prev.lines.map(line => 
        line.id === lineId ? { ...line, ...updates } : line
      )
    }));
    // Add to history after state update
    setTimeout(() => addToHistory(), 0);
  }, [addToHistory]);

  // Generic delete function that can accept optional selected objects
  const deleteSelectedObjects = useCallback((customSelectedObjects?: Array<{id: string, type: 'line' | 'image'}>) => {
    // Must provide selected objects since we no longer have selection state
    if (!customSelectedObjects || customSelectedObjects.length === 0) return;

    setState(prev => {
      const selectedLineIds = customSelectedObjects
        .filter(obj => obj.type === 'line')
        .map(obj => obj.id);
      const selectedImageIds = customSelectedObjects
        .filter(obj => obj.type === 'image')
        .map(obj => obj.id);

      return {
        ...prev,
        lines: prev.lines.filter(line => !selectedLineIds.includes(line.id)),
        images: prev.images.filter(image => !selectedImageIds.includes(image.id))
      };
    });
    
    // Add to history
    addToHistory();
  }, [addToHistory]);

  return {
    state,
    // Expose normalized state for components that can use it
    normalizedState: USE_NORMALIZED_STATE ? normalizedState : undefined,
    setTool: toolManagement.setTool,
    setColor: toolManagement.setColor,
    setPencilColor: toolManagement.setPencilColor,
    setHighlighterColor: toolManagement.setHighlighterColor,
    setStrokeWidth: toolManagement.setStrokeWidth,
    handlePointerDown: pointerHandlers.handlePointerDown,
    handlePointerMove: pointerHandlers.handlePointerMove,
    handlePointerUp: pointerHandlers.handlePointerUp,
    handlePaste: imageOperations.handlePaste,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    panZoom,
    // selection: null, // Now handled by select2 system
    updateLine,
    updateImage: imageOperations.updateImage,
    toggleImageLock: imageOperations.toggleImageLock,
    deleteSelectedObjects
  };
};
