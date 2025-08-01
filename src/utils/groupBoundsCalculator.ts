import { LineObject, ImageObject, SelectedObject } from '@/types/whiteboard';

export interface GroupBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const calculateGroupBounds = (
  selectedObjects: SelectedObject[],
  selectedLines: LineObject[],
  selectedImages: ImageObject[]
): GroupBounds | null => {
  if (selectedObjects.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Process selected lines - simplified to only handle x, y positioning
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

  // Process selected images - simplified to only handle x, y, width, height
  for (const image of selectedImages) {
    const width = image.width || 100;
    const height = image.height || 100;
    
    minX = Math.min(minX, image.x);
    minY = Math.min(minY, image.y);
    maxX = Math.max(maxX, image.x + width);
    maxY = Math.max(maxY, image.y + height);
  }

  // If no objects were found or bounds are invalid
  if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
    return null;
  }

  // Add some padding for easier selection
  const padding = 5;
  
  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2)
  };
};