import React, { useState, useCallback } from 'react';
import Konva from 'konva';
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
  // Transform state
  isTransforming: boolean;
  transformMode: 'resize' | 'rotate' | null;
  transformAnchor: string | null;
  initialTransformBounds: SelectionBounds | null;
  currentTransformBounds: SelectionBounds | null;
  transformRotation: number;
  transformGroupRotation: number;
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
    },
    // Transform state
    isTransforming: false,
    transformMode: null,
    transformAnchor: null,
    initialTransformBounds: null,
    currentTransformBounds: null,
    transformRotation: 0,
    transformGroupRotation: 0
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
        const rotation = image.rotation || 0;
        
        if (rotation === 0) {
          // No rotation, simple bounds calculation
          minX = Math.min(minX, image.x);
          minY = Math.min(minY, image.y);
          maxX = Math.max(maxX, image.x + width);
          maxY = Math.max(maxY, image.y + height);
        } else {
          // Calculate rotated bounds
          const centerX = image.x + width / 2;
          const centerY = image.y + height / 2;
          const rad = (rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          
          // Calculate the four corners of the rotated rectangle
          const corners = [
            { x: -width / 2, y: -height / 2 },
            { x: width / 2, y: -height / 2 },
            { x: width / 2, y: height / 2 },
            { x: -width / 2, y: height / 2 }
          ];
          
          corners.forEach(corner => {
            const rotatedX = corner.x * cos - corner.y * sin + centerX;
            const rotatedY = corner.x * sin + corner.y * cos + centerY;
            minX = Math.min(minX, rotatedX);
            minY = Math.min(minY, rotatedY);
            maxX = Math.max(maxX, rotatedX);
            maxY = Math.max(maxY, rotatedY);
          });
        }
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
  // Calculate group rotation for selected objects
  const calculateGroupRotation = useCallback((
    selectedObjects: SelectedObject[],
    images: ImageObject[]
  ): number => {
    if (selectedObjects.length === 0) return 0;
    
    // If only one image is selected, use its rotation
    if (selectedObjects.length === 1 && selectedObjects[0].type === 'image') {
      const image = images.find(i => i.id === selectedObjects[0].id);
      return image?.rotation || 0;
    }
    
    // For multiple objects or mixed types, use average rotation of images
    const imageRotations = selectedObjects
      .filter(obj => obj.type === 'image')
      .map(obj => {
        const image = images.find(i => i.id === obj.id);
        return image?.rotation || 0;
      });
    
    if (imageRotations.length === 0) return 0;
    
    // Calculate average rotation
    const avgRotation = imageRotations.reduce((sum, rot) => sum + rot, 0) / imageRotations.length;
    return avgRotation;
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

  // Hit detection for images (handles rotation)
  const isPointOnImage = useCallback((point: { x: number; y: number }, image: ImageObject): boolean => {
    const width = image.width || 100;
    const height = image.height || 100;
    const rotation = image.rotation || 0;
    
    // If no rotation, use simple bounds check
    if (rotation === 0) {
      return point.x >= image.x && 
             point.x <= image.x + width && 
             point.y >= image.y && 
             point.y <= image.y + height;
    }
    
    // For rotated images, transform the point to image's local coordinate system
    const centerX = image.x + width / 2;
    const centerY = image.y + height / 2;
    
    // Translate point to be relative to image center
    const relativeX = point.x - centerX;
    const relativeY = point.y - centerY;
    
    // Apply inverse rotation to get point in image's local coordinates
    const rad = (-rotation * Math.PI) / 180; // Negative for inverse rotation
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    const localX = relativeX * cos - relativeY * sin;
    const localY = relativeX * sin + relativeY * cos;
    
    // Check if the local point is within the unrotated image bounds
    return localX >= -width / 2 && 
           localX <= width / 2 && 
           localY >= -height / 2 && 
           localY <= height / 2;
  }, []);

  // Helper function to check if an object is locked
  const isObjectLocked = useCallback((
    objectId: string,
    objectType: 'line' | 'image',
    lines: LineObject[],
    images: ImageObject[]
  ): boolean => {
    if (objectType === 'image') {
      const image = images.find(img => img.id === objectId);
      return image?.locked === true;
    }
    // Lines don't have locked property currently
    return false;
  }, []);

  // Find objects at point (including locked objects for selection)
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

    // Check lines (lines don't have locked property currently)
    for (const line of lines) {
      if (isPointOnLine(point, line)) {
        foundObjects.push({ id: line.id, type: 'line' });
      }
    }

    return foundObjects;
  }, [isPointOnLine, isPointOnImage]);

  // Find objects within selection bounds (including locked objects for selection)
  const findObjectsInBounds = useCallback((
    bounds: SelectionBounds,
    lines: LineObject[],
    images: ImageObject[]
  ): SelectedObject[] => {
    const foundObjects: SelectedObject[] = [];

    // Check images (handles rotation)
    for (const image of images) {
      const imageWidth = image.width || 100;
      const imageHeight = image.height || 100;
      const rotation = image.rotation || 0;
      
      if (rotation === 0) {
        // Simple rectangular bounds check for non-rotated images
        if (image.x < bounds.x + bounds.width &&
            image.x + imageWidth > bounds.x &&
            image.y < bounds.y + bounds.height &&
            image.y + imageHeight > bounds.y) {
          foundObjects.push({ id: image.id, type: 'image' });
        }
      } else {
        // For rotated images, check if any corner of the rotated image intersects with selection bounds
        const centerX = image.x + imageWidth / 2;
        const centerY = image.y + imageHeight / 2;
        const rad = (rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        // Calculate the four corners of the rotated image
        const corners = [
          { x: -imageWidth / 2, y: -imageHeight / 2 },
          { x: imageWidth / 2, y: -imageHeight / 2 },
          { x: imageWidth / 2, y: imageHeight / 2 },
          { x: -imageWidth / 2, y: imageHeight / 2 }
        ];
        
        let imageInBounds = false;
        
        // Check if any corner of the rotated image is within the selection bounds
        for (const corner of corners) {
          const rotatedX = corner.x * cos - corner.y * sin + centerX;
          const rotatedY = corner.x * sin + corner.y * cos + centerY;
          
          if (rotatedX >= bounds.x && rotatedX <= bounds.x + bounds.width &&
              rotatedY >= bounds.y && rotatedY <= bounds.y + bounds.height) {
            imageInBounds = true;
            break;
          }
        }
        
        // Also check if the selection bounds intersect with the rotated image bounds
        // (in case the selection is smaller than the image but overlaps it)
        if (!imageInBounds) {
          // Check if any corner of the selection bounds is within the rotated image
          const selectionCorners = [
            { x: bounds.x, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y },
            { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
            { x: bounds.x, y: bounds.y + bounds.height }
          ];
          
          for (const selectionCorner of selectionCorners) {
            if (isPointOnImage(selectionCorner, image)) {
              imageInBounds = true;
              break;
            }
          }
        }
        
        if (imageInBounds) {
          foundObjects.push({ id: image.id, type: 'image' });
        }
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
  }, [isPointOnImage]);

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
      const groupRotation = calculateGroupRotation(objectsInBounds, images);
      
      selectedObjects = objectsInBounds;

      return {
        ...prev,
        selectedObjects: objectsInBounds,
        groupBounds,
        transformGroupRotation: groupRotation,
        isSelecting: false,
        dragStartPoint: null,
        selectionBounds: null
      };
    });
    
    return selectedObjects;
  }, [findObjectsInBounds, calculateGroupBounds, calculateGroupRotation]);

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
      if (!prev.dragStartPoint || !prev.isDraggingObjects || prev.isTransforming) return prev;

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
        const groupRotation = calculateGroupRotation(newSelectedObjects, images);
        return {
          ...prev,
          selectedObjects: newSelectedObjects,
          groupBounds,
          transformGroupRotation: groupRotation,
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
        const groupRotation = calculateGroupRotation(newSelectedObjects, images);
        return {
          ...prev,
          selectedObjects: newSelectedObjects,
          groupBounds,
          transformGroupRotation: groupRotation,
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
        const groupRotation = calculateGroupRotation(newSelectedObjects, images);
        return {
          ...prev,
          selectedObjects: newSelectedObjects,
          groupBounds,
          transformGroupRotation: groupRotation,
          // Hide context menu when selection changes
          contextMenu: {
            ...prev.contextMenu,
            isVisible: false
          }
        };
      }
    });
  }, [findObjectsAtPoint, calculateGroupBounds, calculateGroupRotation]);

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
    containerRef?: React.RefObject<HTMLElement>,
    stageRef?: React.RefObject<Konva.Stage>,
    panZoomState?: { x: number; y: number; scale: number }
  ) => {
    const bounds = groupBounds || selectionBounds;
    if (!bounds || !stageRef?.current || !panZoomState) return { x: 0, y: 0 };

    const stage = stageRef.current;
    const rect = stage.container().getBoundingClientRect();
    const { x: stageX, y: stageY } = panZoomState;
    const scale = panZoomState.scale;

    // Convert world coordinates to screen coordinates
    const screenX = rect.left + (bounds.x * scale) + stageX;
    const screenY = rect.top + (bounds.y * scale) + stageY;
    const screenWidth = bounds.width * scale;
    const screenHeight = bounds.height * scale;

    const menuWidth = 200; // Approximate menu width
    const menuHeight = 120; // Approximate menu height
    const offset = 10; // Distance from selection

    // Default position: bottom-right of selection in screen coordinates
    let x = screenX + screenWidth + offset;
    let y = screenY;

    // Get viewport dimensions for boundary checking
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // If menu would overflow right edge of viewport, position to the left
    if (x + menuWidth > viewportWidth) {
      x = screenX - menuWidth - offset;
    }

    // If menu would overflow bottom edge of viewport, position above
    if (y + menuHeight > viewportHeight) {
      y = screenY + screenHeight - menuHeight;
    }

    // Ensure menu doesn't go off left edge of viewport
    if (x < 0) {
      x = Math.max(offset, screenX + screenWidth / 2 - menuWidth / 2);
    }

    // Ensure menu doesn't go off top edge of viewport
    if (y < 0) {
      y = offset;
    }

    return { x, y };
  }, []);

  // Show context menu
  const showContextMenu = useCallback((
    containerRef?: React.RefObject<HTMLElement>,
    stageRef?: React.RefObject<Konva.Stage>,
    panZoomState?: { x: number; y: number; scale: number }
  ) => {
    setState(prev => {
      if (prev.selectedObjects.length === 0) return prev;

      const position = calculateContextMenuPosition(
        prev.selectionBounds,
        prev.groupBounds,
        containerRef,
        stageRef,
        panZoomState
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
  const updateContextMenuPosition = useCallback((
    containerRef?: React.RefObject<HTMLElement>,
    stageRef?: React.RefObject<Konva.Stage>,
    panZoomState?: { x: number; y: number; scale: number }
  ) => {
    setState(prev => {
      if (!prev.contextMenu.isVisible) return prev;

      const position = calculateContextMenuPosition(
        prev.selectionBounds,
        prev.groupBounds,
        containerRef,
        stageRef,
        panZoomState
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

  // Transform methods
  const startTransform = useCallback((
    mode: 'resize' | 'rotate',
    anchor: string,
    initialBounds: SelectionBounds,
    initialRotation: number = 0
  ) => {
    setState(prev => ({
      ...prev,
      isTransforming: true,
      transformMode: mode,
      transformAnchor: anchor,
      initialTransformBounds: initialBounds,
      currentTransformBounds: { ...initialBounds },
      transformRotation: 0, // Relative rotation starts at 0
      transformGroupRotation: initialRotation, // Set the initial absolute rotation
      // Reset dragging state to prevent conflicts
      isDraggingObjects: false,
      dragStartPoint: null,
      dragOffset: null
    }));
  }, []);

  const updateTransform = useCallback((
    newBounds: SelectionBounds,
    rotation: number = 0
  ) => {
    setState(prev => ({
      ...prev,
      currentTransformBounds: newBounds,
      transformRotation: rotation
    }));
  }, []);

  const endTransform = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTransforming: false,
      transformMode: null,
      transformAnchor: null,
      initialTransformBounds: null,
      currentTransformBounds: null,
      transformRotation: 0,
      transformGroupRotation: 0,
      // Also reset dragging state
      isDraggingObjects: false,
      dragStartPoint: null,
      dragOffset: null
    }));
  }, []);

  const cancelTransform = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTransforming: false,
      transformMode: null,
      transformAnchor: null,
      initialTransformBounds: null,
      currentTransformBounds: null,
      transformRotation: 0,
      transformGroupRotation: 0
    }));
  }, []);

  // Select all objects on the canvas
  const selectAll = useCallback((lines: LineObject[], images: ImageObject[]) => {
    const allObjects: SelectedObject[] = [
      ...lines.map(line => ({ id: line.id, type: 'line' as const })),
      ...images.map(image => ({ id: image.id, type: 'image' as const }))
    ];
    
    const groupBounds = calculateGroupBounds(allObjects, lines, images);
    const groupRotation = calculateGroupRotation(allObjects, images);
    
    setState(prev => ({
      ...prev,
      selectedObjects: allObjects,
      groupBounds,
      transformGroupRotation: groupRotation
    }));
  }, [calculateGroupBounds, calculateGroupRotation]);

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
    calculateGroupRotation,
    updateGroupBounds,
    isPointInGroupBounds,
    isObjectLocked,
    showContextMenu,
    hideContextMenu,
    updateContextMenuPosition,
    selectAll,
    // Transform methods
    startTransform,
    updateTransform,
    endTransform,
    cancelTransform
  };
};
