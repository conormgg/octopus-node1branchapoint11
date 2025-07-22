
import { useState, useCallback, useRef } from 'react';
import { LineObject, ImageObject, SelectedObject, SelectionBounds } from '@/types/whiteboard';
import { useSelectionState } from './useSelectionState';
import { useStageCoordinates } from './useStageCoordinates';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

interface UseUnifiedSelectionProps {
  stageRef: React.RefObject<any>;
  lines: LineObject[];
  images: ImageObject[];
  panZoomState: { x: number; y: number; scale: number };
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const useUnifiedSelection = ({
  stageRef,
  lines,
  images,
  panZoomState,
  containerRef
}: UseUnifiedSelectionProps) => {
  const {
    selectionState,
    selectObjects,
    clearSelection,
    setSelectionBounds,
    setIsSelecting,
    findObjectsAtPoint,
    findObjectsInBounds,
    hoveredObjectId,
    setHoveredObjectId
  } = useSelectionState();

  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  // Drag-to-select state
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingObjects, setIsDraggingObjects] = useState(false);

  // Refs for tracking interaction state
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const lastInteractionTypeRef = useRef<'mouse' | 'touch' | null>(null);

  // Helper function to ensure container has focus for keyboard events
  const ensureContainerFocus = useCallback(() => {
    if (containerRef?.current) {
      containerRef.current.focus();
    }
  }, [containerRef]);

  // Reset all interaction states
  const resetInteractionStates = useCallback(() => {
    debugLog('useUnifiedSelection', 'Resetting interaction states');
    setIsDragging(false);
    setIsDraggingObjects(false);
    setDragStartPoint(null);
    setIsSelecting(false);
    setSelectionBounds(null);
    isDraggingRef.current = false;
    hasMovedRef.current = false;
    lastInteractionTypeRef.current = null;
  }, [setIsSelecting, setSelectionBounds]);

  // Start drag selection
  const startDragSelection = useCallback((point: { x: number; y: number }) => {
    debugLog('useUnifiedSelection', 'Starting drag selection', { point });
    setDragStartPoint(point);
    setIsDragging(true);
    setIsSelecting(true);
    setSelectionBounds({
      x: point.x,
      y: point.y,
      width: 0,
      height: 0
    });
  }, [setIsSelecting, setSelectionBounds]);

  // Update drag selection
  const updateDragSelection = useCallback((point: { x: number; y: number }) => {
    if (!dragStartPoint) return;

    const x = Math.min(dragStartPoint.x, point.x);
    const y = Math.min(dragStartPoint.y, point.y);
    const width = Math.abs(point.x - dragStartPoint.x);
    const height = Math.abs(point.y - dragStartPoint.y);

    setSelectionBounds({ x, y, width, height });
  }, [dragStartPoint, setSelectionBounds]);

  // End drag selection
  const endDragSelection = useCallback(() => {
    if (!selectionState.selectionBounds) {
      resetInteractionStates();
      return;
    }

    const objectsInBounds = findObjectsInBounds(
      selectionState.selectionBounds,
      lines,
      images
    );

    debugLog('useUnifiedSelection', 'Drag selection completed', {
      objectsCount: objectsInBounds.length
    });

    selectObjects(objectsInBounds);
    resetInteractionStates();
    ensureContainerFocus();
  }, [selectionState.selectionBounds, findObjectsInBounds, lines, images, selectObjects, resetInteractionStates, ensureContainerFocus]);

  // Core pointer handling logic
  const handlePointerDown = useCallback((worldX: number, worldY: number, ctrlKey: boolean = false, interactionType: 'mouse' | 'touch' = 'mouse') => {
    const worldPoint = { x: worldX, y: worldY };
    
    debugLog('useUnifiedSelection', 'Pointer down', { 
      worldPoint, 
      ctrlKey, 
      interactionType,
      selectedCount: selectionState.selectedObjects.length
    });
    
    // Reset any stuck states first
    resetInteractionStates();
    
    lastInteractionTypeRef.current = interactionType;
    isDraggingRef.current = true;
    hasMovedRef.current = false;

    // Check if clicking on an object
    const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
    
    if (objectsAtPoint.length > 0) {
      // Clicking on an object
      debugLog('useUnifiedSelection', 'Selecting object at point', { objectsAtPoint });
      
      if (ctrlKey) {
        // Multi-select: toggle the object
        const isAlreadySelected = selectionState.selectedObjects.some(obj => obj.id === objectsAtPoint[0].id);
        if (isAlreadySelected) {
          const newSelection = selectionState.selectedObjects.filter(obj => obj.id !== objectsAtPoint[0].id);
          selectObjects(newSelection);
        } else {
          selectObjects([...selectionState.selectedObjects, objectsAtPoint[0]]);
        }
      } else {
        // Single select
        selectObjects([objectsAtPoint[0]]);
      }
      
      ensureContainerFocus();
    } else {
      // Clicking on empty space - start drag selection
      debugLog('useUnifiedSelection', 'Starting drag selection');
      if (!ctrlKey) {
        clearSelection();
      }
      startDragSelection(worldPoint);
    }
  }, [selectionState.selectedObjects, findObjectsAtPoint, lines, images, selectObjects, clearSelection, startDragSelection, resetInteractionStates, ensureContainerFocus]);

