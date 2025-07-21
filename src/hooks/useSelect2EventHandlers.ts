
import { useCallback, useRef } from 'react';
import Konva from 'konva';
import { LineObject, ImageObject } from '@/types/whiteboard';
import { useSelect2State } from './useSelect2State';
import { useStageCoordinates } from './useStageCoordinates';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('contextMenu');

interface UseSelect2EventHandlersProps {
  stageRef: React.RefObject<Konva.Stage>;
  lines: LineObject[];
  images: ImageObject[];
  panZoomState: { x: number; y: number; scale: number };
  onUpdateLine?: (lineId: string, updates: any) => void;
  onUpdateImage?: (imageId: string, updates: any) => void;
  onDeleteObjects?: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  // Main selection state integration for delete/visual feedback
  mainSelection?: {
    selectObjects: (objects: Array<{id: string, type: 'line' | 'image'}>) => void;
    clearSelection: () => void;
    setSelectionBounds: (bounds: any) => void;
    setIsSelecting: (selecting: boolean) => void;
    selectionState: {
      selectedObjects: Array<{id: string, type: 'line' | 'image'}>;
      isSelecting: boolean;
      selectionBounds: any;
    };
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
  mainSelection
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
    updateGroupBounds,
    isPointInGroupBounds,
    setState
  } = useSelect2State();

  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Helper function to sync selection with main state
  const syncSelectionWithMainState = useCallback((selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => {
    debugLog('useSelect2EventHandlers', 'Syncing selection with main state', {
      selectedCount: selectedObjects.length,
      objects: selectedObjects
    });
    if (mainSelection) {
      mainSelection.selectObjects(selectedObjects);
    }
  }, [mainSelection]);

  // Helper function to sync selection bounds with main state
  const syncSelectionBoundsWithMainState = useCallback((bounds: any, isSelecting: boolean) => {
    if (mainSelection) {
      mainSelection.setSelectionBounds(bounds);
      mainSelection.setIsSelecting(isSelecting);
    }
  }, [mainSelection]);

  // Helper function to clear main selection
  const clearMainSelection = useCallback(() => {
    if (mainSelection) {
      mainSelection.clearSelection();
    }
  }, [mainSelection]);

  // Helper function to ensure container has focus for keyboard events
  const ensureContainerFocus = useCallback(() => {
    if (containerRef?.current) {
      containerRef.current.focus();
    }
  }, [containerRef]);

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

  // FIXED: Apply drag offset with proper coordinate handling - now ensures single application
  const applyDragOffset = useCallback(() => {
    if (!state.dragOffset || (!onUpdateLine && !onUpdateImage)) return;

    const { x: dx, y: dy } = state.dragOffset;

    console.log('Select2: Applying drag offset', { dx, dy, selectedCount: state.selectedObjects.length });

    // Apply offset to objects - single application only
    state.selectedObjects.forEach(obj => {
      if (obj.type === 'line' && onUpdateLine) {
        const currentLine = lines.find(l => l.id === obj.id);
        if (currentLine) {
          const newX = currentLine.x + dx;
          const newY = currentLine.y + dy;
          console.log('Select2: Updating line position', { 
            id: obj.id, 
            from: { x: currentLine.x, y: currentLine.y }, 
            to: { x: newX, y: newY },
            offset: { dx, dy }
          });
          onUpdateLine(obj.id, { x: newX, y: newY });
        }
      } else if (obj.type === 'image' && onUpdateImage) {
        const currentImage = images.find(i => i.id === obj.id);
        if (currentImage) {
          const newX = currentImage.x + dx;
          const newY = currentImage.y + dy;
          console.log('Select2: Updating image position', { 
            id: obj.id, 
            from: { x: currentImage.x, y: currentImage.y }, 
            to: { x: newX, y: newY },
            offset: { dx, dy }
          });
          onUpdateImage(obj.id, { x: newX, y: newY });
        }
      }
    });

    // FIXED: Update group bounds synchronously after applying position changes
    // This ensures the visual feedback matches the actual object positions
    setTimeout(() => {
      setState(prev => {
        const updatedLines = lines.map(line => {
          const selectedObj = prev.selectedObjects.find(obj => obj.id === line.id && obj.type === 'line');
          if (selectedObj) {
            return { ...line, x: line.x + dx, y: line.y + dy };
          }
          return line;
        });

        const updatedImages = images.map(image => {
          const selectedObj = prev.selectedObjects.find(obj => obj.id === image.id && obj.type === 'image');
          if (selectedObj) {
            return { ...image, x: image.x + dx, y: image.y + dy };
          }
          return image;
        });

        const newGroupBounds = calculateGroupBounds(prev.selectedObjects, updatedLines, updatedImages);
        
        console.log('Select2: Updated group bounds after position changes', { 
          oldBounds: prev.groupBounds, 
          newBounds: newGroupBounds,
          offset: { dx, dy }
        });
        
        return {
          ...prev,
          groupBounds: newGroupBounds
        };
      });
    }, 0);
  }, [state.dragOffset, state.selectedObjects, lines, images, onUpdateLine, onUpdateImage, setState, calculateGroupBounds]);

  // Core pointer handling logic - extracted to avoid duplication
  const handlePointerDown = useCallback((worldX: number, worldY: number, ctrlKey: boolean = false) => {
    const worldPoint = { x: worldX, y: worldY };
    
    debugLog('useSelect2EventHandlers', 'Pointer down', { worldPoint, ctrlKey });
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPositionRef.current = worldPoint;

    // Check if clicking on a selected object or within group bounds first
    if (isPointOnSelectedObject(worldPoint)) {
      // Start dragging selected objects
      debugLog('useSelect2EventHandlers', 'Starting drag of selected objects');
      startDraggingObjects(worldPoint);
      return;
    }

    // Check if clicking on an object
    const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
    
    if (objectsAtPoint.length > 0) {
      // Clicking on an object
      debugLog('useSelect2EventHandlers', 'Selecting object at point', { objectsAtPoint });
      selectObjectsAtPoint(worldPoint, lines, images, ctrlKey);
      // Sync with main selection state
      const newSelection = ctrlKey ? 
        [...state.selectedObjects, objectsAtPoint[0]] : 
        [objectsAtPoint[0]];
      syncSelectionWithMainState(newSelection);
      // Ensure container has focus for keyboard events
      ensureContainerFocus();
    } else {
      // Clicking on empty space - start drag selection
      debugLog('useSelect2EventHandlers', 'Starting drag selection');
      if (!ctrlKey) {
        clearSelection();
        clearMainSelection();
      }
      startDragSelection(worldPoint);
      syncSelectionBoundsWithMainState({ x: worldX, y: worldY, width: 0, height: 0 }, true);
    }
  }, [isPointOnSelectedObject, startDraggingObjects, findObjectsAtPoint, selectObjectsAtPoint, clearSelection, startDragSelection, lines, images, ensureContainerFocus, state.selectedObjects, syncSelectionWithMainState, clearMainSelection, syncSelectionBoundsWithMainState]);

  const handlePointerMove = useCallback((worldX: number, worldY: number) => {
    const worldPoint = { x: worldX, y: worldY };
    
    if (isDraggingRef.current) {
      hasMovedRef.current = true;
      
      if (state.isDraggingObjects) {
        // Update object dragging with consistent coordinate handling
        debugLog('useSelect2EventHandlers', 'Updating object drag', { 
          worldPoint,
          dragStartPosition: dragStartPositionRef.current,
          currentOffset: state.dragOffset 
        });
        updateObjectDragging(worldPoint);
      } else if (state.isSelecting) {
        // Update drag selection rectangle
        updateDragSelection(worldPoint);
        // Sync with main selection bounds
        if (state.selectionBounds) {
          const newBounds = {
            x: Math.min(state.selectionBounds.x, worldX),
            y: Math.min(state.selectionBounds.y, worldY),
            width: Math.abs(worldX - state.selectionBounds.x),
            height: Math.abs(worldY - state.selectionBounds.y)
          };
          syncSelectionBoundsWithMainState(newBounds, true);
        }
      }
    } else {
      // Update hover feedback
      const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
      const hoveredId = objectsAtPoint.length > 0 ? objectsAtPoint[0].id : null;
      setHoveredObject(hoveredId);
    }
  }, [state.isDraggingObjects, state.isSelecting, state.selectionBounds, state.dragOffset, updateObjectDragging, updateDragSelection, findObjectsAtPoint, setHoveredObject, lines, images, syncSelectionBoundsWithMainState]);

  const handlePointerUp = useCallback(() => {
    debugLog('useSelect2EventHandlers', 'Pointer up', { 
      wasDragging: isDraggingRef.current,
      hasMoved: hasMovedRef.current,
      isDraggingObjects: state.isDraggingObjects,
      dragOffset: state.dragOffset,
      selectedObjects: state.selectedObjects 
    });
    
    if (isDraggingRef.current) {
      if (state.isDraggingObjects && hasMovedRef.current) {
        // Apply the drag offset to actually move the objects - single application
        debugLog('useSelect2EventHandlers', 'Applying final drag offset');
        applyDragOffset();
        endObjectDragging();
      } else if (state.isSelecting && hasMovedRef.current) {
        // Complete drag selection
        const selectedObjects = endDragSelection(lines, images);
        debugLog('useSelect2EventHandlers', 'Drag selection completed', { selectedObjects });
        // Sync with main selection state
        syncSelectionWithMainState(selectedObjects);
        syncSelectionBoundsWithMainState(null, false);
        // Ensure container has focus for keyboard events after drag selection
        ensureContainerFocus();
      }
    }
    
    isDraggingRef.current = false;
    hasMovedRef.current = false;
    dragStartPositionRef.current = null;
  }, [state.isDraggingObjects, state.isSelecting, state.dragOffset, state.selectedObjects, applyDragOffset, endObjectDragging, endDragSelection, lines, images, ensureContainerFocus, syncSelectionWithMainState, syncSelectionBoundsWithMainState]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    handlePointerDown(worldPoint.x, worldPoint.y, e.evt.ctrlKey);
  }, [getRelativePointerPosition, handlePointerDown]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    handlePointerMove(worldPoint.x, worldPoint.y);
  }, [getRelativePointerPosition, handlePointerMove]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    handlePointerUp();
  }, [handlePointerUp]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const touch = e.evt.touches[0];
    if (!touch) return;

    debugLog('useSelect2EventHandlers', 'Touch start', { clientX: touch.clientX, clientY: touch.clientY });
    
    const worldPoint = getRelativePointerPosition(stage, touch.clientX, touch.clientY);
    handlePointerDown(worldPoint.x, worldPoint.y, false); // No ctrl key for touch
  }, [getRelativePointerPosition, handlePointerDown]);

  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const touch = e.evt.touches[0];
    if (!touch) return;

    const worldPoint = getRelativePointerPosition(stage, touch.clientX, touch.clientY);
    handlePointerMove(worldPoint.x, worldPoint.y);
  }, [getRelativePointerPosition, handlePointerMove]);

  const handleTouchEnd = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    debugLog('useSelect2EventHandlers', 'Touch end');
    handlePointerUp();
  }, [handlePointerUp]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!hasMovedRef.current) {
      // This was a click, not a drag
      const stage = e.target.getStage();
      if (!stage) return;
      
      const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
      selectObjectsAtPoint(worldPoint, lines, images, e.evt.ctrlKey);
      
      // Sync click selection with main state
      const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
      if (objectsAtPoint.length > 0) {
        const newSelection = e.evt.ctrlKey ? 
          [...state.selectedObjects, objectsAtPoint[0]] : 
          [objectsAtPoint[0]];
        syncSelectionWithMainState(newSelection);
      }
    }
  }, [getRelativePointerPosition, selectObjectsAtPoint, findObjectsAtPoint, lines, images, state.selectedObjects, syncSelectionWithMainState]);

  // Updated delete functionality - now uses the main selection state that's synchronized
  const deleteSelectedObjects = useCallback(() => {
    // Use main selection state for deletion if available, fallback to select2 state
    const selectedObjects = mainSelection?.selectionState?.selectedObjects || state.selectedObjects;
    
    if (selectedObjects.length === 0 || !onDeleteObjects) return;

    console.log(`Deleting ${selectedObjects.length} selected objects via select2`);
    
    // Use the proper delete function
    onDeleteObjects(selectedObjects);

    // Clear both selection states after deletion
    clearSelection();
    clearMainSelection();
  }, [state.selectedObjects, mainSelection?.selectionState?.selectedObjects, onDeleteObjects, clearSelection, clearMainSelection]);

  return {
    select2State: state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleStageClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    clearSelection: () => {
      clearSelection();
      clearMainSelection();
    },
    deleteSelectedObjects
  };
};
