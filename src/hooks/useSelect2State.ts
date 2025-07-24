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
  contextMenu: {
    isVisible: boolean;
    x: number;
    y: number;
  };
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
    contextMenu: {
      isVisible: false,
      x: 0,
      y: 0
    }
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
        
        const width = image.width || 100;
        const height = image.height || 100;
        minX = Math.min(minX, image.x);
        minY = Math.min(minY, image.y);
        maxX = Math.max(maxX, image.x + width);
        maxY = Math.max(maxY, image.y + height);
      }
    });

    if (minX === Infinity) return null;

    // Add extra padding for easier interaction
    const extraPadding = 10;
    return {
      x: minX - extraPadding,
      y: minY - extraPadding,
      width: (maxX - minX) + (extraPadding * 2),
      height: (maxY - minY) + (extraPadding * 2)
    };
  }, []);

  // Update group bounds for currently selected objects
  const updateGroupBounds = useCallback((lines: LineObject[], images: ImageObject[]) => {
    setState(prev => {
      const newGroupBounds = calculateGroupBounds(prev.selectedObjects, lines, images);
      return {
        ...prev,
        groupBounds: newGroupBounds
      };
    });
  }, [calculateGroupBounds]);

  // Check if point is within group bounds
  const isPointInGroupBounds = useCallback((point: { x: number; y: number }): boolean => {
    if (!state.groupBounds) return false;
    
    return point.x >= state.groupBounds.x && 
           point.x <= state.groupBounds.x + state.groupBounds.width && 
           point.y >= state.groupBounds.y && 
           point.y <= state.groupBounds.y + state.groupBounds.height;
  }, [state.groupBounds]);

  // Simple hit detection for lines
  const isPointOnLine = useCallback((point: { x: number; y: number }, line: LineObject): boolean => {
    const tolerance = 10;
    const points = line.points;
    if (points.length < 4) return false;

    // Simplified hit detection - check distance to each line segment
    for (let i = 0; i < points.length - 2; i += 2) {
      const x1 = points[i] + line.x;
      const y1 = points[i + 1] + line.y;
      const x2 = points[i + 2] + line.x;
      const y2 = points[i + 3] + line.y;

      const A = point.x - x1;
      const B = point.y - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      if (lenSq === 0) continue;

      let param = dot / lenSq;
      param = Math.max(0, Math.min(1, param));

      const xx = x1 + param * C;
      const yy = y1 + param * D;

      const dx = point.x - xx;
      const dy = point.y - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= tolerance + line.strokeWidth / 2) {
        return true;
      }
    }

    return false;
  }, []);

  // Simple hit detection for images
  const isPointOnImage = useCallback((point: { x: number; y: number }, image: ImageObject): boolean => {
    const width = image.width || 100;
    const height = image.height || 100;
    
    return point.x >= image.x && 
           point.x <= image.x + width && 
           point.y >= image.y && 
           point.y <= image.y + height;
  }, []);

  // Find objects at point
  const findObjectsAtPoint = useCallback((
    point: { x: number; y: number }, 
    lines: LineObject[], 
    images: ImageObject[]
  ): SelectedObject[] => {
    const foundObjects: SelectedObject[] = [];

    // Check images first (they're typically on top)
    for (const image of images) {
      if (isPointOnImage(point, image)) {
        foundObjects.push({ id: image.id, type: 'image' });
      }
    }

    // Check lines
    for (const line of lines) {
      if (isPointOnLine(point, line)) {
        foundObjects.push({ id: line.id, type: 'line' });
      }
    }

    return foundObjects;
  }, [isPointOnLine, isPointOnImage]);

  // Find objects within selection bounds
  const findObjectsInBounds = useCallback((
    bounds: SelectionBounds,
    lines: LineObject[],
    images: ImageObject[]
  ): SelectedObject[] => {
    const foundObjects: SelectedObject[] = [];

    // Check images
    for (const image of images) {
      const imageWidth = image.width || 100;
      const imageHeight = image.height || 100;
      
      if (image.x < bounds.x + bounds.width &&
          image.x + imageWidth > bounds.x &&
          image.y < bounds.y + bounds.height &&
          image.y + imageHeight > bounds.y) {
        foundObjects.push({ id: image.id, type: 'image' });
      }
    }

    // Check lines - simplified: check if any point is within bounds
    for (const line of lines) {
      const points = line.points;
      let lineInBounds = false;
      
      for (let i = 0; i < points.length; i += 2) {
        const x = points[i] + line.x;
        const y = points[i + 1] + line.y;
        
        if (x >= bounds.x && x <= bounds.x + bounds.width &&
            y >= bounds.y && y <= bounds.y + bounds.height) {
          lineInBounds = true;
          break;
        }
      }
      
      if (lineInBounds) {
        foundObjects.push({ id: line.id, type: 'line' });
      }
    }

    return foundObjects;
  }, []);

  // Start drag selection
  const startDragSelection = useCallback((point: { x: number; y: number }) => {
    setState(prev => ({
      ...prev,
      isSelecting: true,
      dragStartPoint: point,
      selectionBounds: {
        x: point.x,
        y: point.y,
        width: 0,
        height: 0
      }
    }));
  }, []);

  // Update drag selection
  const updateDragSelection = useCallback((point: { x: number; y: number }) => {
    setState(prev => {
      if (!prev.dragStartPoint) return prev;

      const x = Math.min(prev.dragStartPoint.x, point.x);
      const y = Math.min(prev.dragStartPoint.y, point.y);
      const width = Math.abs(point.x - prev.dragStartPoint.x);
      const height = Math.abs(point.y - prev.dragStartPoint.y);

      return {
        ...prev,
        selectionBounds: { x, y, width, height }
      };
    });
  }, []);

  // End drag selection
  const endDragSelection = useCallback((lines: LineObject[], images: ImageObject[]): SelectedObject[] => {
    let selectedObjects: SelectedObject[] = [];
    
    setState(prev => {
      if (!prev.selectionBounds) {
        selectedObjects = [];
        return {
          ...prev,
          isSelecting: false,
          dragStartPoint: null
        };
      }

      const objectsInBounds = findObjectsInBounds(prev.selectionBounds, lines, images);
      const groupBounds = calculateGroupBounds(objectsInBounds, lines, images);
      
      selectedObjects = objectsInBounds;

      return {
        ...prev,
        selectedObjects: objectsInBounds,
        groupBounds,
        isSelecting: false,
        dragStartPoint: null,
        selectionBounds: null
      };
    });
    
    return selectedObjects;
  }, [findObjectsInBounds, calculateGroupBounds]);

  // Start dragging objects
  const startDraggingObjects = useCallback((point: { x: number; y: number }) => {
    setState(prev => ({
      ...prev,
      isDraggingObjects: true,
      dragStartPoint: point,
      dragOffset: { x: 0, y: 0 }
    }));
  }, []);

  // Update object dragging
  const updateObjectDragging = useCallback((point: { x: number; y: number }) => {
    setState(prev => {
      if (!prev.dragStartPoint || !prev.isDraggingObjects) return prev;

      const dragOffset = {
        x: point.x - prev.dragStartPoint.x,
        y: point.y - prev.dragStartPoint.y
      };

      return {
        ...prev,
        dragOffset
      };
    });
  }, []);

  // End object dragging
  const endObjectDragging = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDraggingObjects: false,
      dragStartPoint: null,
      dragOffset: null
    }));
  }, []);

  // Select objects at point
  const selectObjectsAtPoint = useCallback((
    point: { x: number; y: number },
    lines: LineObject[],
    images: ImageObject[],
    multiSelect: boolean = false
  ) => {
    const objectsAtPoint = findObjectsAtPoint(point, lines, images);
    
    setState(prev => {
      if (objectsAtPoint.length === 0) {
        // Clicked on empty space
        const newSelectedObjects = multiSelect ? prev.selectedObjects : [];
        const groupBounds = calculateGroupBounds(newSelectedObjects, lines, images);
        return {
          ...prev,
          selectedObjects: newSelectedObjects,
          groupBounds,
          // Hide context menu when selection is cleared
          contextMenu: {
            ...prev.contextMenu,
            isVisible: false
          }
        };
      }

      const firstObject = objectsAtPoint[0];

      if (multiSelect) {
        // Toggle selection for multi-select
        const isAlreadySelected = prev.selectedObjects.some(obj => obj.id === firstObject.id);
        const newSelectedObjects = isAlreadySelected
          ? prev.selectedObjects.filter(obj => obj.id !== firstObject.id)
          : [...prev.selectedObjects, firstObject];
        
        const groupBounds = calculateGroupBounds(newSelectedObjects, lines, images);
        return {
          ...prev,
          selectedObjects: newSelectedObjects,
          groupBounds,
          // Hide context menu when multi-selection changes
          contextMenu: {
            ...prev.contextMenu,
            isVisible: false
          }
        };
      } else {
        // Single select
        const newSelectedObjects = [firstObject];
        const groupBounds = calculateGroupBounds(newSelectedObjects, lines, images);
        return {
          ...prev,
          selectedObjects: newSelectedObjects,
          groupBounds,
          // Hide context menu when selection changes
          contextMenu: {
            ...prev.contextMenu,
            isVisible: false
          }
        };
      }
    });
  }, [findObjectsAtPoint, calculateGroupBounds]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedObjects: [],
      hoveredObjectId: null,
      selectionBounds: null,
      groupBounds: null,
      contextMenu: {
        ...prev.contextMenu,
        isVisible: false
      }
    }));
  }, []);

  // Set hovered object
  const setHoveredObject = useCallback((objectId: string | null) => {
    setState(prev => ({
      ...prev,
      hoveredObjectId: objectId
    }));
  }, []);

  // Calculate context menu position based on selection bounds or group bounds
  const calculateContextMenuPosition = useCallback((
    selectionBounds: SelectionBounds | null,
    groupBounds: SelectionBounds | null,
    containerRef?: React.RefObject<HTMLElement>
  ) => {
    const bounds = groupBounds || selectionBounds;
    if (!bounds) return { x: 0, y: 0 };

    const menuWidth = 200; // Approximate menu width
    const menuHeight = 120; // Approximate menu height
    const offset = 10; // Distance from selection

    // Default position: bottom-right of selection
    let x = bounds.x + bounds.width + offset;
    let y = bounds.y;

    // Adjust if menu would go off-screen
    if (containerRef?.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // If menu would overflow right, position to the left
      if (x + menuWidth > containerWidth) {
        x = bounds.x - menuWidth - offset;
      }

      // If menu would overflow bottom, position above
      if (y + menuHeight > containerHeight) {
        y = bounds.y + bounds.height - menuHeight;
      }

      // Ensure menu doesn't go off left edge
      if (x < 0) {
        x = bounds.x + bounds.width / 2;
      }

      // Ensure menu doesn't go off top edge
      if (y < 0) {
        y = offset;
      }
    }

    return { x, y };
  }, []);

  // Show context menu
  const showContextMenu = useCallback((containerRef?: React.RefObject<HTMLElement>) => {
    setState(prev => {
      if (prev.selectedObjects.length === 0) return prev;

      const position = calculateContextMenuPosition(
        prev.selectionBounds,
        prev.groupBounds,
        containerRef
      );

      return {
        ...prev,
        contextMenu: {
          isVisible: true,
          x: position.x,
          y: position.y
        }
      };
    });
  }, [calculateContextMenuPosition]);

  // Hide context menu
  const hideContextMenu = useCallback(() => {
    setState(prev => ({
      ...prev,
      contextMenu: {
        ...prev.contextMenu,
        isVisible: false
      }
    }));
  }, []);

  // Update context menu position (useful when selection bounds change)
  const updateContextMenuPosition = useCallback((containerRef?: React.RefObject<HTMLElement>) => {
    setState(prev => {
      if (!prev.contextMenu.isVisible) return prev;

      const position = calculateContextMenuPosition(
        prev.selectionBounds,
        prev.groupBounds,
        containerRef
      );

      return {
        ...prev,
        contextMenu: {
          ...prev.contextMenu,
          x: position.x,
          y: position.y
        }
      };
    });
  }, [calculateContextMenuPosition]);

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
    findObjectsAtPoint,
    calculateGroupBounds,
    updateGroupBounds,
    isPointInGroupBounds,
    showContextMenu,
    hideContextMenu,
    updateContextMenuPosition
  };
};
