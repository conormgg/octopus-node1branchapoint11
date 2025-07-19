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
  onUpdateLine?: (lineId: string, updates: any) => void;
  onUpdateImage?: (imageId: string, updates: any) => void;
}

export const useSelect2EventHandlers = ({ 
  stageRef,
  lines, 
  images, 
  panZoomState,
  onUpdateLine,
  onUpdateImage
}: UseSelect2EventHandlersProps) => {
  const {
    state,
    startDragSelection,
    updateDragSelection,
    endDragSelection,
    startDraggingObjects,
    updateObjectDragging,
    endObjectDragging,
    selectObjectsAtPoint,
    clearSelection,
    setHoveredObject,
    findObjectsAtPoint,
    calculateGroupBounds,
    isPointInGroupBounds
  } = useSelect2State();

  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);

  // Check if point is on any selected object OR within group bounds
  const isPointOnSelectedObject = useCallback((point: { x: number; y: number }) => {
    // First check if we're within the group bounds (for easy dragging)
    if (state.selectedObjects.length > 0 && isPointInGroupBounds(point)) {
      return true;
    }
    
    // Fallback: check if clicking directly on a selected object
    const objectsAtPoint = findObjectsAtPoint(point, lines, images);
    return objectsAtPoint.some(obj => 
      state.selectedObjects.some(selected => selected.id === obj.id)
    );
  }, [findObjectsAtPoint, lines, images, state.selectedObjects, isPointInGroupBounds]);

  // Apply drag offset to objects
  const applyDragOffset = useCallback(() => {
    if (!state.dragOffset || (!onUpdateLine && !onUpdateImage)) return;

    const { x: dx, y: dy } = state.dragOffset;

    state.selectedObjects.forEach(obj => {
      if (obj.type === 'line' && onUpdateLine) {
        onUpdateLine(obj.id, {
          x: (lines.find(l => l.id === obj.id)?.x || 0) + dx,
          y: (lines.find(l => l.id === obj.id)?.y || 0) + dy
        });
      } else if (obj.type === 'image' && onUpdateImage) {
        onUpdateImage(obj.id, {
          x: (images.find(i => i.id === obj.id)?.x || 0) + dx,
          y: (images.find(i => i.id === obj.id)?.y || 0) + dy
        });
      }
    });
  }, [state.dragOffset, state.selectedObjects, lines, images, onUpdateLine, onUpdateImage]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;

    // Check if clicking on a selected object or within group bounds first
    if (isPointOnSelectedObject(worldPoint)) {
      // Start dragging selected objects
      startDraggingObjects(worldPoint);
      return;
    }

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
  }, [getRelativePointerPosition, isPointOnSelectedObject, startDraggingObjects, findObjectsAtPoint, selectObjectsAtPoint, clearSelection, startDragSelection, lines, images]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    
    if (isDraggingRef.current) {
      hasMovedRef.current = true;
      
      if (state.isDraggingObjects) {
        // Update object dragging
        updateObjectDragging(worldPoint);
      } else if (state.isSelecting) {
        // Update drag selection rectangle
        updateDragSelection(worldPoint);
      }
    } else {
      // Update hover feedback
      const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
      const hoveredId = objectsAtPoint.length > 0 ? objectsAtPoint[0].id : null;
      setHoveredObject(hoveredId);
    }
  }, [getRelativePointerPosition, state.isDraggingObjects, state.isSelecting, updateObjectDragging, updateDragSelection, findObjectsAtPoint, setHoveredObject, lines, images]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDraggingRef.current) {
      if (state.isDraggingObjects && hasMovedRef.current) {
        // Apply the drag offset to actually move the objects
        applyDragOffset();
        endObjectDragging();
      } else if (state.isSelecting && hasMovedRef.current) {
        // Complete drag selection
        endDragSelection(lines, images);
      }
    }
    
    isDraggingRef.current = false;
    hasMovedRef.current = false;
  }, [state.isDraggingObjects, state.isSelecting, applyDragOffset, endObjectDragging, endDragSelection, lines, images]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!hasMovedRef.current) {
      // This was a click, not a drag
      const stage = e.target.getStage();
      if (!stage) return;
      
      const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
      selectObjectsAtPoint(worldPoint, lines, images, e.evt.ctrlKey);
    }
  }, [getRelativePointerPosition, selectObjectsAtPoint, lines, images]);

  // Updated pointer handlers - now use group bounds for better interaction
  const handlePointerDown = useCallback((worldX: number, worldY: number, ctrlKey: boolean = false) => {
    const worldPoint = { x: worldX, y: worldY };
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;

    // Check if clicking on a selected object or within group bounds first
    if (isPointOnSelectedObject(worldPoint)) {
      // Start dragging selected objects
      startDraggingObjects(worldPoint);
      return;
    }

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
  }, [isPointOnSelectedObject, startDraggingObjects, findObjectsAtPoint, selectObjectsAtPoint, clearSelection, startDragSelection, lines, images]);

  const handlePointerMove = useCallback((worldX: number, worldY: number) => {
    const worldPoint = { x: worldX, y: worldY };
    
    if (isDraggingRef.current) {
      hasMovedRef.current = true;
      
      if (state.isDraggingObjects) {
        // Update object dragging
        updateObjectDragging(worldPoint);
      } else if (state.isSelecting) {
        // Update drag selection rectangle
        updateDragSelection(worldPoint);
      }
    } else {
      // Update hover feedback
      const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
      const hoveredId = objectsAtPoint.length > 0 ? objectsAtPoint[0].id : null;
      setHoveredObject(hoveredId);
    }
  }, [state.isDraggingObjects, state.isSelecting, updateObjectDragging, updateDragSelection, findObjectsAtPoint, setHoveredObject, lines, images]);

  const handlePointerUp = useCallback(() => {
    if (isDraggingRef.current) {
      if (state.isDraggingObjects && hasMovedRef.current) {
        // Apply the drag offset to actually move the objects
        applyDragOffset();
        endObjectDragging();
      } else if (state.isSelecting && hasMovedRef.current) {
        // Complete drag selection
        endDragSelection(lines, images);
      }
    }
    
    isDraggingRef.current = false;
    hasMovedRef.current = false;
  }, [state.isDraggingObjects, state.isSelecting, applyDragOffset, endObjectDragging, endDragSelection, lines, images]);

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
