
import { useCallback, useRef } from 'react';
import Konva from 'konva';
import { LineObject, ImageObject } from '@/types/whiteboard';
import { useSelect2State } from './useSelect2State';
import { useStageCoordinates } from './useStageCoordinates';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('touchEvents');

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

  // Enhanced coordinate conversion with debugging
  const getWorldCoordinates = useCallback((clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    // Method 1: Use Konva's native getPointerPosition (most reliable)
    const nativePos = stage.getPointerPosition();
    
    // Method 2: Use our custom getRelativePointerPosition 
    const customPos = getRelativePointerPosition(stage, clientX, clientY);
    
    // Method 3: Manual calculation for comparison
    const container = stage.container();
    const rect = container.getBoundingClientRect();
    const scaleX = container.offsetWidth / rect.width;
    const scaleY = container.offsetHeight / rect.height;
    
    const clientPoint = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
    
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const manualPos = transform.point(clientPoint);

    // Debug logging to compare methods
    debugLog('Select2Coordinates', 'Coordinate comparison', {
      clientX, clientY,
      panZoomState,
      stageTransform: {
        x: stage.x(),
        y: stage.y(),
        scaleX: stage.scaleX(),
        scaleY: stage.scaleY()
      },
      nativePos,
      customPos,
      manualPos,
      containerRect: rect,
      containerSize: { width: container.offsetWidth, height: container.offsetHeight }
    });

    // Use Konva's native method if available, otherwise fall back to custom
    return nativePos || customPos;
  }, [stageRef, getRelativePointerPosition, panZoomState]);

  const handlePointerDown = useCallback((clientX: number, clientY: number, ctrlKey: boolean = false) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const worldPoint = getWorldCoordinates(clientX, clientY);
    
    debugLog('Select2EventHandlers', 'Pointer down', {
      clientX, clientY, worldPoint, ctrlKey,
      panZoomState,
      stagePos: { x: stage.x(), y: stage.y(), scale: stage.scaleX() }
    });
    
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
  }, [stageRef, getWorldCoordinates, findObjectsAtPoint, selectObjectsAtPoint, clearSelection, startDragSelection, lines, images, panZoomState]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const worldPoint = getWorldCoordinates(clientX, clientY);
    
    if (isDraggingRef.current) {
      hasMovedRef.current = true;
      
      if (state.isSelecting) {
        debugLog('Select2EventHandlers', 'Updating drag selection', {
          clientX, clientY, worldPoint,
          selectionBounds: state.selectionBounds
        });
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
  }, [stageRef, getWorldCoordinates, state.isSelecting, state.selectionBounds, updateDragSelection, findObjectsAtPoint, setHoveredObject, lines, images]);

  const handlePointerUp = useCallback(() => {
    debugLog('Select2EventHandlers', 'Pointer up', {
      isDragging: isDraggingRef.current,
      isSelecting: state.isSelecting,
      hasMoved: hasMovedRef.current
    });

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
    const worldPoint = getWorldCoordinates(clientX, clientY);
    debugLog('Select2EventHandlers', 'Stage click', {
      clientX, clientY, worldPoint, ctrlKey
    });
    selectObjectsAtPoint(worldPoint, lines, images, ctrlKey);
  }, [stageRef, getWorldCoordinates, selectObjectsAtPoint, lines, images]);

  return {
    select2State: state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleStageClick,
    clearSelection
  };
};
