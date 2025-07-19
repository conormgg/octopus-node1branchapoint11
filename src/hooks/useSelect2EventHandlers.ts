import { useCallback, useRef } from 'react';
import { LineObject, ImageObject } from '@/types/whiteboard';
import { useSelect2State } from './useSelect2State';

interface UseSelect2EventHandlersProps {
  lines: LineObject[];
  images: ImageObject[];
  panZoomState: { x: number; y: number; scale: number };
}

export const useSelect2EventHandlers = ({ 
  lines, 
  images, 
  panZoomState 
}: UseSelect2EventHandlersProps) => {
  const {
    state,
    startDragSelection,
    updateDragSelection,
    endDragSelection,
    selectObjectsAtPoint,
    clearSelection,
    setHoveredObject,
    findObjectsAtPoint
  } = useSelect2State();

  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);

  // Convert stage coordinates to world coordinates
  const stageToWorld = useCallback((stageX: number, stageY: number) => {
    return {
      x: (stageX - panZoomState.x) / panZoomState.scale,
      y: (stageY - panZoomState.y) / panZoomState.scale
    };
  }, [panZoomState]);

  const handlePointerDown = useCallback((stageX: number, stageY: number, ctrlKey: boolean = false) => {
    const worldPoint = stageToWorld(stageX, stageY);
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;

    // Check if clicking on an object
    const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
    
    if (objectsAtPoint.length > 0) {
      // Clicking on an object
      selectObjectsAtPoint(worldPoint, lines, images, ctrlKey);
    } else {
      // Clicking on empty space - start drag selection
      if (!ctrlKey) {
        clearSelection();
      }
      startDragSelection(worldPoint);
    }
  }, [stageToWorld, findObjectsAtPoint, selectObjectsAtPoint, clearSelection, startDragSelection, lines, images]);

  const handlePointerMove = useCallback((stageX: number, stageY: number) => {
    const worldPoint = stageToWorld(stageX, stageY);
    
    if (isDraggingRef.current) {
      hasMovedRef.current = true;
      
      if (state.isSelecting) {
        // Update drag selection rectangle
        updateDragSelection(worldPoint);
      }
      // TODO: Handle object movement for selected objects
    } else {
      // Update hover feedback
      const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
      const hoveredId = objectsAtPoint.length > 0 ? objectsAtPoint[0].id : null;
      setHoveredObject(hoveredId);
    }
  }, [stageToWorld, state.isSelecting, updateDragSelection, findObjectsAtPoint, setHoveredObject, lines, images]);

  const handlePointerUp = useCallback(() => {
    if (isDraggingRef.current) {
      if (state.isSelecting && hasMovedRef.current) {
        // Complete drag selection
        endDragSelection(lines, images);
      }
    }
    
    isDraggingRef.current = false;
    hasMovedRef.current = false;
  }, [state.isSelecting, endDragSelection, lines, images]);

  const handleStageClick = useCallback((stageX: number, stageY: number, ctrlKey: boolean = false) => {
    if (!hasMovedRef.current) {
      // This was a click, not a drag
      const worldPoint = stageToWorld(stageX, stageY);
      selectObjectsAtPoint(worldPoint, lines, images, ctrlKey);
    }
  }, [stageToWorld, selectObjectsAtPoint, lines, images]);

  return {
    select2State: state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleStageClick,
    clearSelection
  };
};