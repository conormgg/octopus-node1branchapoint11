
import { useCallback, useRef } from 'react';
import Konva from 'konva';
import { LineObject, ImageObject } from '@/types/whiteboard';
import { useSelect2State } from './useSelect2State';
import { useStageCoordinates } from './useStageCoordinates';

interface UseSelect2EventHandlersProps {
  stageRef: React.RefObject<Konva.Stage>;
  lines: LineObject[];
  images: ImageObject[];
  panZoomState: { x: number; y: number; scale: number };
}

export const useSelect2EventHandlers = ({ 
  stageRef,
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

  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;

    // Check if clicking on an object
    const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
    
    if (objectsAtPoint.length > 0) {
      // Clicking on an object
      selectObjectsAtPoint(worldPoint, lines, images, e.evt.ctrlKey);
    } else {
      // Clicking on empty space - start drag selection
      if (!e.evt.ctrlKey) {
        clearSelection();
      }
      startDragSelection(worldPoint);
    }
  }, [getRelativePointerPosition, findObjectsAtPoint, selectObjectsAtPoint, clearSelection, startDragSelection, lines, images]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    
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
  }, [getRelativePointerPosition, state.isSelecting, updateDragSelection, findObjectsAtPoint, setHoveredObject, lines, images]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDraggingRef.current) {
      if (state.isSelecting && hasMovedRef.current) {
        // Complete drag selection
        endDragSelection(lines, images);
      }
    }
    
    isDraggingRef.current = false;
    hasMovedRef.current = false;
  }, [state.isSelecting, endDragSelection, lines, images]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!hasMovedRef.current) {
      // This was a click, not a drag
      const stage = e.target.getStage();
      if (!stage) return;
      
      const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
      selectObjectsAtPoint(worldPoint, lines, images, e.evt.ctrlKey);
    }
  }, [getRelativePointerPosition, selectObjectsAtPoint, lines, images]);

  // Updated pointer handlers - now accept world coordinates directly (no transformation needed)
  const handlePointerDown = useCallback((worldX: number, worldY: number, ctrlKey: boolean = false) => {
    const worldPoint = { x: worldX, y: worldY };
    
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
  }, [findObjectsAtPoint, selectObjectsAtPoint, clearSelection, startDragSelection, lines, images]);

  const handlePointerMove = useCallback((worldX: number, worldY: number) => {
    const worldPoint = { x: worldX, y: worldY };
    
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
  }, [state.isSelecting, updateDragSelection, findObjectsAtPoint, setHoveredObject, lines, images]);

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

  return {
    select2State: state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleStageClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearSelection
  };
};
