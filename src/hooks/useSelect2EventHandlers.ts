
import { useCallback, useRef } from 'react';
import Konva from 'konva';
import { LineObject, ImageObject } from '@/types/whiteboard';
import { useStageCoordinates } from './useStageCoordinates';

interface UseSelect2EventHandlersProps {
  stageRef: React.RefObject<Konva.Stage>;
  lines: LineObject[];
  images: ImageObject[];
  panZoomState: { x: number; y: number; scale: number };
  onUpdateLine?: (lineId: string, updates: any) => void;
  onUpdateImage?: (imageId: string, updates: any) => void;
  onDeleteObjects?: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  // Main selection state functions
  selection: {
    selectionState: any;
    selectObjects: (objects: Array<{id: string, type: 'line' | 'image'}>) => void;
    clearSelection: () => void;
    setSelectionBounds: (bounds: any) => void;
    setIsSelecting: (selecting: boolean) => void;
    findObjectsAtPoint: (point: {x: number, y: number}, lines: LineObject[], images: ImageObject[]) => Array<{id: string, type: 'line' | 'image'}>;
    findObjectsInBounds: (bounds: any, lines: LineObject[], images: ImageObject[]) => Array<{id: string, type: 'line' | 'image'}>;
    updateSelectionBounds: (objects: Array<{id: string, type: 'line' | 'image'}>, lines: LineObject[], images: ImageObject[]) => void;
  };
}

