
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

  // Process selected lines
  for (const line of selectedLines) {
    const points = line.points;
    
    for (let i = 0; i < points.length; i += 2) {
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
      const x = rotatedX + line.x;
      const y = rotatedY + line.y;
      
      // Update bounds
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  // Process selected images
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
    
    // For rotated images, check all corners
    const corners = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height }
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

  // Add some padding for easier selection
  const padding = 5;
  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + (padding * 2),
    height: (maxY - minY) + (padding * 2)
  };
};
