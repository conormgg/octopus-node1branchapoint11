import { useCallback } from 'react';
import { SelectionBounds } from '@/types/whiteboard';

export interface TransformHandle {
  type: string;
  x: number;
  y: number;
  cursor: string;
}

export const useTransformHandleDetection = (zoom: number) => {
  // Calculate handle positions and hit areas (supports rotation)
  const getTransformHandles = useCallback((bounds: SelectionBounds, rotation: number = 0): TransformHandle[] => {
    const handleSize = Math.max(8, 12 / zoom);
    const rotationHandleOffset = Math.max(20, 30 / zoom);

    // Calculate center of the bounds
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Define handle positions relative to the center (before rotation)
    const relativeHandles = [
      { type: 'nw', x: -bounds.width / 2, y: -bounds.height / 2, cursor: 'nw-resize' },
      { type: 'n', x: 0, y: -bounds.height / 2, cursor: 'ns-resize' },
      { type: 'ne', x: bounds.width / 2, y: -bounds.height / 2, cursor: 'ne-resize' },
      { type: 'e', x: bounds.width / 2, y: 0, cursor: 'ew-resize' },
      { type: 'se', x: bounds.width / 2, y: bounds.height / 2, cursor: 'nw-resize' },
      { type: 's', x: 0, y: bounds.height / 2, cursor: 'ns-resize' },
      { type: 'sw', x: -bounds.width / 2, y: bounds.height / 2, cursor: 'ne-resize' },
      { type: 'w', x: -bounds.width / 2, y: 0, cursor: 'ew-resize' },
      { 
        type: 'rotate', 
        x: 0, 
        y: -bounds.height / 2 - rotationHandleOffset, 
        cursor: 'grab' 
      }
    ];

    // Apply rotation to each handle position
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const handles: TransformHandle[] = relativeHandles.map(handle => {
      // Rotate the relative position
      const rotatedX = handle.x * cos - handle.y * sin;
      const rotatedY = handle.x * sin + handle.y * cos;
      
      // Translate to world coordinates
      const worldX = centerX + rotatedX;
      const worldY = centerY + rotatedY;

      return {
        type: handle.type,
        x: worldX,
        y: worldY,
        cursor: handle.cursor
      };
    });

    return handles.map(handle => ({
      ...handle,
      hitArea: {
        x: handle.x - handleSize / 2,
        y: handle.y - handleSize / 2,
        width: handleSize,
        height: handleSize
      }
    })) as any;
  }, [zoom]);

  // Check if a point is within a handle's hit area
  const isPointInHandle = useCallback((
    point: { x: number; y: number },
    handle: TransformHandle & { hitArea: { x: number; y: number; width: number; height: number } }
  ): boolean => {
    return (
      point.x >= handle.hitArea.x &&
      point.x <= handle.hitArea.x + handle.hitArea.width &&
      point.y >= handle.hitArea.y &&
      point.y <= handle.hitArea.y + handle.hitArea.height
    );
  }, []);

  // Find which handle (if any) is at the given point
  const getHandleAtPoint = useCallback((
    point: { x: number; y: number },
    bounds: SelectionBounds | null,
    rotation: number = 0
  ): (TransformHandle & { hitArea: any }) | null => {
    if (!bounds) return null;

    const handles = getTransformHandles(bounds, rotation) as any;
    
    // Check handles in reverse order so rotation handle has priority if overlapping
    for (let i = handles.length - 1; i >= 0; i--) {
      if (isPointInHandle(point, handles[i])) {
        return handles[i];
      }
    }
    
    return null;
  }, [getTransformHandles, isPointInHandle]);

  return {
    getTransformHandles,
    getHandleAtPoint,
    isPointInHandle
  };
};
