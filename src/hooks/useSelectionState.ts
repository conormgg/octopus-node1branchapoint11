import { useState, useCallback, useEffect } from 'react';
import { SelectionState, SelectedObject, SelectionBounds, LineObject, ImageObject, TransformationData } from '@/types/whiteboard';
import { useSelectionObjectPooling } from '@/hooks/performance/useSelectionObjectPooling';

export const useSelectionState = () => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedObjects: [],
    selectionBounds: null,
    isSelecting: false,
    transformationData: {}
  });
  
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);

  // Object pooling for temporary calculations
  const {
    createTempPoint,
    createTempBounds,
    createTempTransform,
    withPooledObjects,
    releaseAllObjects
  } = useSelectionObjectPooling();

  // Cleanup pooled objects on unmount
  useEffect(() => {
    return () => {
      releaseAllObjects();
    };
  }, [releaseAllObjects]);

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

  // Simplified hit detection for lines with basic bounding box check first
  const isPointOnLine = useCallback((point: { x: number; y: number }, line: LineObject, tolerance: number = 10): boolean => {
    const points = line.points;
    if (points.length < 4) return false;

    // Simple bounding box check first (more reliable)
    const minX = Math.min(...points.filter((_, i) => i % 2 === 0)) + line.x;
    const maxX = Math.max(...points.filter((_, i) => i % 2 === 0)) + line.x;
    const minY = Math.min(...points.filter((_, i) => i % 2 === 1)) + line.y; 
    const maxY = Math.max(...points.filter((_, i) => i % 2 === 1)) + line.y;
    
    const expandedTolerance = tolerance + (line.strokeWidth || 2) / 2;
    
    if (point.x < minX - expandedTolerance || point.x > maxX + expandedTolerance ||
        point.y < minY - expandedTolerance || point.y > maxY + expandedTolerance) {
      return false;
    }

    // If simple bounds check passes and no complex transformations, accept it
    if (!line.rotation || Math.abs(line.rotation) < 1) {
      return true;
    }

    // Only do complex transformation check if needed
    return withPooledObjects(() => {
      const rotationRad = (line.rotation || 0) * Math.PI / 180;
      const cosRotation = Math.cos(-rotationRad);
      const sinRotation = Math.sin(-rotationRad);
      
      const localPoint = createTempPoint();
      
      const translatedX = point.x - line.x;
      const translatedY = point.y - line.y;
      
      const rotatedX = translatedX * cosRotation - translatedY * sinRotation;
      const rotatedY = translatedX * sinRotation + translatedY * cosRotation;
      
      localPoint.x = rotatedX / (line.scaleX || 1);
      localPoint.y = rotatedY / (line.scaleY || 1);

      for (let i = 0; i < points.length - 2; i += 2) {
        const x1 = points[i];
        const y1 = points[i + 1];
        const x2 = points[i + 2];
        const y2 = points[i + 3];

        const A = localPoint.x - x1;
        const B = localPoint.y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) continue;

        let param = dot / lenSq;
        param = Math.max(0, Math.min(1, param));

        const xx = x1 + param * C;
        const yy = y1 + param * D;

        const dx = localPoint.x - xx;
        const dy = localPoint.y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= tolerance + (line.strokeWidth || 2) / 2) {
          return true;
        }
      }

      return false;
    });
  }, [withPooledObjects, createTempPoint]);

  // Hit detection for images with rotation support using pooled objects
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
    
    return withPooledObjects(() => {
      // For rotated images, transform the point to the image's local coordinate system
      const rotationRad = ((image as any).rotation || 0) * Math.PI / 180;
      const cosRotation = Math.cos(-rotationRad);
      const sinRotation = Math.sin(-rotationRad);
      
      // Use pooled point for calculations
      const localPoint = createTempPoint();
      
      // Translate point to origin relative to image's position
      const translatedX = point.x - image.x;
      const translatedY = point.y - image.y;
      
      // Rotate point around origin (inverse rotation)
      localPoint.x = translatedX * cosRotation - translatedY * sinRotation;
      localPoint.y = translatedX * sinRotation + translatedY * cosRotation;
      
      // Check if the rotated point is within the image bounds
      return localPoint.x >= 0 && 
             localPoint.x <= width && 
             localPoint.y >= 0 && 
             localPoint.y <= height;
    });
  }, [withPooledObjects, createTempPoint]);

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

  // Simplified findObjectsInBounds with better reliability
  const findObjectsInBounds = useCallback((
    bounds: SelectionBounds,
    lines: LineObject[],
    images: ImageObject[]
  ): SelectedObject[] => {
    const foundObjects: SelectedObject[] = [];
    
    console.log('[SelectionState] Finding objects in bounds:', bounds);
    console.log('[SelectionState] Checking', lines.length, 'lines and', images.length, 'images');

    // Check images with simple bounding box intersection first
    for (const image of images) {
      const imageWidth = image.width || 100;
      const imageHeight = image.height || 100;
      
      // Simple bounding box intersection
      const imageLeft = image.x;
      const imageRight = image.x + imageWidth;
      const imageTop = image.y;
      const imageBottom = image.y + imageHeight;
      
      const boundsLeft = bounds.x;
      const boundsRight = bounds.x + bounds.width;
      const boundsTop = bounds.y;
      const boundsBottom = bounds.y + bounds.height;
      
      // Check if rectangles overlap
      if (imageRight > boundsLeft && imageLeft < boundsRight &&
          imageBottom > boundsTop && imageTop < boundsBottom) {
        console.log('[SelectionState] Image intersects bounds:', image.id);
        foundObjects.push({ id: image.id, type: 'image' });
      }
    }

    // Check lines with simplified approach
    for (const line of lines) {
      const points = line.points;
      if (points.length < 4) continue;
      
      // Get line bounding box
      const lineMinX = Math.min(...points.filter((_, i) => i % 2 === 0)) + line.x;
      const lineMaxX = Math.max(...points.filter((_, i) => i % 2 === 0)) + line.x;
      const lineMinY = Math.min(...points.filter((_, i) => i % 2 === 1)) + line.y;
      const lineMaxY = Math.max(...points.filter((_, i) => i % 2 === 1)) + line.y;
      
      const boundsLeft = bounds.x;
      const boundsRight = bounds.x + bounds.width;
      const boundsTop = bounds.y;
      const boundsBottom = bounds.y + bounds.height;
      
      // Check if line bounding box intersects selection bounds
      if (lineMaxX > boundsLeft && lineMinX < boundsRight &&
          lineMaxY > boundsTop && lineMinY < boundsBottom) {
        console.log('[SelectionState] Line intersects bounds:', line.id);
        foundObjects.push({ id: line.id, type: 'line' });
      }
    }

    console.log('[SelectionState] Found', foundObjects.length, 'objects in bounds');
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

  // Calculate bounding box for selected objects using pooled objects
  const calculateSelectionBounds = useCallback((
    selectedObjects: SelectedObject[],
    lines: LineObject[],
    images: ImageObject[]
  ): SelectionBounds | null => {
    if (selectedObjects.length === 0) return null;
    
    return withPooledObjects(() => {
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
          const transformedPoint = createTempPoint();
          
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
          transformedPoint.x = rotatedX + line.x;
          transformedPoint.y = rotatedY + line.y;
          
          // Update bounds
          minX = Math.min(minX, transformedPoint.x);
          minY = Math.min(minY, transformedPoint.y);
          maxX = Math.max(maxX, transformedPoint.x);
          maxY = Math.max(maxY, transformedPoint.y);
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
        
        // For rotated images, check all corners using pooled objects
        const corners = [
          createTempPoint(0, 0),
          createTempPoint(width, 0),
          createTempPoint(width, height),
          createTempPoint(0, height)
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
    });
  }, [withPooledObjects, createTempPoint]);

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
    updateTransformationData,
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
