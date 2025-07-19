import { useState, useCallback } from 'react';
import { SelectionState, SelectedObject, SelectionBounds, LineObject, ImageObject, TransformationData } from '@/types/whiteboard';
import Konva from 'konva';

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

  const isPointOnLine = useCallback((point: { x: number; y: number }, line: LineObject, tolerance: number = 10): boolean => {
    const points = line.points;
    if (points.length < 4) return false;

    const transform = new Konva.Transform();
    transform.translate(line.x, line.y);
    transform.rotate((line.rotation || 0) * Math.PI / 180);
    transform.scale(line.scaleX, line.scaleY);
    const invTransform = transform.invert();
    const localPoint = invTransform.point(point);

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

      if (distance <= tolerance + line.strokeWidth / 2) {
        return true;
      }
    }

    return false;
  }, []);

  const isPointOnImage = useCallback((point: { x: number; y: number }, image: ImageObject): boolean => {
    const width = image.width || 100;
    const height = image.height || 100;
    
    const transform = new Konva.Transform();
    transform.translate(image.x, image.y);
    transform.rotate((image.rotation || 0) * Math.PI / 180);
    const invTransform = transform.invert();
    const localPoint = invTransform.point(point);
    
    return localPoint.x >= 0 && localPoint.x <= width && localPoint.y >= 0 && localPoint.y <= height;
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

  const findObjectsInBounds = useCallback((
    bounds: SelectionBounds,
    lines: LineObject[],
    images: ImageObject[]
  ): SelectedObject[] => {
    const foundObjects: SelectedObject[] = [];

    const selectionRect = new Konva.Rect(bounds);

    for (const image of images) {
      const imageRect = new Konva.Rect({
        x: image.x,
        y: image.y,
        width: image.width,
        height: image.height,
        rotation: image.rotation || 0
      });
      if (Konva.Util.haveIntersection(selectionRect.getClientRect(), imageRect.getClientRect())) {
        foundObjects.push({ id: image.id, type: 'image' });
      }
    }

    for (const line of lines) {
      const lineShape = new Konva.Line({
        points: line.points,
        x: line.x,
        y: line.y,
        scaleX: line.scaleX,
        scaleY: line.scaleY,
        rotation: line.rotation || 0
      });
      if (Konva.Util.haveIntersection(selectionRect.getClientRect(), lineShape.getClientRect())) {
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

    const selectedLines = selectedObjects
      .filter(obj => obj.type === 'line')
      .map(obj => lines.find(line => line.id === obj.id))
      .filter(Boolean) as LineObject[];

    const selectedImages = selectedObjects
      .filter(obj => obj.type === 'image')
      .map(obj => images.find(img => img.id === obj.id))
      .filter(Boolean) as ImageObject[];

    for (const line of selectedLines) {
      const lineShape = new Konva.Line({
        points: line.points,
        x: line.x,
        y: line.y,
        scaleX: line.scaleX,
        scaleY: line.scaleY,
        rotation: line.rotation || 0
      });
      const rect = lineShape.getClientRect();
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }

    for (const image of selectedImages) {
      const imageShape = new Konva.Rect({
        x: image.x,
        y: image.y,
        width: image.width,
        height: image.height,
        rotation: image.rotation || 0
      });
      const rect = imageShape.getClientRect();
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }

    if (minX === Infinity) return null;

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
