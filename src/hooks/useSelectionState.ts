import { useState, useCallback, useEffect } from 'react';
import { SelectionState, SelectedObject, SelectionBounds, LineObject, ImageObject, TransformationData } from '@/types/whiteboard';

export const useSelectionState = () => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedObjects: [],
    selectionBounds: null,
    isSelecting: false,
    transformationData: {}
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
      selectionBounds: null,
      transformationData: {}
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

  // Update transformation data for an object
  const updateTransformationData = useCallback((objectId: string, transformation: TransformationData) => {
    setSelectionState(prev => ({
      ...prev,
      transformationData: {
        ...prev.transformationData,
        [objectId]: transformation
      }
    }));
  }, []);

  // Hit detection for lines with rotation support
  const isPointOnLine = useCallback((point: { x: number; y: number }, line: LineObject, tolerance: number = 10): boolean => {
    const points = line.points;
    if (points.length < 4) return false;

    // Apply inverse transformation to the point to get it in the line's local coordinate system
    // First handle rotation
    const rotationRad = (line.rotation || 0) * Math.PI / 180;
    const cosRotation = Math.cos(-rotationRad);
    const sinRotation = Math.sin(-rotationRad);
    
    // Translate point to origin relative to line's position
    const translatedX = point.x - line.x;
    const translatedY = point.y - line.y;
    
    // Rotate point around origin (inverse rotation)
    const rotatedX = translatedX * cosRotation - translatedY * sinRotation;
    const rotatedY = translatedX * sinRotation + translatedY * cosRotation;
    
    // Scale point (inverse scaling)
    const localX = rotatedX / line.scaleX;
    const localY = rotatedY / line.scaleY;

    // Check each line segment
    for (let i = 0; i < points.length - 2; i += 2) {
      const x1 = points[i];
      const y1 = points[i + 1];
      const x2 = points[i + 2];
      const y2 = points[i + 3];

      // Calculate distance from point to line segment
      const A = localX - x1;
      const B = localY - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      
      if (lenSq === 0) continue; // Zero length segment

      let param = dot / lenSq;
      param = Math.max(0, Math.min(1, param)); // Clamp to segment

      const xx = x1 + param * C;
      const yy = y1 + param * D;

      const dx = localX - xx;
      const dy = localY - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= tolerance + line.strokeWidth / 2) {
        return true;
      }
    }

    return false;
  }, []);

  // Hit detection for images with rotation support
  const isPointOnImage = useCallback((point: { x: number; y: number }, image: ImageObject): boolean => {
    const width = image.width || 100;
    const height = image.height || 100;
    
    // If no rotation, use simple bounding box check
    if (!(image as any).rotation) {
      return point.x >= image.x && 
             point.x <= image.x + width && 
             point.y >= image.y && 
             point.y <= image.y + height;
    }
    
    // For rotated images, transform the point to the image's local coordinate system
    const rotationRad = ((image as any).rotation || 0) * Math.PI / 180;
    const cosRotation = Math.cos(-rotationRad);
    const sinRotation = Math.sin(-rotationRad);
    
    // Translate point to origin relative to image's position
    const translatedX = point.x - image.x;
    const translatedY = point.y - image.y;
    
    // Rotate point around origin (inverse rotation)
    const rotatedX = translatedX * cosRotation - translatedY * sinRotation;
    const rotatedY = translatedX * sinRotation + translatedY * cosRotation;
    
    // Check if the rotated point is within the image bounds
    return rotatedX >= 0 && 
           rotatedX <= width && 
           rotatedY >= 0 && 
           rotatedY <= height;
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

  // Find objects within selection bounds with transformation support
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
      
      // For non-rotated images, use simple bounding box check
      if (!(image as any).rotation) {
        if (image.x < bounds.x + bounds.width &&
            image.x + imageWidth > bounds.x &&
            image.y < bounds.y + bounds.height &&
            image.y + imageHeight > bounds.y) {
          foundObjects.push({ id: image.id, type: 'image' });
        }
        continue;
      }
      
      // For rotated images, check if any corner is within bounds
      // or if the bounds intersect with the image
      const corners = [
        { x: image.x, y: image.y },
        { x: image.x + imageWidth, y: image.y },
        { x: image.x + imageWidth, y: image.y + imageHeight },
        { x: image.x, y: image.y + imageHeight }
      ];
      
      // Apply rotation to corners
      const rotationRad = ((image as any).rotation || 0) * Math.PI / 180;
      const cosRotation = Math.cos(rotationRad);
      const sinRotation = Math.sin(rotationRad);
      
      const rotatedCorners = corners.map(corner => {
        // Translate to origin
        const translatedX = corner.x - image.x;
        const translatedY = corner.y - image.y;
        
        // Rotate
        const rotatedX = translatedX * cosRotation - translatedY * sinRotation;
        const rotatedY = translatedX * sinRotation + translatedY * cosRotation;
        
        // Translate back
        return {
          x: rotatedX + image.x,
          y: rotatedY + image.y
        };
      });
      
      // Check if any corner is within bounds
      const anyCornerInBounds = rotatedCorners.some(corner => 
        corner.x >= bounds.x && 
        corner.x <= bounds.x + bounds.width &&
        corner.y >= bounds.y && 
        corner.y <= bounds.y + bounds.height
      );
      
      if (anyCornerInBounds) {
        foundObjects.push({ id: image.id, type: 'image' });
        continue;
      }
      
      // Check if bounds corners are within the rotated image
      // This handles the case where the selection is inside the image
      const boundsCorners = [
        { x: bounds.x, y: bounds.y },
        { x: bounds.x + bounds.width, y: bounds.y },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        { x: bounds.x, y: bounds.y + bounds.height }
      ];
      
      const anyBoundsCornerInImage = boundsCorners.some(corner => 
        isPointOnImage(corner, image)
      );
      
      if (anyBoundsCornerInImage) {
        foundObjects.push({ id: image.id, type: 'image' });
      }
    }

    // Check lines with transformation support
    for (const line of lines) {
      let lineInBounds = false;
      const points = line.points;
      
      // Apply transformation to each point
      for (let i = 0; i < points.length; i += 2) {
        // Get point in local coordinates
        const localX = points[i];
        const localY = points[i + 1];
        
        // Apply scaling
        const scaledX = localX * line.scaleX;
        const scaledY = localY * line.scaleY;
        
        // Apply rotation
        const rotationRad = (line.rotation || 0) * Math.PI / 180;
        const cosRotation = Math.cos(rotationRad);
        const sinRotation = Math.sin(rotationRad);
        
        const rotatedX = scaledX * cosRotation - scaledY * sinRotation;
        const rotatedY = scaledX * sinRotation + scaledY * cosRotation;
        
        // Apply translation
        const x = rotatedX + line.x;
        const y = rotatedY + line.y;
        
        // Check if point is within bounds
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
  }, [isPointOnImage]);

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

  // Group dragging state
  const [groupDragState, setGroupDragState] = useState<{
    isDragging: boolean;
    draggedObjectId: string | null;
    initialPositions: Record<string, { x: number; y: number }>;
  }>({
    isDragging: false,
    draggedObjectId: null,
    initialPositions: {}
  });

  // Start group drag
  const startGroupDrag = useCallback((draggedObjectId: string, lines: LineObject[], images: ImageObject[]) => {
    if (selectionState.selectedObjects.length <= 1) return;

    const initialPositions: Record<string, { x: number; y: number }> = {};
    
    // Store initial positions of all selected objects
    selectionState.selectedObjects.forEach(obj => {
      if (obj.type === 'line') {
        const line = lines.find(l => l.id === obj.id);
        if (line) {
          initialPositions[obj.id] = { x: line.x, y: line.y };
        }
      } else if (obj.type === 'image') {
        const image = images.find(i => i.id === obj.id);
        if (image) {
          initialPositions[obj.id] = { x: image.x, y: image.y };
        }
      }
    });

    setGroupDragState({
      isDragging: true,
      draggedObjectId,
      initialPositions
    });
  }, [selectionState.selectedObjects]);

  // End group drag
  const endGroupDrag = useCallback(() => {
    setGroupDragState({
      isDragging: false,
      draggedObjectId: null,
      initialPositions: {}
    });
  }, []);

  // Calculate group drag delta
  const calculateGroupDragDelta = useCallback((draggedObjectId: string, newX: number, newY: number) => {
    if (!groupDragState.isDragging || groupDragState.draggedObjectId !== draggedObjectId) {
      return null;
    }

    const initialPos = groupDragState.initialPositions[draggedObjectId];
    if (!initialPos) return null;

    return {
      deltaX: newX - initialPos.x,
      deltaY: newY - initialPos.y
    };
  }, [groupDragState]);

  // Calculate bounding box for selected objects
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
        // Get point in local coordinates
        const localX = points[i];
        const localY = points[i + 1];
        
        // Apply scaling
        const scaledX = localX * line.scaleX;
        const scaledY = localY * line.scaleY;
        
        // Apply rotation
        const rotationRad = (line.rotation || 0) * Math.PI / 180;
        const cosRotation = Math.cos(rotationRad);
        const sinRotation = Math.sin(rotationRad);
        
        const rotatedX = scaledX * cosRotation - scaledY * sinRotation;
        const rotatedY = scaledX * sinRotation + scaledY * cosRotation;
        
        // Apply translation
        const x = rotatedX + line.x;
        const y = rotatedY + line.y;
        
        // Update bounds
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
      
      // For non-rotated images
      if (!(image as any).rotation) {
        minX = Math.min(minX, image.x);
        minY = Math.min(minY, image.y);
        maxX = Math.max(maxX, image.x + width);
        maxY = Math.max(maxY, image.y + height);
        continue;
      }
      
      // For rotated images, check all corners
      const corners = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height }
      ];
      
      // Apply rotation to corners
      const rotationRad = ((image as any).rotation || 0) * Math.PI / 180;
      const cosRotation = Math.cos(rotationRad);
      const sinRotation = Math.sin(rotationRad);
      
      for (const corner of corners) {
        // Rotate
        const rotatedX = corner.x * cosRotation - corner.y * sinRotation;
        const rotatedY = corner.x * sinRotation + corner.y * cosRotation;
        
        // Translate
        const x = rotatedX + image.x;
        const y = rotatedY + image.y;
        
        // Update bounds
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
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

  // Sync selection bounds with selected objects
  useEffect(() => {
    if (selectionState.selectedObjects.length > 0 && !selectionState.isSelecting) {
      // We'll implement this when we have access to the lines and images
      // This is just a placeholder for now
    }
  }, [selectionState.selectedObjects, selectionState.isSelecting]);

  return {
    selectionState,
    selectObjects,
    addToSelection,
    removeFromSelection,
    clearSelection,
    setSelectionBounds,
    setIsSelecting,
    updateTransformationData,
    findObjectsAtPoint,
    findObjectsInBounds,
    isObjectSelected,
    getSelectedObjectIds,
    selectAll,
    calculateSelectionBounds,
    hoveredObjectId,
    setHoveredObjectId,
    groupDragState,
    startGroupDrag,
    endGroupDrag,
    calculateGroupDragDelta
  };
};
