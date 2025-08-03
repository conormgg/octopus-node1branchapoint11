
import { useCallback, useRef, useEffect } from 'react';
import Konva from 'konva';
import { LineObject, ImageObject, SelectedObject } from '@/types/whiteboard';
import { useSelect2State } from './useSelect2State';
import { useStageCoordinates } from './useStageCoordinates';
import { useSelect2Transform } from './useSelect2Transform';
import { useTransformHandleDetection } from './useTransformHandleDetection';

interface UseSelect2EventHandlersProps {
  stageRef: React.RefObject<Konva.Stage>;
  lines: LineObject[];
  images: ImageObject[];
  panZoomState: { x: number; y: number; scale: number };
  panZoom: any; // panZoom object with isGestureActive method
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
  panZoom,
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
    isObjectLocked,
    setState,
    showContextMenu,
    hideContextMenu,
    startTransform,
    updateTransform,
    endTransform,
    cancelTransform
  } = useSelect2State();

  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);
  const transform = useSelect2Transform();
  const handleDetection = useTransformHandleDetection(panZoomState.scale);

  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const transformStartRef = useRef<{ x: number; y: number } | null>(null);
  const isTransformingRef = useRef(false);
  const hoveredHandleRef = useRef<string | null>(null);

  // Helper function to sync selection with main state
  const syncSelectionWithMainState = useCallback((selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => {
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

  // Check if point is on any selected object OR within group bounds OR on transform handles
  const isPointOnSelectedObject = useCallback((point: { x: number; y: number }) => {
    // Priority 1: Check if we're on a transform handle (extends beyond selection bounds)
    if (state.selectedObjects.length > 0 && state.groupBounds) {
      const handle = handleDetection.getHandleAtPoint(point, state.groupBounds);
      if (handle) {
        return true; // Transform handles count as "on selected object"
      }
    }
    
    // Priority 2: Check if we're within the group bounds (for easy dragging)
    if (state.selectedObjects.length > 0 && isPointInGroupBounds(point)) {
      return true;
    }
    
    // Priority 3: Fallback - check if clicking directly on a selected object
    const objectsAtPoint = findObjectsAtPoint(point, lines, images);
    return objectsAtPoint.some(obj => 
      state.selectedObjects.some(selected => selected.id === obj.id)
    );
  }, [findObjectsAtPoint, lines, images, state.selectedObjects, isPointInGroupBounds, state.groupBounds, handleDetection]);

  // FIXED: Apply drag offset with proper coordinate handling - now ensures single application and respects locked state
  const applyDragOffset = useCallback(() => {
    if (!state.dragOffset || (!onUpdateLine && !onUpdateImage)) return;

    const { x: dx, y: dy } = state.dragOffset;

    console.log('Select2: Applying drag offset', { dx, dy, selectedCount: state.selectedObjects.length });

    // Apply offset to objects - single application only, skip locked objects
    state.selectedObjects.forEach(obj => {
      // Check if object is locked before applying updates
      if (isObjectLocked(obj.id, obj.type, lines, images)) {
        console.log('Select2: Skipping locked object', { id: obj.id, type: obj.type });
        return;
      }

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

  // Stage 2: Store selected objects in ref to preserve them during transform
  const selectedObjectsRef = useRef<SelectedObject[]>([]);
  
  // Keep the ref in sync with state
  useEffect(() => {
    selectedObjectsRef.current = state.selectedObjects;
  }, [state.selectedObjects]);

  // ENHANCED: Prioritize transform handle detection with immediate bounds calculation
  const handlePointerDown = useCallback((worldX: number, worldY: number, ctrlKey: boolean = false, button: number = 0) => {
    if (panZoom.isGestureActive() || button !== 0) {
      return; // Ignore gestures and non-left clicks
    }

    const worldPoint = { x: worldX, y: worldY };
    console.log('Select2: Pointer down - entry', { worldPoint, ctrlKey, isTransforming: state.isTransforming });

    // --- PRIORITY 1: Transform Handle Detection (Fully Preemptive) ---
    if (state.selectedObjects.length > 0) {
      // Calculate fresh bounds immediately to avoid stale state
      const freshGroupBounds = calculateGroupBounds(state.selectedObjects, lines, images);
      
      if (freshGroupBounds) {
        const handle = handleDetection.getHandleAtPoint(worldPoint, freshGroupBounds);
        
        if (handle) {
          console.log('Select2: TRANSFORM MODE ACTIVATED', { 
            handleType: handle.type, 
            groupBounds: freshGroupBounds,
            selectedCount: state.selectedObjects.length 
          });
          
          // Preserve selection state for transform
          selectedObjectsRef.current = [...state.selectedObjects];
          isTransformingRef.current = true;
          transformStartRef.current = worldPoint;
          
          const mode = handle.type === 'rotate' ? 'rotate' : 'resize';
          startTransform(mode, handle.type, freshGroupBounds);
          
          console.log('Select2: Transform initiated successfully', { mode, anchor: handle.type, startPoint: worldPoint });
          return; // CRITICAL: Immediate return - no other logic runs
        }
      }
    }

    console.log('Select2: No transform handle detected, proceeding with drag/selection logic');

    // --- PRIORITY 2: Drag/Selection Logic ---
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPositionRef.current = worldPoint;

    // Check if clicking on an already selected object or its group bounds
    if (isPointOnSelectedObject(worldPoint)) {
      const hasLockedObjects = state.selectedObjects.some(obj => isObjectLocked(obj.id, obj.type, lines, images));
      if (!hasLockedObjects) {
        console.log('Select2: Initiating drag for selected objects');
        startDraggingObjects(worldPoint);
      } else {
        console.log('Select2: Drag prevented, selection contains locked objects');
      }
      return;
    }

    // Check if clicking on a new, unselected object
    const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
    if (objectsAtPoint.length > 0) {
      console.log('Select2: Selecting new object at point');
      selectObjectsAtPoint(worldPoint, lines, images, ctrlKey);
      syncSelectionWithMainState(state.selectedObjects); // Sync with the updated selection
      ensureContainerFocus();
    } else {
      // Clicking on empty space, start drag selection
      console.log('Select2: Initiating drag selection');
      if (!ctrlKey) {
        clearSelection();
        clearMainSelection();
      }
      startDragSelection(worldPoint);
      syncSelectionBoundsWithMainState({ x: worldX, y: worldY, width: 0, height: 0 }, true);
    }
  }, [
    panZoom, 
    state.selectedObjects, 
    state.isTransforming,
    calculateGroupBounds,
    handleDetection, 
    startTransform, 
    isPointOnSelectedObject, 
    isObjectLocked, 
    lines, 
    images, 
    startDraggingObjects, 
    findObjectsAtPoint, 
    selectObjectsAtPoint, 
    clearSelection, 
    startDragSelection, 
    syncSelectionWithMainState, 
    clearMainSelection, 
    syncSelectionBoundsWithMainState, 
    ensureContainerFocus
  ]);

  const handlePointerMove = useCallback((worldX: number, worldY: number) => {
    // Ignore pointer events during pan/zoom gestures
    if (panZoom.isGestureActive()) {
      return;
    }

    const worldPoint = { x: worldX, y: worldY };

    // STAGE 4: Use proper transform matrix operations instead of inline calculations
    if (isTransformingRef.current && transformStartRef.current && state.initialTransformBounds) {
      console.log('Select2: Transform move detected', { 
        worldPoint, 
        transformStart: transformStartRef.current, 
        mode: state.transformMode,
        anchor: state.transformAnchor 
      });

      const { transformMode, transformAnchor, initialTransformBounds } = state;
      
      if (transformMode === 'resize' && transformAnchor) {
        // Use simpler direct bounds calculation for resize operations
        const dx = worldPoint.x - transformStartRef.current.x;
        const dy = worldPoint.y - transformStartRef.current.y;
        
        let newBounds = { ...initialTransformBounds };
        
        // Apply resize logic based on handle type
        switch (transformAnchor) {
          case 'nw':
            newBounds.x += dx;
            newBounds.y += dy;
            newBounds.width -= dx;
            newBounds.height -= dy;
            break;
          case 'ne':
            newBounds.y += dy;
            newBounds.width += dx;
            newBounds.height -= dy;
            break;
          case 'se':
            newBounds.width += dx;
            newBounds.height += dy;
            break;
          case 'sw':
            newBounds.x += dx;
            newBounds.width -= dx;
            newBounds.height += dy;
            break;
          case 'n':
            newBounds.y += dy;
            newBounds.height -= dy;
            break;
          case 's':
            newBounds.height += dy;
            break;
          case 'e':
            newBounds.width += dx;
            break;
          case 'w':
            newBounds.x += dx;
            newBounds.width -= dx;
            break;
        }
        
        // Apply minimum size constraints
        const minSize = 10;
        if (newBounds.width < minSize) {
          if (transformAnchor.includes('w')) {
            newBounds.x = newBounds.x + newBounds.width - minSize;
          }
          newBounds.width = minSize;
        }
        if (newBounds.height < minSize) {
          if (transformAnchor.includes('n')) {
            newBounds.y = newBounds.y + newBounds.height - minSize;
          }
          newBounds.height = minSize;
        }

        console.log('Select2: Transform bounds calculated', { 
          original: initialTransformBounds, 
          new: newBounds,
          anchor: transformAnchor,
          delta: { dx, dy }
        });
        
        updateTransform(newBounds);
      } else if (transformMode === 'rotate') {
        const centerX = initialTransformBounds.x + initialTransformBounds.width / 2;
        const centerY = initialTransformBounds.y + initialTransformBounds.height / 2;
        
        let angle = Math.atan2(
          worldPoint.y - centerY,
          worldPoint.x - centerX
        ) * (180 / Math.PI);

        // Apply rotation snapping
        angle = transform.snapRotation(angle);
        
        console.log('Select2: Rotation calculated', { angle, center: { x: centerX, y: centerY } });
        
        // For rotation, bounds stay the same but rotation changes
        // This will trigger the Select2Renderer to show rotated preview
        updateTransform(initialTransformBounds, angle);
      }
      return; // CRITICAL: Early return prevents drag operations during transform
    }

    // STAGE 2: Separate state paths - only process drag if NOT transforming
    if (isDraggingRef.current && !state.isTransforming) {
      hasMovedRef.current = true;
      
      if (state.isDraggingObjects && !state.isTransforming) {
        console.log('Select2: Updating object drag', { 
          worldPoint,
          dragStartPosition: dragStartPositionRef.current,
          currentOffset: state.dragOffset,
          isTransforming: state.isTransforming
        });
        updateObjectDragging(worldPoint);
      } else if (state.isSelecting && !state.isTransforming) {
        console.log('Select2: Updating drag selection', { worldPoint, isTransforming: state.isTransforming });
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
    } else if (state.isTransforming) {
      console.log('Select2: Drag operations blocked - transform in progress');
    } else {
      // STAGE 6: Enhanced cursor feedback for transform handles
      if (!isDraggingRef.current && state.selectedObjects.length > 0 && !state.isTransforming) {
        const handle = handleDetection.getHandleAtPoint(worldPoint, state.groupBounds);
        const newHoveredHandle = handle?.type || null;
        
        if (hoveredHandleRef.current !== newHoveredHandle) {
          hoveredHandleRef.current = newHoveredHandle;
          
          const cursor = handle ? handle.cursor : 'default';
          if (stageRef.current) {
            stageRef.current.container().style.cursor = cursor;
          }
          
          console.log('Select2: Handle hover state changed', { 
            handleType: newHoveredHandle, 
            cursor,
            isTransforming: state.isTransforming 
          });
        }
      } else {
        // Update hover feedback for objects
        const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
        const hoveredId = objectsAtPoint.length > 0 ? objectsAtPoint[0].id : null;
        setHoveredObject(hoveredId);
      }
    }
  }, [panZoom, state, updateObjectDragging, updateDragSelection, findObjectsAtPoint, setHoveredObject, lines, images, syncSelectionBoundsWithMainState, stageRef, handleDetection, transform]);

  const handlePointerUp = useCallback(() => {
    // Ignore pointer events during pan/zoom gestures
    if (panZoom.isGestureActive()) {
      return;
    }

    console.log('Select2: Pointer up', { 
      wasDragging: isDraggingRef.current,
      hasMoved: hasMovedRef.current,
      isDraggingObjects: state.isDraggingObjects,
      dragOffset: state.dragOffset,
      isTransforming: isTransformingRef.current
    });

    // Handle transform end first (highest priority)
    if (isTransformingRef.current) {
      console.log('Select2: Transform operation ended', {
        selectedObjectsCount: state.selectedObjects.length,
        selectedObjectIds: state.selectedObjects.map(obj => obj.id)
      });
      isTransformingRef.current = false;
      transformStartRef.current = null;
      
      // Apply the transform to actual objects using matrix-based calculations (same as preview)
      if (state.currentTransformBounds && state.initialTransformBounds) {
        const initialBounds = state.initialTransformBounds;
        const currentBounds = state.currentTransformBounds;
        
        // Calculate transform matrix (same method as preview)
        const matrix = transform.calculateTransformMatrix(
          initialBounds,
          currentBounds,
          state.transformRotation || 0
        );
        
        // Calculate group center for transform origin (same as preview)
        const groupCenter = {
          x: initialBounds.x + initialBounds.width / 2,
          y: initialBounds.y + initialBounds.height / 2
        };
        
        // STAGE 2: Use preserved selectedObjects from ref if state is cleared
        const currentSelectedObjects = state.selectedObjects.length > 0 ? state.selectedObjects : selectedObjectsRef.current;
        
        console.log('Select2: Applying matrix-based transform to objects', { 
          initialBounds, 
          currentBounds,
          matrix,
          groupCenter,
          objectCount: currentSelectedObjects.length,
          selectedObjectIds: currentSelectedObjects.map(obj => obj.id)
        });
        
        currentSelectedObjects.forEach(obj => {
          if (isObjectLocked(obj.id, obj.type, lines, images)) {
            console.log('Select2: Skipping locked object during transform', { id: obj.id, type: obj.type });
            return; // Skip locked objects
          }
          
          // Use the same transform calculation as the preview
          const transformedBounds = transform.transformObjectBounds(obj, lines, images, groupCenter, matrix);
          if (!transformedBounds) return;
          
          if (obj.type === 'line' && onUpdateLine) {
            const line = lines.find(l => l.id === obj.id);
            if (line) {
              console.log('Select2: Transforming line with matrix', { 
                id: obj.id, 
                from: { x: line.x, y: line.y, strokeWidth: line.strokeWidth },
                to: { x: transformedBounds.x, y: transformedBounds.y, strokeWidth: transformedBounds.strokeWidth }
              });
              
              onUpdateLine(obj.id, { 
                x: transformedBounds.x, 
                y: transformedBounds.y,
                points: transformedBounds.points,
                strokeWidth: transformedBounds.strokeWidth 
              });
            }
          } else if (obj.type === 'image' && onUpdateImage) {
            const image = images.find(i => i.id === obj.id);
            if (image) {
              console.log('Select2: Transforming image with matrix', { 
                id: obj.id, 
                from: { x: image.x, y: image.y, w: image.width, h: image.height },
                to: { x: transformedBounds.x, y: transformedBounds.y, w: transformedBounds.width, h: transformedBounds.height }
              });
              
              onUpdateImage(obj.id, { 
                x: transformedBounds.x, 
                y: transformedBounds.y, 
                width: Math.max(10, transformedBounds.width), 
                height: Math.max(10, transformedBounds.height) 
              });
            }
          }
        });
        
        // Update group bounds after transform
        setTimeout(() => {
          updateGroupBounds(lines, images);
        }, 0);
      }
      
      endTransform();
      console.log('Transform ended');
      
      // Reset cursor
      if (stageRef.current) {
        stageRef.current.container().style.cursor = 'default';
      }
      hoveredHandleRef.current = null;
      return; // Early return for transform operations
    }
    
    // Handle drag operations only if we were actually dragging and not transforming
    if (isDraggingRef.current && !isTransformingRef.current) {
      if (state.isDraggingObjects && hasMovedRef.current) {
        // Apply the drag offset to actually move the objects - single application
        console.log('Select2: Applying final drag offset');
        applyDragOffset();
        endObjectDragging();
      } else if (state.isSelecting && hasMovedRef.current) {
        // Complete drag selection
        console.log('Select2: Ending drag selection operation');
        const selectedObjects = endDragSelection(lines, images);
        // Sync with main selection state
        syncSelectionWithMainState(selectedObjects);
        syncSelectionBoundsWithMainState(null, false);
        // Ensure container has focus for keyboard events after drag selection
        ensureContainerFocus();
      }
    }
    
    // Reset dragging state only if not transforming
    isDraggingRef.current = false;
    hasMovedRef.current = false;
    dragStartPositionRef.current = null;
  }, [panZoom, state.isDraggingObjects, state.isSelecting, state.dragOffset, applyDragOffset, endObjectDragging, endDragSelection, lines, images, ensureContainerFocus, syncSelectionWithMainState, syncSelectionBoundsWithMainState, transform, onUpdateLine, onUpdateImage, isObjectLocked, updateGroupBounds, endTransform, stageRef]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // Only handle left mouse button (0) for selection, ignore right-click (2) for panning
    if (e.evt.button !== 0) {
      console.log('Select2: Ignoring non-left-click mouse event', { button: e.evt.button });
      return;
    }

    const worldPoint = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPositionRef.current = worldPoint;

    // Check if clicking on a selected object or within group bounds first
    if (isPointOnSelectedObject(worldPoint)) {
      // Check if any selected objects are locked before allowing drag
      const hasLockedObjects = state.selectedObjects.some(obj => 
        isObjectLocked(obj.id, obj.type, lines, images)
      );
      
      if (hasLockedObjects) {
        console.log('Select2: Cannot drag - selection contains locked objects');
        return;
      }
      
      // Start dragging selected objects
      startDraggingObjects(worldPoint);
      return;
    }

    // Check if clicking on an object
    const objectsAtPoint = findObjectsAtPoint(worldPoint, lines, images);
    
    if (objectsAtPoint.length > 0) {
      // Clicking on an object
      selectObjectsAtPoint(worldPoint, lines, images, e.evt.ctrlKey);
      // Sync with main selection state
      const newSelection = e.evt.ctrlKey ? 
        [...state.selectedObjects, objectsAtPoint[0]] : 
        [objectsAtPoint[0]];
      syncSelectionWithMainState(newSelection);
      // Ensure container has focus for keyboard events
      ensureContainerFocus();
    } else {
      // Clicking on empty space - start drag selection
      if (!e.evt.ctrlKey) {
        clearSelection();
        clearMainSelection();
      }
      startDragSelection(worldPoint);
      syncSelectionBoundsWithMainState({ x: worldPoint.x, y: worldPoint.y, width: 0, height: 0 }, true);
    }
  }, [getRelativePointerPosition, isPointOnSelectedObject, startDraggingObjects, findObjectsAtPoint, selectObjectsAtPoint, clearSelection, startDragSelection, lines, images, ensureContainerFocus, state.selectedObjects, syncSelectionWithMainState, clearMainSelection, syncSelectionBoundsWithMainState]);

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
        // Sync with main selection bounds
        if (state.selectionBounds) {
          const newBounds = {
            x: Math.min(state.selectionBounds.x, worldPoint.x),
            y: Math.min(state.selectionBounds.y, worldPoint.y),
            width: Math.abs(worldPoint.x - state.selectionBounds.x),
            height: Math.abs(worldPoint.y - state.selectionBounds.y)
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
  }, [getRelativePointerPosition, state.isDraggingObjects, state.isSelecting, state.selectionBounds, updateObjectDragging, updateDragSelection, findObjectsAtPoint, setHoveredObject, lines, images, syncSelectionBoundsWithMainState]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDraggingRef.current) {
      if (state.isDraggingObjects && hasMovedRef.current) {
        // Apply the drag offset to actually move the objects
        applyDragOffset();
        endObjectDragging();
      } else if (state.isSelecting && hasMovedRef.current) {
        // Complete drag selection
        const selectedObjects = endDragSelection(lines, images);
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
  }, [state.isDraggingObjects, state.isSelecting, applyDragOffset, endObjectDragging, endDragSelection, lines, images, ensureContainerFocus, syncSelectionWithMainState, syncSelectionBoundsWithMainState]);

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

  // Simplified delete functionality - just use select2 state directly
  const deleteSelectedObjects = useCallback(() => {
    if (state.selectedObjects.length === 0 || !onDeleteObjects) return;

    console.log(`Deleting ${state.selectedObjects.length} selected objects via select2`);
    
    // Use the unified delete function with select2 selected objects
    onDeleteObjects(state.selectedObjects);

    // Clear select2 selection (main selection clearing is handled by unified function)
    clearSelection();
  }, [state.selectedObjects, onDeleteObjects, clearSelection]);

  return {
    select2State: state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleStageClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearSelection: clearSelection,
    deleteSelectedObjects,
    showContextMenu: (containerRef?: React.RefObject<HTMLElement>) => {
      // Use the showContextMenu from useSelect2State with proper parameters
      if (state.selectedObjects.length > 0) {
        showContextMenu(containerRef, stageRef, panZoomState);
      }
    },
    hideContextMenu,
    // Transform handlers (deprecated - now handled in main pointer events)
    handleTransformHandleMouseDown: () => {
      // This is now handled in the main pointer down handler
    },
    handleTransformMouseMove: (worldPoint: { x: number; y: number }, ctrlKey = false, shiftKey = false, altKey = false) => {
      if (!isTransformingRef.current || !transformStartRef.current || !state.initialTransformBounds) {
        return;
      }

      const { transformMode, transformAnchor, initialTransformBounds } = state;
      
      if (transformMode === 'resize' && transformAnchor) {
        // Calculate new bounds based on handle type and movement
        const dx = worldPoint.x - transformStartRef.current.x;
        const dy = worldPoint.y - transformStartRef.current.y;
        
        let newBounds = { ...initialTransformBounds };
        
        // Apply resize logic based on handle type
        switch (transformAnchor) {
          case 'nw':
            newBounds.x += dx;
            newBounds.y += dy;
            newBounds.width -= dx;
            newBounds.height -= dy;
            break;
          case 'ne':
            newBounds.y += dy;
            newBounds.width += dx;
            newBounds.height -= dy;
            break;
          case 'se':
            newBounds.width += dx;
            newBounds.height += dy;
            break;
          case 'sw':
            newBounds.x += dx;
            newBounds.width -= dx;
            newBounds.height += dy;
            break;
          case 'n':
            newBounds.y += dy;
            newBounds.height -= dy;
            break;
          case 's':
            newBounds.height += dy;
            break;
          case 'e':
            newBounds.width += dx;
            break;
          case 'w':
            newBounds.x += dx;
            newBounds.width -= dx;
            break;
        }
        
        // Apply keyboard modifiers
        if (shiftKey) {
          // Maintain aspect ratio
          const aspectRatio = initialTransformBounds.width / initialTransformBounds.height;
          if (Math.abs(newBounds.width - initialTransformBounds.width) > Math.abs(newBounds.height - initialTransformBounds.height)) {
            newBounds.height = newBounds.width / aspectRatio;
          } else {
            newBounds.width = newBounds.height * aspectRatio;
          }
        }
        
        if (altKey) {
          // Transform from center
          const centerX = initialTransformBounds.x + initialTransformBounds.width / 2;
          const centerY = initialTransformBounds.y + initialTransformBounds.height / 2;
          newBounds.x = centerX - newBounds.width / 2;
          newBounds.y = centerY - newBounds.height / 2;
        }
        
        // Apply minimum size constraints
        const minSize = 10;
        if (newBounds.width < minSize) {
          if (transformAnchor.includes('w')) {
            newBounds.x = newBounds.x + newBounds.width - minSize;
          }
          newBounds.width = minSize;
        }
        if (newBounds.height < minSize) {
          if (transformAnchor.includes('n')) {
            newBounds.y = newBounds.y + newBounds.height - minSize;
          }
          newBounds.height = minSize;
        }
        
        updateTransform(newBounds);
        
      } else if (transformMode === 'rotate') {
        // Calculate rotation angle
        const centerX = initialTransformBounds.x + initialTransformBounds.width / 2;
        const centerY = initialTransformBounds.y + initialTransformBounds.height / 2;
        
        let angle = Math.atan2(
          worldPoint.y - centerY,
          worldPoint.x - centerX
        ) * (180 / Math.PI);
        
        // Apply Ctrl modifier for 15-degree snapping
        if (ctrlKey) {
          angle = transform.snapRotation(angle);
        }
        
        updateTransform(initialTransformBounds, angle);
      }
    },
    handleTransformMouseUp: () => {
      if (!isTransformingRef.current) return;
      
      isTransformingRef.current = false;
      transformStartRef.current = null;
      
      // Apply the transform to actual objects using direct bounds updates
      if (state.currentTransformBounds && state.initialTransformBounds) {
        const initialBounds = state.initialTransformBounds;
        const finalBounds = state.currentTransformBounds;
        
        // Calculate scale factors
        const scaleX = finalBounds.width / initialBounds.width;
        const scaleY = finalBounds.height / initialBounds.height;
        
        state.selectedObjects.forEach(obj => {
          if (isObjectLocked(obj.id, obj.type, lines, images)) {
            return; // Skip locked objects
          }
          
          if (obj.type === 'line' && onUpdateLine) {
            const line = lines.find(l => l.id === obj.id);
            if (line) {
              // Calculate new line position and scale
              const newX = finalBounds.x + ((line.x - initialBounds.x) * scaleX);
              const newY = finalBounds.y + ((line.y - initialBounds.y) * scaleY);
              const newStrokeWidth = Math.max(1, line.strokeWidth * Math.min(scaleX, scaleY));
              
              onUpdateLine(obj.id, { 
                x: newX, 
                y: newY, 
                strokeWidth: newStrokeWidth 
              });
            }
          } else if (obj.type === 'image' && onUpdateImage) {
            const image = images.find(i => i.id === obj.id);
            if (image) {
              // Calculate new image position and size
              const newX = finalBounds.x + ((image.x - initialBounds.x) * scaleX);
              const newY = finalBounds.y + ((image.y - initialBounds.y) * scaleY);
              const newWidth = (image.width || 100) * scaleX;
              const newHeight = (image.height || 100) * scaleY;
              
              onUpdateImage(obj.id, { 
                x: newX, 
                y: newY, 
                width: Math.max(10, newWidth), 
                height: Math.max(10, newHeight) 
              });
            }
          }
        });
        
        // Update group bounds after transform
        setTimeout(() => {
          updateGroupBounds(lines, images);
        }, 0);
      }
      
      endTransform();
      console.log('Transform ended');
    }
  };
};
