import { useState, useCallback } from 'react';
import { SelectionState, SelectedObject, SelectionBounds, LineObject, ImageObject } from '@/types/whiteboard';

export const useSelectionState = () => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedObjects: [],
    selectionBounds: null,
    isSelecting: false
  });
  
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);

  // Select objects
  const selectObjects = useCallback((objects: SelectedObject[]) => {
    setSelectionState(prev => ({
      ...prev,
      selectedObjects: objects
    }));
  }, []);

  // Add object to selection
  const addToSelection = useCallback((object: SelectedObject) => {
    setSelectionState(prev => ({
      ...prev,
      selectedObjects: [...prev.selectedObjects.filter(obj => obj.id !== object.id), object]
    }));
  }, []);

  // Remove object from selection
  const removeFromSelection = useCallback((objectId: string) => {
    setSelectionState(prev => ({
      ...prev,
      selectedObjects: prev.selectedObjects.filter(obj => obj.id !== objectId)
    }));
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      selectedObjects: [],
      selectionBounds: null
    }));
  }, []);

  // Set selection bounds (for drag-to-select rectangle)
  const setSelectionBounds = useCallback((bounds: SelectionBounds | null) => {
    setSelectionState(prev => ({
      ...prev,
      selectionBounds: bounds
    }));
  }, []);

  // Set selecting state
  const setIsSelecting = useCallback((isSelecting: boolean) => {
    setSelectionState(prev => ({
      ...prev,
      isSelecting
    }));
  }, []);

  // Simplified hit detection for lines - only handles x, y positioning
  const isPointOnLine = useCallback((point: { x: number; y: number }, line: LineObject, tolerance: number = 10): boolean => {
    const points = line.points;
    if (points.length < 4) return false;

    // Check each line segment
    for (let i = 0; i < points.length - 2; i += 2) {
      const x1 = points[i] + line.x;
      const y1 = points[i + 1] + line.y;
      const x2 = points[i + 2] + line.x;
      const y2 = points[i + 3] + line.y;

      // Calculate distance from point to line segment
      const A = point.x - x1;
      const B = point.y - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      if (lenSq === 0) continue; // Zero length segment

      let param = dot / lenSq;
      param = Math.max(0, Math.min(1, param)); // Clamp to segment

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

  // Hit detection for images - handles center-based rotation
  const isPointOnImage = useCallback((point: { x: number; y: number }, image: ImageObject): boolean => {
    const width = image.width || 100;
    const height = image.height || 100;
    const rotation = image.rotation || 0;
    
    if (rotation === 0) {
      // No rotation - use simple bounds
      return point.x >= image.x && 
             point.x <= image.x + width && 
             point.y >= image.y && 
             point.y <= image.y + height;
    } else {
      // Handle rotation - transform point to image's local coordinate system
      const centerX = image.x + width / 2;
      const centerY = image.y + height / 2;
      const rad = (-rotation * Math.PI) / 180; // Negative for inverse transform
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      
      // Transform point to image's local coordinate system
      const localX = (point.x - centerX) * cos - (point.y - centerY) * sin;
      const localY = (point.x - centerX) * sin + (point.y - centerY) * cos;
      
      // Check if point is within image bounds in local coordinates
      return localX >= -width / 2 && 
             localX <= width / 2 && 
             localY >= -height / 2 && 
             localY <= height / 2;
    }
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

  // Simplified selection bounds detection - only handles basic x, y positioning
  const findObjectsInBounds = useCallback((
    bounds: SelectionBounds,
    lines: LineObject[],
    images: ImageObject[]
  ): SelectedObject[] => {
    const foundObjects: SelectedObject[] = [];

    // Check images - handle rotation for proper bounds intersection
    for (const image of images) {
      const imageWidth = image.width || 100;
      const imageHeight = image.height || 100;
      const rotation = image.rotation || 0;
      
      if (rotation === 0) {
        // No rotation - use simple bounds check
        if (image.x < bounds.x + bounds.width &&
            image.x + imageWidth > bounds.x &&
            image.y < bounds.y + bounds.height &&
            image.y + imageHeight > bounds.y) {
          foundObjects.push({ id: image.id, type: 'image' });
        }
      } else {
        // Handle rotation - check if any corner of rotated image intersects with bounds
        const centerX = image.x + imageWidth / 2;
        const centerY = image.y + imageHeight / 2;
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const corners = [
          { x: -imageWidth / 2, y: -imageHeight / 2 },
          { x: imageWidth / 2, y: -imageHeight / 2 },
          { x: imageWidth / 2, y: imageHeight / 2 },
          { x: -imageWidth / 2, y: imageHeight / 2 }
        ];
        
        let intersects = false;
        for (const corner of corners) {
          const rotatedX = centerX + (corner.x * cos - corner.y * sin);
          const rotatedY = centerY + (corner.x * sin + corner.y * cos);
          
          if (rotatedX >= bounds.x && rotatedX <= bounds.x + bounds.width &&
              rotatedY >= bounds.y && rotatedY <= bounds.y + bounds.height) {
            intersects = true;
            break;
          }
        }
        
        if (intersects) {
          foundObjects.push({ id: image.id, type: 'image' });
        }
      }
    }

    // Check lines - simplified: check if any point is within bounds
    for (const line of lines) {
      let lineInBounds = false;
      const points = line.points;
      
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

  // Check if object is selected
  const isObjectSelected = useCallback((objectId: string): boolean => {
    return selectionState.selectedObjects.some(obj => obj.id === objectId);
  }, [selectionState.selectedObjects]);

  // Get selected object IDs
  const getSelectedObjectIds = useCallback((): string[] => {
    return selectionState.selectedObjects.map(obj => obj.id);
  }, [selectionState.selectedObjects]);

  // Select all objects
  const selectAll = useCallback((lines: LineObject[], images: ImageObject[]) => {
    const allObjects: SelectedObject[] = [
      ...lines.map(line => ({ id: line.id, type: 'line' as const })),
      ...images.map(image => ({ id: image.id, type: 'image' as const }))
    ];
    
    selectObjects(allObjects);
  }, [selectObjects]);

  // Simplified selection bounds calculation - only handles basic x, y positioning
  const calculateSelectionBounds = useCallback((
    selectedObjects: SelectedObject[],
    lines: LineObject[],
    images: ImageObject[]
  ): SelectionBounds | null => {
    if (selectedObjects.length === 0) return null;
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    // Process selected lines
    const selectedLines = selectedObjects
      .filter(obj => obj.type === 'line')
      .map(obj => lines.find(line => line.id === obj.id))
      .filter(Boolean) as LineObject[];
      
    for (const line of selectedLines) {
      const points = line.points;
      
      for (let i = 0; i < points.length; i += 2) {
        const x = points[i] + line.x;
        const y = points[i + 1] + line.y;
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    
    // Process selected images
    const selectedImages = selectedObjects
      .filter(obj => obj.type === 'image')
      .map(obj => images.find(img => img.id === obj.id))
      .filter(Boolean) as ImageObject[];
      
    for (const image of selectedImages) {
      const width = image.width || 100;
      const height = image.height || 100;
      const rotation = image.rotation || 0;
      
      if (rotation === 0) {
        // No rotation - use simple bounds
        minX = Math.min(minX, image.x);
        minY = Math.min(minY, image.y);
        maxX = Math.max(maxX, image.x + width);
        maxY = Math.max(maxY, image.y + height);
      } else {
        // Handle rotation - calculate bounds from all four corners
        const centerX = image.x + width / 2;
        const centerY = image.y + height / 2;
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const corners = [
          { x: -width / 2, y: -height / 2 },
          { x: width / 2, y: -height / 2 },
          { x: width / 2, y: height / 2 },
          { x: -width / 2, y: height / 2 }
        ];
        
        for (const corner of corners) {
          const rotatedX = centerX + (corner.x * cos - corner.y * sin);
          const rotatedY = centerY + (corner.x * sin + corner.y * cos);
          
          minX = Math.min(minX, rotatedX);
          minY = Math.min(minY, rotatedY);
          maxX = Math.max(maxX, rotatedX);
          maxY = Math.max(maxY, rotatedY);
        }
      }
    }
    
    // If no objects were found or bounds are invalid
    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      return null;
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, []);

  // Check if a point is within the current selection bounds
  const isPointInSelectionBounds = useCallback((point: { x: number; y: number }): boolean => {
    if (!selectionState.selectionBounds || selectionState.selectedObjects.length === 0) {
      return false;
    }
    
    const bounds = selectionState.selectionBounds;
    return point.x >= bounds.x && 
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && 
           point.y <= bounds.y + bounds.height;
  }, [selectionState.selectionBounds, selectionState.selectedObjects]);

  // Update selection state from history (for undo/redo)
  const updateSelectionState = useCallback((newSelectionState: SelectionState) => {
    setSelectionState(newSelectionState);
  }, []);

  // Auto-update selection bounds when objects are selected (but not during drag-to-select)
  const updateSelectionBounds = useCallback((
    selectedObjects: SelectedObject[],
    lines: LineObject[],
    images: ImageObject[]
  ) => {
    if (selectedObjects.length > 0 && !selectionState.isSelecting) {
      const bounds = calculateSelectionBounds(selectedObjects, lines, images);
      setSelectionState(prev => ({
        ...prev,
        selectionBounds: bounds
      }));
    } else if (selectedObjects.length === 0) {
      setSelectionState(prev => ({
        ...prev,
        selectionBounds: null
      }));
    }
  }, [calculateSelectionBounds, selectionState.isSelecting]);

  return {
    selectionState,
    selectObjects,
    addToSelection,
    removeFromSelection,
    clearSelection,
    setSelectionBounds,
    setIsSelecting,
    updateSelectionState,
    findObjectsAtPoint,
    findObjectsInBounds,
    isObjectSelected,
    getSelectedObjectIds,
    selectAll,
    calculateSelectionBounds,
    isPointInSelectionBounds,
    updateSelectionBounds,
    hoveredObjectId,
    setHoveredObjectId
  };
};