export const useSelect2EventHandlers = ({ 
  stageRef,
  lines, 
  images, 
  panZoomState,
  onUpdateLine,
  onUpdateImage,
  onDeleteObjects,
  containerRef,
  selection
}: UseSelect2EventHandlersProps) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartPointRef = useRef<{x: number, y: number} | null>(null);
  const dragOffsetRef = useRef<{x: number, y: number} | null>(null);
  const isDraggingObjectsRef = useRef(false);

  // Helper function to ensure container has focus for keyboard events
  const ensureContainerFocus = useCallback(() => {
    if (containerRef?.current) {
      containerRef.current.focus();
    }
  }, [containerRef]);

  // Check if point is within group bounds (use main selection state)
  const isPointOnSelectedObject = useCallback((point: { x: number; y: number }) => {
    const selectedObjects = selection.selectionState.selectedObjects || [];
    if (selectedObjects.length === 0) return false;
    
    // Check if clicking directly on a selected object
    const objectsAtPoint = selection.findObjectsAtPoint(point, lines, images);
    return objectsAtPoint.some(obj => 
      selectedObjects.some((selected: any) => selected.id === obj.id)
    );
  }, [selection, lines, images]);

  // Apply drag offset to objects
  const applyDragOffset = useCallback(() => {
    if (!dragOffsetRef.current || (!onUpdateLine && !onUpdateImage)) return;

    const { x: dx, y: dy } = dragOffsetRef.current;
    const selectedObjects = selection.selectionState.selectedObjects || [];

    // Apply offset to objects
    selectedObjects.forEach((obj: any) => {
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
  }, [selection.selectionState.selectedObjects, lines, images, onUpdateLine, onUpdateImage]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPointRef.current = worldPoint;

    // Check if clicking on a selected object first
    if (isPointOnSelectedObject(worldPoint)) {
      // Start dragging selected objects
      isDraggingObjectsRef.current = true;
      dragOffsetRef.current = { x: 0, y: 0 };
      return;
    }

    // Check if clicking on an object
    const objectsAtPoint = selection.findObjectsAtPoint(worldPoint, lines, images);
    
    if (objectsAtPoint.length > 0) {
      // Clicking on an object
      selection.selectObjects([objectsAtPoint[0]]);
      // Update selection bounds for the selected object
      setTimeout(() => {
        selection.updateSelectionBounds([objectsAtPoint[0]], lines, images);
      }, 0);
      // Ensure container has focus for keyboard events
      ensureContainerFocus();
    } else {
      // Clicking on empty space - start drag selection
      if (!e.evt.ctrlKey) {
        selection.clearSelection();
      }
      selection.setIsSelecting(true);
      selection.setSelectionBounds({ x: worldPoint.x, y: worldPoint.y, width: 0, height: 0 });
    }
  }, [getRelativePointerPosition, isPointOnSelectedObject, selection, lines, images, ensureContainerFocus]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    
    if (isDraggingRef.current) {
      hasMovedRef.current = true;
      
      if (isDraggingObjectsRef.current && dragStartPointRef.current) {
        // Update object dragging
        dragOffsetRef.current = {
          x: worldPoint.x - dragStartPointRef.current.x,
          y: worldPoint.y - dragStartPointRef.current.y
        };
      } else if (selection.selectionState.isSelecting && dragStartPointRef.current) {
        // Update drag selection rectangle
        const startPoint = dragStartPointRef.current;
        const newBounds = {
          x: Math.min(startPoint.x, worldPoint.x),
          y: Math.min(startPoint.y, worldPoint.y),
          width: Math.abs(worldPoint.x - startPoint.x),
          height: Math.abs(worldPoint.y - startPoint.y)
        };
        selection.setSelectionBounds(newBounds);
      }
    }
  }, [getRelativePointerPosition, selection]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDraggingRef.current) {
      if (isDraggingObjectsRef.current && hasMovedRef.current) {
        // Apply the drag offset to actually move the objects
        applyDragOffset();
      } else if (selection.selectionState.isSelecting && hasMovedRef.current) {
        // Complete drag selection
        const bounds = selection.selectionState.selectionBounds;
        if (bounds && (bounds.width > 5 || bounds.height > 5)) {
          // Find objects within selection bounds
          const objectsInBounds = selection.findObjectsInBounds(bounds, lines, images);
          selection.selectObjects(objectsInBounds);
          // Update selection bounds for the selected objects
          setTimeout(() => {
            selection.updateSelectionBounds(objectsInBounds, lines, images);
          }, 0);
        }
        
        // End selection
        selection.setIsSelecting(false);
        selection.setSelectionBounds(null);
        // Ensure container has focus for keyboard events after drag selection
        ensureContainerFocus();
      }
    }
    
    isDraggingRef.current = false;
    hasMovedRef.current = false;
    isDraggingObjectsRef.current = false;
    dragStartPointRef.current = null;
    dragOffsetRef.current = null;
  }, [applyDragOffset, selection, lines, images, ensureContainerFocus]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!hasMovedRef.current) {
      // This was a click, not a drag
      const stage = e.target.getStage();
      if (!stage) return;
      
      const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
      const objectsAtPoint = selection.findObjectsAtPoint(worldPoint, lines, images);
      
      if (objectsAtPoint.length > 0) {
        selection.selectObjects([objectsAtPoint[0]]);
        setTimeout(() => {
          selection.updateSelectionBounds([objectsAtPoint[0]], lines, images);
        }, 0);
      }
    }
  }, [getRelativePointerPosition, selection, lines, images]);

  // Pointer handlers that work with main selection system
  const handlePointerDown = useCallback((worldX: number, worldY: number, ctrlKey: boolean = false) => {
    const worldPoint = { x: worldX, y: worldY };
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPointRef.current = worldPoint;

    // Check if clicking on a selected object first
    if (isPointOnSelectedObject(worldPoint)) {
      // Start dragging selected objects
      isDraggingObjectsRef.current = true;
      dragOffsetRef.current = { x: 0, y: 0 };
      return;
    }

    // Check if clicking on an object
    const objectsAtPoint = selection.findObjectsAtPoint(worldPoint, lines, images);
    
    if (objectsAtPoint.length > 0) {
      // Clicking on an object
      selection.selectObjects([objectsAtPoint[0]]);
      setTimeout(() => {
        selection.updateSelectionBounds([objectsAtPoint[0]], lines, images);
      }, 0);
      // Ensure container has focus for keyboard events
      ensureContainerFocus();
    } else {
      // Clicking on empty space - start drag selection
      if (!ctrlKey) {
        selection.clearSelection();
      }
      selection.setIsSelecting(true);
      selection.setSelectionBounds({ x: worldPoint.x, y: worldPoint.y, width: 0, height: 0 });
    }
  }, [isPointOnSelectedObject, selection, lines, images, ensureContainerFocus]);

  const handlePointerMove = useCallback((worldX: number, worldY: number) => {
    const worldPoint = { x: worldX, y: worldY };
    
    if (isDraggingRef.current) {
      hasMovedRef.current = true;
      
      if (isDraggingObjectsRef.current && dragStartPointRef.current) {
        // Update object dragging
        dragOffsetRef.current = {
          x: worldPoint.x - dragStartPointRef.current.x,
          y: worldPoint.y - dragStartPointRef.current.y
        };
      } else if (selection.selectionState.isSelecting && dragStartPointRef.current) {
        // Update drag selection rectangle
        const startPoint = dragStartPointRef.current;
        const newBounds = {
          x: Math.min(startPoint.x, worldPoint.x),
          y: Math.min(startPoint.y, worldPoint.y),
          width: Math.abs(worldPoint.x - startPoint.x),
          height: Math.abs(worldPoint.y - startPoint.y)
        };
        selection.setSelectionBounds(newBounds);
      }
    }
  }, [selection]);

  const handlePointerUp = useCallback(() => {
    if (isDraggingRef.current) {
      if (isDraggingObjectsRef.current && hasMovedRef.current) {
        // Apply the drag offset to actually move the objects
        applyDragOffset();
      } else if (selection.selectionState.isSelecting && hasMovedRef.current) {
        // Complete drag selection
        const bounds = selection.selectionState.selectionBounds;
        if (bounds && (bounds.width > 5 || bounds.height > 5)) {
          // Find objects within selection bounds
          const objectsInBounds = selection.findObjectsInBounds(bounds, lines, images);
          selection.selectObjects(objectsInBounds);
          setTimeout(() => {
            selection.updateSelectionBounds(objectsInBounds, lines, images);
          }, 0);
        }
        
        // End selection
        selection.setIsSelecting(false);
        selection.setSelectionBounds(null);
        // Ensure container has focus for keyboard events after drag selection
        ensureContainerFocus();
      }
    }
    
    isDraggingRef.current = false;
    hasMovedRef.current = false;
    isDraggingObjectsRef.current = false;
    dragStartPointRef.current = null;
    dragOffsetRef.current = null;
  }, [applyDragOffset, selection, lines, images, ensureContainerFocus]);

  // Delete function that uses main selection state
  const deleteSelectedObjects = useCallback(() => {
    const selectedObjects = selection.selectionState.selectedObjects || [];
    if (selectedObjects.length === 0 || !onDeleteObjects) return;

    console.log(`Deleting ${selectedObjects.length} selected objects`);
    
    // Use the proper delete function
    onDeleteObjects(selectedObjects);

    // Clear the selection after deletion
    selection.clearSelection();
  }, [selection.selectionState.selectedObjects, onDeleteObjects, selection]);

  return {
    // Return main selection state instead of separate state
    select2State: selection.selectionState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleStageClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearSelection: selection.clearSelection,
    deleteSelectedObjects
  };
};