  const handlePointerMove = useCallback((worldX: number, worldY: number) => {
    const worldPoint = { x: worldX, y: worldY };
    
    if (isDraggingRef.current) {
      hasMovedRef.current = true;
      
      if (isDragging && dragStartPoint) {
        // Update drag selection rectangle
        updateDragSelection(worldPoint);
      }
    } else {
      // Update hover feedback
      const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
      const hoveredId = objectsAtPoint.length > 0 ? objectsAtPoint[0].id : null;
      setHoveredObjectId(hoveredId);
    }
  }, [isDragging, dragStartPoint, updateDragSelection, findObjectsAtPoint, lines, images, setHoveredObjectId]);

  const handlePointerUp = useCallback(() => {
    debugLog('useUnifiedSelection', 'Pointer up', { 
      wasDragging: isDraggingRef.current,
      hasMoved: hasMovedRef.current,
      isDragging,
      interactionType: lastInteractionTypeRef.current
    });
    
    if (isDraggingRef.current && hasMovedRef.current && isDragging) {
      // Complete drag selection
      endDragSelection();
    } else {
      // No movement occurred, reset states
      resetInteractionStates();
    }
    
    isDraggingRef.current = false;
    hasMovedRef.current = false;
    lastInteractionTypeRef.current = null;
  }, [isDragging, endDragSelection, resetInteractionStates]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    handlePointerDown(worldPoint.x, worldPoint.y, e.evt.ctrlKey, 'mouse');
  }, [getRelativePointerPosition, handlePointerDown]);

  const handleMouseMove = useCallback((e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    handlePointerMove(worldPoint.x, worldPoint.y);
  }, [getRelativePointerPosition, handlePointerMove]);

  const handleMouseUp = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  // Touch event handlers with tablet-optimized coordinate handling
  const handleTouchStart = useCallback((e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const touch = e.evt.touches[0];
    if (!touch) return;

    debugLog('useUnifiedSelection', 'Touch start with tablet optimization', { 
      clientX: touch.clientX, 
      clientY: touch.clientY,
      touches: e.evt.touches.length 
    });
    
    // Prevent multi-touch gestures during selection
    if (e.evt.touches.length > 1) {
      debugLog('useUnifiedSelection', 'Multi-touch detected, ignoring');
      return;
    }
    
    // Ensure immediate state reset before new interaction
    resetInteractionStates();
    
    const worldPoint = getRelativePointerPosition(stage, touch.clientX, touch.clientY);
    handlePointerDown(worldPoint.x, worldPoint.y, false, 'touch');
  }, [getRelativePointerPosition, handlePointerDown, resetInteractionStates]);

  const handleTouchMove = useCallback((e: any) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const touch = e.evt.touches[0];
    if (!touch) return;

    // Prevent multi-touch gestures during selection
    if (e.evt.touches.length > 1) {
      return;
    }

    const worldPoint = getRelativePointerPosition(stage, touch.clientX, touch.clientY);
    handlePointerMove(worldPoint.x, worldPoint.y);
  }, [getRelativePointerPosition, handlePointerMove]);

  const handleTouchEnd = useCallback((e: any) => {
    debugLog('useUnifiedSelection', 'Touch end with immediate state updates', {
      remainingTouches: e.evt.changedTouches.length
    });

    // Only handle touch end if no more touches remain and it was a single touch
    if (e.evt.touches.length === 0 && e.evt.changedTouches.length === 1) {
      handlePointerUp();
    }
  }, [handlePointerUp]);

  return {
    // State
    selectionState,
    hoveredObjectId,
    isDragging,
    isDraggingObjects,
    
    // Event handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    
    // Actions
    selectObjects,
    clearSelection,
    resetInteractionStates
  };
};
