import { useState, useCallback } from 'react';
import { SelectionState, SelectedObject, SelectionBounds, LineObject, ImageObject } from '@/types/whiteboard';

export const useSelectionState = () => {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedObjects: [],
    selectionBounds: null,
    isSelecting: false
  });
  
  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);

  // NOTE: Original select tool's core state management functions removed
  // Use select2 tool for selection functionality

  // NOTE: Original select tool hit detection functions removed
  // Use select2 tool for hit detection functionality

  // selectAll function removed - use select2 tool for selection functionality

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

  // Minimal functions for select2 compatibility
  const clearSelection = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      selectedObjects: [],
      selectionBounds: null
    }));
  }, []);

  const selectObjects = useCallback((objects: SelectedObject[]) => {
    setSelectionState(prev => ({
      ...prev,
      selectedObjects: objects
    }));
  }, []);

  const setSelectionBounds = useCallback((bounds: SelectionBounds | null) => {
    setSelectionState(prev => ({
      ...prev,
      selectionBounds: bounds
    }));
  }, []);

  const setIsSelecting = useCallback((isSelecting: boolean) => {
    setSelectionState(prev => ({
      ...prev,
      isSelecting
    }));
  }, []);

  return {
    selectionState,
    // NOTE: Hit detection functions removed (isPointOnLine, isPointOnImage, findObjectsAtPoint, 
    // findObjectsInBounds, isObjectSelected, getSelectedObjectIds) - use select2 tool
    calculateSelectionBounds,
    isPointInSelectionBounds,
    hoveredObjectId,
    setHoveredObjectId,
    // Minimal functions for select2 compatibility
    clearSelection,
    selectObjects,
    setSelectionBounds,
    setIsSelecting
  };
};