
import { useState, useCallback } from 'react';
import { LineObject, ImageObject, SelectedObject, SelectionBounds } from '@/types/whiteboard';

interface Select2State {
  selectedObjects: SelectedObject[];
  hoveredObjectId: string | null;
  isSelecting: boolean;
  selectionBounds: SelectionBounds | null;
  dragStartPoint: { x: number; y: number } | null;
  isDraggingObjects: boolean;
  dragOffset: { x: number; y: number } | null;
  groupBounds: SelectionBounds | null;
  contextMenuVisible: boolean;
  contextMenuPosition: { x: number; y: number } | null;
}

export const useSelect2State = () => {
  const [state, setState] = useState<Select2State>({
    selectedObjects: [],
    hoveredObjectId: null,
    isSelecting: false,
    selectionBounds: null,
    dragStartPoint: null,
    isDraggingObjects: false,
    dragOffset: null,
    groupBounds: null,
    contextMenuVisible: false,
    contextMenuPosition: null
  });

  // Calculate group bounds for selected objects
  const calculateGroupBounds = useCallback((
    selectedObjects: SelectedObject[],
    lines: LineObject[],
    images: ImageObject[]
  ): SelectionBounds | null => {
    if (selectedObjects.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    selectedObjects.forEach(obj => {
      if (obj.type === 'line') {
        const line = lines.find(l => l.id === obj.id);
        if (!line || line.points.length < 4) return;
        
        for (let i = 0; i < line.points.length; i += 2) {
          const x = line.points[i] + line.x;
          const y = line.points[i + 1] + line.y;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
        
        // Add padding for stroke width
        const padding = line.strokeWidth / 2 + 5;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;
      } else if (obj.type === 'image') {
        const image = images.find(i => i.id === obj.id);
        if (!image) return;
        
        minX = Math.min(minX, image.x);
        minY = Math.min(minY, image.y);
        maxX = Math.max(maxX, image.x + (image.width || 100));
        maxY = Math.max(maxY, image.y + (image.height || 100));
      }
    });

    if (minX === Infinity) return null;

    // Add some extra padding around the group bounds for better UX
    const extraPadding = 8;
    return {
      x: minX - extraPadding,
      y: minY - extraPadding,
      width: (maxX - minX) + (extraPadding * 2),
      height: (maxY - minY) + (extraPadding * 2)
    };
  }, []);

  // Update group bounds and context menu for currently selected objects
  const updateGroupBounds = useCallback((lines: LineObject[], images: ImageObject[]) => {
    setState(prev => {
      const newGroupBounds = calculateGroupBounds(prev.selectedObjects, lines, images);
      
      return {
        ...prev,
        groupBounds: newGroupBounds,
        contextMenuVisible: false, // Don't auto-show context menu
        contextMenuPosition: null
      };
    });
  }, [calculateGroupBounds]);

  // Start drag selection
  const startDragSelection = useCallback((point: { x: number; y: number }) => {
    console.log('Select2State: Starting drag selection at', point);
    setState(prev => ({
      ...prev,
      isSelecting: true,
      dragStartPoint: point,
      selectionBounds: {
        x: point.x,
        y: point.y,
        width: 0,
        height: 0
      },
      contextMenuVisible: false,
      contextMenuPosition: null
    }));
  }, []);

  // Update drag selection bounds
  const updateDragSelection = useCallback((currentPoint: { x: number; y: number }) => {
    setState(prev => {
      if (!prev.dragStartPoint) return prev;

      const bounds = {
        x: Math.min(prev.dragStartPoint.x, currentPoint.x),
        y: Math.min(prev.dragStartPoint.y, currentPoint.y),
        width: Math.abs(currentPoint.x - prev.dragStartPoint.x),
        height: Math.abs(currentPoint.y - prev.dragStartPoint.y)
      };

      return {
        ...prev,
        selectionBounds: bounds
      };
    });
  }, []);

  // Helper function to check if an object intersects with selection bounds
  const objectIntersectsSelectionBounds = useCallback((
    obj: SelectedObject,
    bounds: SelectionBounds,
    lines: LineObject[],
    images: ImageObject[]
  ): boolean => {
    if (obj.type === 'line') {
      const line = lines.find(l => l.id === obj.id);
      if (!line || line.points.length < 4) return false;

      // Check if any point of the line is within selection bounds
      for (let i = 0; i < line.points.length; i += 2) {
        const x = line.points[i] + line.x;
        const y = line.points[i + 1] + line.y;
        
        if (x >= bounds.x && x <= bounds.x + bounds.width &&
            y >= bounds.y && y <= bounds.y + bounds.height) {
          return true;
        }
      }
      return false;
    } else if (obj.type === 'image') {
      const image = images.find(i => i.id === obj.id);
      if (!image) return false;

      // Check if image bounds intersect with selection bounds
      return !(image.x > bounds.x + bounds.width ||
               image.x + (image.width || 100) < bounds.x ||
               image.y > bounds.y + bounds.height ||
               image.y + (image.height || 100) < bounds.y);
    }
    return false;
  }, []);

  // End drag selection and select intersecting objects
  const endDragSelection = useCallback((lines: LineObject[], images: ImageObject[]) => {
    console.log('Select2State: Ending drag selection');
    setState(prev => {
      if (!prev.selectionBounds || !prev.isSelecting) {
        console.log('Select2State: No selection bounds or not selecting, clearing state');
        return {
          ...prev,
          isSelecting: false,
          dragStartPoint: null,
          selectionBounds: null
        };
      }

      // Find all objects that intersect with selection bounds
      const allObjects: SelectedObject[] = [
        ...lines.map(line => ({ id: line.id, type: 'line' as const })),
        ...images.map(image => ({ id: image.id, type: 'image' as const }))
      ];

      const intersectingObjects = allObjects.filter(obj =>
        objectIntersectsSelectionBounds(obj, prev.selectionBounds!, lines, images)
      );

      console.log('Select2State: Found intersecting objects:', intersectingObjects);

      const newGroupBounds = calculateGroupBounds(intersectingObjects, lines, images);

      return {
        ...prev,
        selectedObjects: intersectingObjects,
        groupBounds: newGroupBounds,
        isSelecting: false,
        dragStartPoint: null,
        selectionBounds: null,
        contextMenuVisible: false,
        contextMenuPosition: null
      };
    });
  }, [objectIntersectsSelectionBounds, calculateGroupBounds]);

  // Start dragging selected objects
  const startDraggingObjects = useCallback((startPoint: { x: number; y: number }) => {
    console.log('Select2State: Starting object drag at', startPoint);
    setState(prev => ({
      ...prev,
      isDraggingObjects: true,
      dragStartPoint: startPoint,
      dragOffset: { x: 0, y: 0 },
      contextMenuVisible: false,
      contextMenuPosition: null
    }));
  }, []);

  // Update object dragging with proper offset calculation
  const updateObjectDragging = useCallback((currentPoint: { x: number; y: number }) => {
    setState(prev => {
      if (!prev.dragStartPoint || !prev.isDraggingObjects) return prev;

      const newOffset = {
        x: currentPoint.x - prev.dragStartPoint.x,
        y: currentPoint.y - prev.dragStartPoint.y
      };

      return {
        ...prev,
        dragOffset: newOffset
      };
    });
  }, []);

  // End object dragging
  const endObjectDragging = useCallback(() => {
    console.log('Select2State: Ending object drag');
    setState(prev => ({
      ...prev,
      isDraggingObjects: false,
      dragStartPoint: null,
      dragOffset: null
    }));
  }, []);

  // Create objects at point helper
  const createObjectsAtPoint = useCallback((
    point: { x: number; y: number },
    lines: LineObject[],
    images: ImageObject[]
  ): SelectedObject[] => {
    const objects: SelectedObject[] = [];
    
    // Check lines
    lines.forEach(line => {
      if (line.points.length < 4) return;
      
      // Simple point-in-stroke detection
      for (let i = 0; i < line.points.length - 2; i += 2) {
        const x1 = line.points[i] + line.x;
        const y1 = line.points[i + 1] + line.y;
        const x2 = line.points[i + 2] + line.x;
        const y2 = line.points[i + 3] + line.y;
        
        // Distance from point to line segment
        const distance = Math.abs((y2 - y1) * point.x - (x2 - x1) * point.y + x2 * y1 - y2 * x1) /
                        Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
        
        if (distance <= line.strokeWidth / 2 + 5) { // 5px tolerance
          objects.push({ id: line.id, type: 'line' });
          break;
        }
      }
    });
    
    // Check images
    images.forEach(image => {
      if (point.x >= image.x && point.x <= image.x + (image.width || 100) &&
          point.y >= image.y && point.y <= image.y + (image.height || 100)) {
        objects.push({ id: image.id, type: 'image' });
      }
    });
    
    return objects;
  }, []);

  // Select objects at a specific point
  const selectObjectsAtPoint = useCallback((
    point: { x: number; y: number },
    lines: LineObject[],
    images: ImageObject[],
    isCtrlPressed: boolean = false
  ) => {
    console.log('Select2State: Selecting objects at point', point);
    setState(prev => {
      const objectsAtPoint = createObjectsAtPoint(point, lines, images);
      
      if (objectsAtPoint.length === 0) {
        console.log('Select2State: No objects at point, clearing selection');
        // No objects at point, clear selection
        return {
          ...prev,
          selectedObjects: [],
          groupBounds: null,
          contextMenuVisible: false,
          contextMenuPosition: null
        };
      }
      
      let newSelection: SelectedObject[];
      
      if (isCtrlPressed) {
        // Multi-select mode
        const clickedObject = objectsAtPoint[0];
        const isAlreadySelected = prev.selectedObjects.some(obj => 
          obj.id === clickedObject.id && obj.type === clickedObject.type
        );
        
        if (isAlreadySelected) {
          // Remove from selection
          newSelection = prev.selectedObjects.filter(obj => 
            !(obj.id === clickedObject.id && obj.type === clickedObject.type)
          );
        } else {
          // Add to selection
          newSelection = [...prev.selectedObjects, clickedObject];
        }
      } else {
        // Single select mode - select the top-most object
        newSelection = [objectsAtPoint[0]];
      }
      
      console.log('Select2State: New selection:', newSelection);
      const newGroupBounds = calculateGroupBounds(newSelection, lines, images);
      
      return {
        ...prev,
        selectedObjects: newSelection,
        groupBounds: newGroupBounds,
        contextMenuVisible: false,
        contextMenuPosition: null
      };
    });
  }, [createObjectsAtPoint, calculateGroupBounds]);

  // Clear selection
  const clearSelection = useCallback(() => {
    console.log('Select2State: Clearing selection');
    setState(prev => ({
      ...prev,
      selectedObjects: [],
      groupBounds: null,
      isSelecting: false,
      selectionBounds: null,
      isDraggingObjects: false,
      dragOffset: null,
      dragStartPoint: null,
      contextMenuVisible: false,
      contextMenuPosition: null
    }));
  }, []);

  // Set hovered object
  const setHoveredObject = useCallback((objectId: string | null) => {
    setState(prev => ({
      ...prev,
      hoveredObjectId: objectId
    }));
  }, []);

  // Check if point is within group bounds
  const isPointInGroupBounds = useCallback((point: { x: number; y: number }): boolean => {
    if (!state.groupBounds) return false;
    
    return point.x >= state.groupBounds.x &&
           point.x <= state.groupBounds.x + state.groupBounds.width &&
           point.y >= state.groupBounds.y &&
           point.y <= state.groupBounds.y + state.groupBounds.height;
  }, [state.groupBounds]);

  // Hide context menu
  const hideContextMenu = useCallback(() => {
    setState(prev => ({
      ...prev,
      contextMenuVisible: false,
      contextMenuPosition: null
    }));
  }, []);

  return {
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
  };
};
