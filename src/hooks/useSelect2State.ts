import { useState, useCallback } from 'react';
import { LineObject, ImageObject, SelectedObject, SelectionBounds } from '@/types/whiteboard';

interface Select2State {
  selectedObjects: SelectedObject[];
  hoveredObjectId: string | null;
  isSelecting: boolean;
  selectionBounds: SelectionBounds | null;
  dragStartPoint: { x: number; y: number } | null;
}

export const useSelect2State = () => {
  const [state, setState] = useState<Select2State>({
    selectedObjects: [],
    hoveredObjectId: null,
    isSelecting: false,
    selectionBounds: null,
    dragStartPoint: null
  });

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
  const endDragSelection = useCallback((lines: LineObject[], images: ImageObject[]) => {
    setState(prev => {
      if (!prev.selectionBounds) {
        return {
          ...prev,
          isSelecting: false,
          dragStartPoint: null
        };
      }

      const objectsInBounds = findObjectsInBounds(prev.selectionBounds, lines, images);

      return {
        ...prev,
        selectedObjects: objectsInBounds,
        isSelecting: false,
        dragStartPoint: null,
        selectionBounds: null
      };
    });
  }, [findObjectsInBounds]);

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
        return {
          ...prev,
          selectedObjects: multiSelect ? prev.selectedObjects : []
        };
      }

      const firstObject = objectsAtPoint[0];

      if (multiSelect) {
        // Toggle selection for multi-select
        const isAlreadySelected = prev.selectedObjects.some(obj => obj.id === firstObject.id);
        if (isAlreadySelected) {
          return {
            ...prev,
            selectedObjects: prev.selectedObjects.filter(obj => obj.id !== firstObject.id)
          };
        } else {
          return {
            ...prev,
            selectedObjects: [...prev.selectedObjects, firstObject]
          };
        }
      } else {
        // Single select
        return {
          ...prev,
          selectedObjects: [firstObject]
        };
      }
    });
  }, [findObjectsAtPoint]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedObjects: [],
      hoveredObjectId: null,
      selectionBounds: null
    }));
  }, []);

  // Set hovered object
  const setHoveredObject = useCallback((objectId: string | null) => {
    setState(prev => ({
      ...prev,
      hoveredObjectId: objectId
    }));
  }, []);

  return {
    state,
    startDragSelection,
    updateDragSelection,
    endDragSelection,
    selectObjectsAtPoint,
    clearSelection,
    setHoveredObject,
    findObjectsAtPoint
  };
};