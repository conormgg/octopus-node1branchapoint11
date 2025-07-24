/**
 * Utility functions for image operations
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Calculate appropriate display dimensions for a pasted image
 * Maintains aspect ratio while ensuring reasonable size constraints
 */
export const calculateImageDisplayDimensions = (
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number = 400,
  maxHeight: number = 400
): ImageDimensions => {
  // If image is already within bounds, scale it down slightly for better UX
  if (naturalWidth <= maxWidth && naturalHeight <= maxHeight) {
    return {
      width: naturalWidth * 0.8,
      height: naturalHeight * 0.8
    };
  }

  // Calculate aspect ratio
  const aspectRatio = naturalWidth / naturalHeight;

  // Scale to fit within max bounds while maintaining aspect ratio
  if (naturalWidth > naturalHeight) {
    // Landscape orientation
    const scaledWidth = Math.min(naturalWidth, maxWidth);
    const scaledHeight = scaledWidth / aspectRatio;
    
    if (scaledHeight > maxHeight) {
      return {
        width: maxHeight * aspectRatio,
        height: maxHeight
      };
    }
    
    return {
      width: scaledWidth,
      height: scaledHeight
    };
  } else {
    // Portrait or square orientation
    const scaledHeight = Math.min(naturalHeight, maxHeight);
    const scaledWidth = scaledHeight * aspectRatio;
    
    if (scaledWidth > maxWidth) {
      return {
        width: maxWidth,
        height: maxWidth / aspectRatio
      };
    }
    
    return {
      width: scaledWidth,
      height: scaledHeight
    };
  }
};

/**
 * Load an image and return its natural dimensions
 */
export const loadImageDimensions = (src: string): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    img.onerror = reject;
    img.src = src;
  });
};