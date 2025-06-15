
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ImageObject } from '@/types/whiteboard';
import Konva from 'konva';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @function debugLog
 * @description Debug logging for image operations
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[ImageOperations:${context}] ${action}`, data || '');
  }
};

/**
 * @hook useWhiteboardImageOperations
 * @description Handles all image-related operations
 */
export const useWhiteboardImageOperations = (
  state: any,
  setState: any,
  addToHistory: () => void
) => {
  // Handle paste functionality
  const handlePaste = useCallback((e: ClipboardEvent, stage: Konva.Stage | null) => {
    debugLog('Paste', 'Paste event triggered');
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items || !stage) {
      debugLog('Paste', 'No clipboard items or stage available');
      return;
    }

    debugLog('Paste', 'Processing clipboard items', { count: items.length });
    for (let i = 0; i < items.length; i++) {
      debugLog('Paste', 'Item type', items[i].type);
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) {
          debugLog('Paste', 'Could not get file from clipboard item');
          continue;
        }

        debugLog('Paste', 'Processing image file', { name: file.name, type: file.type });
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          const image = new window.Image();
          image.src = imageUrl;
          image.onload = () => {
            debugLog('Paste', 'Image loaded, creating image object');
            const pointerPosition = stage.getPointerPosition() ?? { x: stage.width() / 2, y: stage.height() / 2 };
            const position = {
              x: (pointerPosition.x - state.panZoomState.x) / state.panZoomState.scale,
              y: (pointerPosition.y - state.panZoomState.y) / state.panZoomState.scale,
            };

            const newImage: ImageObject = {
              id: `image_${uuidv4()}`,
              src: imageUrl,
              x: position.x - (image.width / 4),
              y: position.y - (image.height / 4),
              width: image.width / 2,
              height: image.height / 2,
            };
            
            setState((prev: any) => ({
              ...prev,
              images: [...prev.images, newImage]
            }));
            
            // Add to history after state update
            setTimeout(() => addToHistory(), 0);
            debugLog('Paste', 'Image added to whiteboard', { id: newImage.id });
          };
        };
        reader.readAsDataURL(file);
      }
    }
  }, [state.panZoomState, setState, addToHistory]);

  // Update image position/attributes
  const updateImage = useCallback((imageId: string, updates: Partial<ImageObject>) => {
    setState((prev: any) => ({
      ...prev,
      images: prev.images.map((image: ImageObject) => 
        image.id === imageId ? { ...image, ...updates } : image
      )
    }));
    // Add to history after state update
    setTimeout(() => addToHistory(), 0);
  }, [setState, addToHistory]);

  // Toggle image lock state
  const toggleImageLock = useCallback((imageId: string) => {
    debugLog('Image', 'Toggle image lock', { id: imageId });
    setState((prev: any) => ({
      ...prev,
      images: prev.images.map((img: ImageObject) =>
        img.id === imageId ? { ...img, locked: !img.locked } : img
      )
    }));

    // Add to history after state update
    setTimeout(() => addToHistory(), 0);
  }, [setState, addToHistory]);

  return {
    handlePaste,
    updateImage,
    toggleImageLock
  };
};
