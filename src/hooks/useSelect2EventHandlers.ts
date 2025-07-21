
import { useCallback } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import { useSelect2State } from './useSelect2State';
import { LineObject, ImageObject } from '@/types/whiteboard';

export const useSelect2EventHandlers = (config: {
  stageRef: any;
  lines: LineObject[];
  images: ImageObject[];
  deleteSelectedObjects?: (objects: Array<{ id: string; type: 'line' | 'image' }>) => void;
  updateImageState?: (id: string, updates: Partial<ImageObject>) => void;
}) => {
  const { lines, images, deleteSelectedObjects, updateImageState } = config;
  const {
    state,
    setState,
    startDragSelection,
    updateDragSelection,
    endDragSelection,
    startDraggingObjects,
    updateObjectDragging,
    endObjectDragging,
    selectObjectsAtPoint,
    clearSelection,
    setHoveredObject,
    updateGroupBounds,
    isPointInGroupBounds,
    hideContextMenu,
    createObjectsAtPoint
  } = useSelect2State();

  // Update group bounds when lines or images change
  const handleDataChange = useCallback(() => {
    updateGroupBounds(lines, images);
  }, [updateGroupBounds, lines, images]);

  // Handle mouse down
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    console.log('Select2: Mouse down at', pos);

    const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;
    
    // Hide context menu on any click
    if (state.contextMenuVisible) {
      hideContextMenu();
    }

    // Check if clicking within existing selection bounds
    if (state.selectedObjects.length > 0 && isPointInGroupBounds(pos)) {
      console.log('Select2: Clicking within selection bounds, starting drag');
      // Start dragging selected objects
      startDraggingObjects(pos);
      return;
    }

    // Check if clicking on an object using the createObjectsAtPoint function
    const clickedObjects = createObjectsAtPoint(pos, lines, images);
    console.log('Select2: Found objects at point:', clickedObjects);
    
    if (clickedObjects.length > 0) {
      // Select object(s) at point
      selectObjectsAtPoint(pos, lines, images, isCtrlPressed);
    } else {
      // Start drag selection
      console.log('Select2: Starting drag selection');
      startDragSelection(pos);
    }
  }, [
    state.selectedObjects,
    state.contextMenuVisible,
    isPointInGroupBounds,
    startDraggingObjects,
    selectObjectsAtPoint,
    startDragSelection,
    hideContextMenu,
    createObjectsAtPoint,
    lines,
    images
  ]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (state.isDraggingObjects) {
      updateObjectDragging(pos);
    } else if (state.isSelecting) {
      updateDragSelection(pos);
    } else {
      // Handle hover detection using createObjectsAtPoint
      const hoveredObjects = createObjectsAtPoint(pos, lines, images);
      setHoveredObject(hoveredObjects.length > 0 ? hoveredObjects[0].id : null);
    }
  }, [
    state.isDraggingObjects,
    state.isSelecting,
    updateObjectDragging,
    updateDragSelection,
    setHoveredObject,
    createObjectsAtPoint,
    lines,
    images
  ]);

  // Handle mouse up
  const handleMouseUp = useCallback((e: KonvaEventObject<MouseEvent>) => {
    console.log('Select2: Mouse up, isDraggingObjects:', state.isDraggingObjects, 'isSelecting:', state.isSelecting);
    
    if (state.isDraggingObjects) {
      // Apply drag offset to selected objects
      if (state.dragOffset) {
        console.log('Select2: Applying drag offset:', state.dragOffset);
        state.selectedObjects.forEach(obj => {
          if (obj.type === 'line') {
            const line = lines.find(l => l.id === obj.id);
            if (line && state.dragOffset) {
              // Update line position - this would need to be connected to the actual update function
              console.log('Update line position:', line.id, {
                x: line.x + state.dragOffset.x,
                y: line.y + state.dragOffset.y
              });
            }
          } else if (obj.type === 'image') {
            const image = images.find(i => i.id === obj.id);
            if (image && state.dragOffset && updateImageState) {
              updateImageState(image.id, {
                x: image.x + state.dragOffset.x,
                y: image.y + state.dragOffset.y
              });
            }
          }
        });
      }
      endObjectDragging();
    } else if (state.isSelecting) {
      console.log('Select2: Ending drag selection');
      endDragSelection(lines, images);
    }
  }, [
    state.isDraggingObjects,
    state.isSelecting,
    state.selectedObjects,
    state.dragOffset,
    endObjectDragging,
    endDragSelection,
    updateImageState,
    lines,
    images
  ]);

  // Handle delete selected objects
  const handleDeleteSelected = useCallback(() => {
    console.log('Select2: Deleting selected objects:', state.selectedObjects);
    if (state.selectedObjects.length > 0 && deleteSelectedObjects) {
      deleteSelectedObjects(state.selectedObjects);
      clearSelection();
    }
  }, [state.selectedObjects, deleteSelectedObjects, clearSelection]);

  // Handle toggle lock for selected images
  const handleToggleLock = useCallback(() => {
    const selectedImages = state.selectedObjects
      .filter(obj => obj.type === 'image')
      .map(obj => images.find(img => img.id === obj.id))
      .filter(Boolean);

    if (selectedImages.length === 0) return;

    // Determine if we should lock or unlock
    const hasLockedImages = selectedImages.some(img => img?.locked);
    const hasUnlockedImages = selectedImages.some(img => !img?.locked);

    // If mixed state or all unlocked, lock all; if all locked, unlock all
    const shouldLock = hasUnlockedImages;

    selectedImages.forEach(image => {
      if (image && updateImageState) {
        updateImageState(image.id, { locked: shouldLock });
      }
    });
  }, [state.selectedObjects, images, updateImageState]);

  // Handle escape key to clear selection
  const handleEscape = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  return {
    selectionState: state,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDeleteSelected,
    handleToggleLock,
    handleEscape,
    handleDataChange,
    hideContextMenu
  };
};
