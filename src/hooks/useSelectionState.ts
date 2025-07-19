
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

  // Hit detection for lines with rotation support using pooled objects
  const isPointOnLine = useCallback((point: { x: number; y: number }, line: LineObject, tolerance: number = 10): boolean => {
    // Add null checks for line and its properties
    if (!line || !line.points || !Array.isArray(line.points) || line.points.length < 4) {
      console.log('[SelectionState] Invalid line object for hit detection:', { lineId: line?.id, hasPoints: !!line?.points, pointsLength: line?.points?.length });
      return false;
    }

    const points = line.points;

    return withPooledObjects(() => {
      // Apply inverse transformation to the point to get it in the line's local coordinate system
      // First handle rotation
      const rotationRad = (line.rotation || 0) * Math.PI / 180;
      const cosRotation = Math.cos(-rotationRad);
      const sinRotation = Math.sin(-rotationRad);
      
      // Use pooled point for calculations
      const localPoint = createTempPoint();
      
      // Translate point to origin relative to line's position
      const translatedX = point.x - (line.x || 0);
      const translatedY = point.y - (line.y || 0);
      
      // Rotate point around origin (inverse rotation)
      const rotatedX = translatedX * cosRotation - translatedY * sinRotation;
      const rotatedY = translatedX * sinRotation + translatedY * cosRotation;
      
      // Scale point (inverse scaling) - add null checks for scale properties
      localPoint.x = rotatedX / (line.scaleX || 1);
      localPoint.y = rotatedY / (line.scaleY || 1);

      // Check each line segment
      for (let i = 0; i < points.length - 2; i += 2) {
        const x1 = points[i];
        const y1 = points[i + 1];
        const x2 = points[i + 2];
        const y2 = points[i + 3];

        // Calculate distance from point to line segment
        const A = localPoint.x - x1;
        const B = localPoint.y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) continue; // Zero length segment

        let param = dot / lenSq;
        param = Math.max(0, Math.min(1, param)); // Clamp to segment

        const xx = x1 + param * C;
        const yy = y1 + param * D;

        const dx = localPoint.x - xx;
        const dy = localPoint.y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= tolerance + (line.strokeWidth || 1) / 2) {
          return true;
        }
      }

      return false;
    });
  }, [withPooledObjects, createTempPoint]);

  // Hit detection for images with rotation support using pooled objects
  const isPointOnImage = useCallback((point: { x: number; y: number }, image: ImageObject): boolean => {
    // Add null checks for image object
    if (!image || typeof image.x !== 'number' || typeof image.y !== 'number') {
      console.log('[SelectionState] Invalid image object for hit detection:', { imageId: image?.id, x: image?.x, y: image?.y });
      return false;
    }

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

    // Add null checks for arrays
    if (!Array.isArray(images)) {
      console.log('[SelectionState] Images array is not valid:', images);
    } else {
      // Check images first (they're typically on top)
      for (const image of images) {
        if (image && isPointOnImage(point, image)) {
          foundObjects.push({ id: image.id, type: 'image' });
        }
      }
    }

    if (!Array.isArray(lines)) {
      console.log('[SelectionState] Lines array is not valid:', lines);
    } else {
      // Check lines
      for (const line of lines) {
        if (line && isPointOnLine(point, line)) {
          foundObjects.push({ id: line.id, type: 'line' });
        }
      }
    }

    return foundObjects;
  }, [isPointOnLine, isPointOnImage]);

  // Find objects within selection bounds with transformation support using pooled objects
  const findObjectsInBounds = useCallback((
    bounds: SelectionBounds,
    lines: LineObject[],
    images: ImageObject[]
  ): SelectedObject[] => {
    return withPooledObjects(() => {
      const foundObjects: SelectedObject[] = [];

      // Add null checks for bounds and arrays
      if (!bounds || typeof bounds.x !== 'number' || typeof bounds.y !== 'number') {
        console.log('[SelectionState] Invalid bounds for findObjectsInBounds:', bounds);
        return foundObjects;
      }

      if (!Array.isArray(images)) {
        console.log('[SelectionState] Images array is not valid in findObjectsInBounds:', images);
      } else {
        // Check images
        for (const image of images) {
          if (!image || typeof image.x !== 'number' || typeof image.y !== 'number') {
            continue;
          }

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
          
          // For rotated images, check if any corner is within bounds using pooled objects
          const corners = [
            createTempPoint(image.x, image.y),
            createTempPoint(image.x + imageWidth, image.y),
            createTempPoint(image.x + imageWidth, image.y + imageHeight),
            createTempPoint(image.x, image.y + imageHeight)
          ];
          
          // Apply rotation to corners
          const rotationRad = ((image as any).rotation || 0) * Math.PI / 180;
          const cosRotation = Math.cos(rotationRad);
          const sinRotation = Math.sin(rotationRad);
          
          let anyCornerInBounds = false;
          for (const corner of corners) {
            // Translate to origin
            const translatedX = corner.x - image.x;
            const translatedY = corner.y - image.y;
            
            // Rotate
            const rotatedX = translatedX * cosRotation - translatedY * sinRotation;
            const rotatedY = translatedX * sinRotation + translatedY * cosRotation;
            
            // Translate back
            const finalX = rotatedX + image.x;
            const finalY = rotatedY + image.y;
            
            if (finalX >= bounds.x && 
                finalX <= bounds.x + bounds.width &&
                finalY >= bounds.y && 
                finalY <= bounds.y + bounds.height) {
              anyCornerInBounds = true;
              break;
            }
          }
          
          if (anyCornerInBounds) {
            foundObjects.push({ id: image.id, type: 'image' });
            continue;
          }
          
          // Check if bounds corners are within the rotated image
          const boundsCorners = [
            createTempPoint(bounds.x, bounds.y),
            createTempPoint(bounds.x + bounds.width, bounds.y),
            createTempPoint(bounds.x + bounds.width, bounds.y + bounds.height),
            createTempPoint(bounds.x, bounds.y + bounds.height)
          ];
          
          const anyBoundsCornerInImage = boundsCorners.some(corner => 
            isPointOnImage(corner, image)
          );
          
          if (anyBoundsCornerInImage) {
            foundObjects.push({ id: image.id, type: 'image' });
          }
        }
      }

      if (!Array.isArray(lines)) {
        console.log('[SelectionState] Lines array is not valid in findObjectsInBounds:', lines);
      } else {
        // Check lines with transformation support
        for (const line of lines) {
          if (!line || !line.points || !Array.isArray(line.points) || line.points.length < 2) {
            continue;
          }

          let lineInBounds = false;
          const points = line.points;
          
          // Apply transformation to each point using pooled objects
          for (let i = 0; i < points.length; i += 2) {
            const transformedPoint = createTempPoint();
            
            // Get point in local coordinates
            const localX = points[i];
            const localY = points[i + 1];
            
            // Apply scaling - add null checks
            const scaledX = localX * (line.scaleX || 1);
            const scaledY = localY * (line.scaleY || 1);
            
            // Apply rotation
            const rotationRad = (line.rotation || 0) * Math.PI / 180;
            const cosRotation = Math.cos(rotationRad);
            const sinRotation = Math.sin(rotationRad);
            
            const rotatedX = scaledX * cosRotation - scaledY * sinRotation;
            const rotatedY = scaledX * sinRotation + scaledY * cosRotation;
            
            // Apply translation
            transformedPoint.x = rotatedX + (line.x || 0);
            transformedPoint.y = rotatedY + (line.y || 0);
            
            // Check if point is within bounds
            if (transformedPoint.x >= bounds.x && transformedPoint.x <= bounds.x + bounds.width &&
                transformedPoint.y >= bounds.y && transformedPoint.y <= bounds.y + bounds.height) {
              lineInBounds = true;
              break;
            }
          }
          
          if (lineInBounds) {
            foundObjects.push({ id: line.id, type: 'line' });
          }
        }
      }

      return foundObjects;
    });
  }, [withPooledObjects, createTempPoint, isPointOnImage]);

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
    const allObjects: SelectedObject[] = [];
    
    if (Array.isArray(lines)) {
      allObjects.push(...lines.filter(line => line && line.id).map(line => ({ id: line.id, type: 'line' as const })));
    }
    
    if (Array.isArray(images)) {
      allObjects.push(...images.filter(image => image && image.id).map(image => ({ id: image.id, type: 'image' as const })));
    }
    
    selectObjects(allObjects);
  }, [selectObjects]);

  // Calculate bounding box for selected objects using pooled objects
  const calculateSelectionBounds = useCallback((
    selectedObjects: SelectedObject[],
    lines: LineObject[],
    images: ImageObject[]
  ): SelectionBounds | null => {
    if (!Array.isArray(selectedObjects) || selectedObjects.length === 0) {
      console.log('[SelectionState] No selected objects for bounds calculation');
      return null;
    }
    
    return withPooledObjects(() => {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      
      // Process selected lines
      const selectedLines = selectedObjects
        .filter(obj => obj && obj.type === 'line')
        .map(obj => Array.isArray(lines) ? lines.find(line => line && line.id === obj.id) : null)
        .filter(Boolean) as LineObject[];
        
      for (const line of selectedLines) {
        if (!line || !line.points || !Array.isArray(line.points) || line.points.length < 4) {
          console.log('[SelectionState] Skipping invalid line in bounds calculation:', { lineId: line?.id, hasPoints: !!line?.points, pointsLength: line?.points?.length });
          continue;
        }

        const points = line.points;
        
        for (let i = 0; i < points.length; i += 2) {
          const transformedPoint = createTempPoint();
          
          // Get point in local coordinates
          const localX = points[i];
          const localY = points[i + 1];
          
          // Apply scaling - add null checks
          const scaledX = localX * (line.scaleX || 1);
          const scaledY = localY * (line.scaleY || 1);
          
          // Apply rotation
          const rotationRad = (line.rotation || 0) * Math.PI / 180;
          const cosRotation = Math.cos(rotationRad);
          const sinRotation = Math.sin(rotationRad);
          
          const rotatedX = scaledX * cosRotation - scaledY * sinRotation;
          const rotatedY = scaledX * sinRotation + scaledY * cosRotation;
          
          // Apply translation
          transformedPoint.x = rotatedX + (line.x || 0);
          transformedPoint.y = rotatedY + (line.y || 0);
          
          // Update bounds
          minX = Math.min(minX, transformedPoint.x);
          minY = Math.min(minY, transformedPoint.y);
          maxX = Math.max(maxX, transformedPoint.x);
          maxY = Math.max(maxY, transformedPoint.y);
        }
      }
      
      // Process selected images
      const selectedImages = selectedObjects
        .filter(obj => obj && obj.type === 'image')
        .map(obj => Array.isArray(images) ? images.find(img => img && img.id === obj.id) : null)
        .filter(Boolean) as ImageObject[];
        
      for (const image of selectedImages) {
        if (!image || typeof image.x !== 'number' || typeof image.y !== 'number') {
          console.log('[SelectionState] Skipping invalid image in bounds calculation:', { imageId: image?.id, x: image?.x, y: image?.y });
          continue;
        }

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
        console.log('[SelectionState] No valid bounds calculated for selected objects');
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
    if (Array.isArray(selectedObjects) && selectedObjects.length > 0 && !selectionState.isSelecting) {
      const bounds = calculateSelectionBounds(selectedObjects, lines, images);
      setSelectionState(prev => ({
        ...prev,
        selectionBounds: bounds
      }));
    } else if (!Array.isArray(selectedObjects) || selectedObjects.length === 0) {
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
