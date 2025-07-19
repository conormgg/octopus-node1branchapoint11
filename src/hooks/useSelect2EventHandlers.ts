
import { useCallback, useRef } from 'react';
import Konva from 'konva';
import { LineObject, ImageObject } from '@/types/whiteboard';
import { useSelect2State } from './useSelect2State';
import { useStageCoordinates } from './useStageCoordinates';

interface UseSelect2EventHandlersProps {
  lines: LineObject[];
  images: ImageObject[];
  panZoomState: { x: number; y: number; scale: number };
  stageRef: React.RefObject<Konva.Stage>;
}

export const useSelect2EventHandlers = ({ 
  lines, 
  images, 
  panZoomState,
  stageRef
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

  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);

  const handlePointerDown = useCallback((clientX: number, clientY: number, ctrlKey: boolean = false) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const worldPoint = getRelativePointerPosition(stage, clientX, clientY);
    
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
  }, [stageRef, getRelativePointerPosition, findObjectsAtPoint, selectObjectsAtPoint, clearSelection, startDragSelection, lines, images]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const worldPoint = getRelativePointerPosition(stage, clientX, clientY);
    
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
  }, [stageRef, getRelativePointerPosition, state.isSelecting, updateDragSelection, findObjectsAtPoint, setHoveredObject, lines, images]);

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

  const handleStageClick = useCallback((clientX: number, clientY: number, ctrlKey: boolean = false) => {
    const stage = stageRef.current;
    if (!stage || hasMovedRef.current) return;
    
    // This was a click, not a drag
    const worldPoint = getRelativePointerPosition(stage, clientX, clientY);
    selectObjectsAtPoint(worldPoint, lines, images, ctrlKey);
  }, [stageRef, getRelativePointerPosition, selectObjectsAtPoint, lines, images]);

  return {
    select2State: state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleStageClick,
    clearSelection
  };
};
