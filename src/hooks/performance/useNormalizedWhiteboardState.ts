
import { useMemo, useCallback } from 'react';
import { LineObject, ImageObject } from '@/types/whiteboard';

interface NormalizedState {
  linesById: Record<string, LineObject>;
  imagesById: Record<string, ImageObject>;
  lineIds: string[];
  imageIds: string[];
}

/**
 * Hook for normalizing whiteboard state to prevent unnecessary re-renders
 * Separates objects by ID for efficient lookups and updates
 */
export const useNormalizedWhiteboardState = (
  lines: LineObject[],
  images: ImageObject[]
) => {
  // Normalize lines into ID-based lookup
  const normalizedLines = useMemo(() => {
    const linesById: Record<string, LineObject> = {};
    const lineIds: string[] = [];
    
    lines.forEach(line => {
      linesById[line.id] = line;
      lineIds.push(line.id);
    });
    
    return { linesById, lineIds };
  }, [lines]);

  // Normalize images into ID-based lookup
  const normalizedImages = useMemo(() => {
    const imagesById: Record<string, ImageObject> = {};
    const imageIds: string[] = [];
    
    images.forEach(image => {
      imagesById[image.id] = image;
      imageIds.push(image.id);
    });
    
    return { imagesById, imageIds };
  }, [images]);

  // Get line by ID with memoization
  const getLineById = useCallback((id: string) => {
    return normalizedLines.linesById[id];
  }, [normalizedLines.linesById]);

  // Get image by ID with memoization
  const getImageById = useCallback((id: string) => {
    return normalizedImages.imagesById[id];
  }, [normalizedImages.imagesById]);

  // Get multiple lines by IDs efficiently
  const getLinesByIds = useCallback((ids: string[]) => {
    return ids.map(id => normalizedLines.linesById[id]).filter(Boolean);
  }, [normalizedLines.linesById]);

  // Get multiple images by IDs efficiently
  const getImagesByIds = useCallback((ids: string[]) => {
    return ids.map(id => normalizedImages.imagesById[id]).filter(Boolean);
  }, [normalizedImages.imagesById]);

  // Check if line exists without creating new objects
  const hasLine = useCallback((id: string) => {
    return id in normalizedLines.linesById;
  }, [normalizedLines.linesById]);

  // Check if image exists without creating new objects
  const hasImage = useCallback((id: string) => {
    return id in normalizedImages.imagesById;
  }, [normalizedImages.imagesById]);

  return useMemo(() => ({
    // Normalized state
    linesById: normalizedLines.linesById,
    imagesById: normalizedImages.imagesById,
    lineIds: normalizedLines.lineIds,
    imageIds: normalizedImages.imageIds,
    
    // Helper functions
    getLineById,
    getImageById,
    getLinesByIds,
    getImagesByIds,
    hasLine,
    hasImage,
    
    // Counts for optimization decisions
    lineCount: normalizedLines.lineIds.length,
    imageCount: normalizedImages.imageIds.length,
    totalObjectCount: normalizedLines.lineIds.length + normalizedImages.imageIds.length
  }), [
    normalizedLines.linesById,
    normalizedLines.lineIds,
    normalizedImages.imagesById,
    normalizedImages.imageIds,
    getLineById,
    getImageById,
    getLinesByIds,
    getImagesByIds,
    hasLine,
    hasImage
  ]);
};
