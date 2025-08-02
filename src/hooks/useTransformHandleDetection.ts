import { useCallback } from 'react';
import { SelectionBounds } from '@/types/whiteboard';

export interface TransformHandle {
  type: string;
  x: number;
  y: number;
  cursor: string;
}

export const useTransformHandleDetection = (zoom: number) => {
  // Calculate handle positions and hit areas
  const getTransformHandles = useCallback((bounds: SelectionBounds): TransformHandle[] => {
    const handleSize = Math.max(8, 12 / zoom);
    const rotationHandleOffset = Math.max(20, 30 / zoom);

    const handles: TransformHandle[] = [
      { type: 'nw', x: bounds.x, y: bounds.y, cursor: 'nw-resize' },
      { type: 'n', x: bounds.x + bounds.width / 2, y: bounds.y, cursor: 'ns-resize' },
      { type: 'ne', x: bounds.x + bounds.width, y: bounds.y, cursor: 'ne-resize' },
      { type: 'e', x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, cursor: 'ew-resize' },
      { type: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'nw-resize' },
      { type: 's', x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, cursor: 'ns-resize' },
      { type: 'sw', x: bounds.x, y: bounds.y + bounds.height, cursor: 'ne-resize' },
      { type: 'w', x: bounds.x, y: bounds.y + bounds.height / 2, cursor: 'ew-resize' },
      { 
        type: 'rotate', 
        x: bounds.x + bounds.width / 2, 
        y: bounds.y - rotationHandleOffset, 
        cursor: 'grab' 
      }
    ];

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
    bounds: SelectionBounds | null
  ): (TransformHandle & { hitArea: any }) | null => {
    if (!bounds) return null;

    const handles = getTransformHandles(bounds) as any;
    
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