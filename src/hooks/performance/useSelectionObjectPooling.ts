
import { useCallback, useRef } from 'react';
import { pointPool, boundsPool, type PooledPoint, type PooledBounds } from '@/utils/performance/objectPool';
import { SelectionBounds } from '@/types/whiteboard';

/**
 * Hook for object pooling in selection operations
 * Phase 2B-1: Low-risk object pooling for selection calculations
 */
export const useSelectionObjectPooling = () => {
  // Track borrowed objects for cleanup
  const borrowedObjects = useRef<Set<any>>(new Set());

  // Create temporary point for calculations
  const createTempPoint = useCallback((x: number = 0, y: number = 0): PooledPoint => {
    const point = pointPool.acquire();
    point.x = x;
    point.y = y;
    borrowedObjects.current.add(point);
    return point;
  }, []);

  // Create temporary bounds for calculations
  const createTempBounds = useCallback((x: number = 0, y: number = 0, width: number = 0, height: number = 0): SelectionBounds => {
    const bounds = boundsPool.acquire();
    bounds.x = x;
    bounds.y = y;
    bounds.width = width;
    bounds.height = height;
    borrowedObjects.current.add(bounds);
    return bounds;
  }, []);

  // Create temporary transform data
  const createTempTransform = (
    x: number = 0,
    y: number = 0
  ) => {
    return { x, y };
  };

  // Release a specific object back to its pool
  const releaseObject = useCallback((obj: any) => {
    if (borrowedObjects.current.has(obj)) {
      borrowedObjects.current.delete(obj);
      
      // Determine which pool this object belongs to based on its properties
      if ('x' in obj && 'y' in obj && 'width' in obj && 'height' in obj) {
        boundsPool.release(obj);
      } else if ('x' in obj && 'y' in obj) {
        pointPool.release(obj);
      }
    }
  }, []);

  // Release all borrowed objects back to their pools
  const releaseAllObjects = useCallback(() => {
    for (const obj of borrowedObjects.current) {
      // Determine which pool this object belongs to
      if ('x' in obj && 'y' in obj && 'width' in obj && 'height' in obj) {
        boundsPool.release(obj);
      } else if ('x' in obj && 'y' in obj) {
        pointPool.release(obj);
      }
    }
    borrowedObjects.current.clear();
  }, []);

  // Batch operation helper that automatically releases objects after completion
  const withPooledObjects = useCallback(<T>(operation: () => T): T => {
    try {
      return operation();
    } finally {
      releaseAllObjects();
    }
  }, [releaseAllObjects]);

  return {
    createTempPoint,
    createTempBounds,
    createTempTransform,
    releaseObject,
    releaseAllObjects,
    withPooledObjects,
    
    // Pool statistics for debugging
    getPoolStats: () => ({
      pointPool: pointPool.size,
      boundsPool: boundsPool.size,
      borrowedObjects: borrowedObjects.current.size
    })
  };
};
