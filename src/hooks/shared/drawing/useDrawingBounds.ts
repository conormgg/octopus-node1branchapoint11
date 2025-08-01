
import { LineObject } from '@/types/whiteboard';

/**
 * @fileoverview Utility functions for calculating drawing bounds
 * @description Helper functions for determining the bounds of drawn objects
 */

/**
 * Calculate bounds from line points with transformations
 */
export const calculateLineBounds = (line: LineObject) => {
  if (!line.points || line.points.length < 2) {
    return { x: line.x || 0, y: line.y || 0, width: 1, height: 1 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Process points in pairs (x, y)
  for (let i = 0; i < line.points.length; i += 2) {
    const localX = line.points[i];
    const localY = line.points[i + 1];
    
    // Apply simple positioning only (no transforms)
    const transformedX = localX + line.x;
    const transformedY = localY + line.y;
    
    
    minX = Math.min(minX, transformedX);
    minY = Math.min(minY, transformedY);
    maxX = Math.max(maxX, transformedX);
    maxY = Math.max(maxY, transformedY);
  }

  // Add some padding based on stroke width
  const padding = (line.strokeWidth || 1) / 2;
  
  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2)
  };
};

/**
 * Calculate combined bounds for multiple lines
 */
export const calculateCombinedLineBounds = (lines: LineObject[]) => {
  if (lines.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  lines.forEach(line => {
    const bounds = calculateLineBounds(line);
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });
  
  if (minX === Infinity || minY === Infinity) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};
