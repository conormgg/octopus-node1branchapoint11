
import { useCallback, useRef } from 'react';
import { ImageObject, ActivityMetadata } from '@/types/whiteboard';
import { serializeAddImageOperation, serializeUpdateImageOperation, serializeDeleteImageOperation } from '@/utils/operationSerializer';
import { calculateImageDisplayDimensions, loadImageDimensions } from '@/utils/imageUtils';

// Helper function to calculate image bounds
const calculateImageBounds = (image: ImageObject) => {
      const width = image.width || 100;
      const height = image.height || 100;
  
  return {
    x: image.x,
    y: image.y,
    width: width,
    height: height
  };
};

export const useSharedImageOperations = (
  state: any,
  setState: any,
  addToHistory: (snapshot?: any, activityMetadata?: ActivityMetadata) => void,
  sendOperation: any,
  isApplyingRemoteOperation: React.MutableRefObject<boolean>,
  whiteboardId?: string
) => {
  // Track images before transformation to detect movement
  const imagesBeforeTransformRef = useRef<ImageObject[]>([]);

  // Handle image paste with activity tracking
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    e.preventDefault();
    
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    if (imageItems.length === 0) return;
    
    for (const item of imageItems) {
      const file = item.getAsFile();
      if (!file) continue;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const src = event.target?.result as string;
        if (!src) return;
        
        try {
          // Load image to get natural dimensions
          const naturalDimensions = await loadImageDimensions(src);
          
          // Calculate appropriate display dimensions
          const displayDimensions = calculateImageDisplayDimensions(
            naturalDimensions.width,
            naturalDimensions.height
          );
          
          const imageId = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newImage: ImageObject = {
            id: imageId,
            x: 100, // Default position
            y: 100,
            src,
            width: displayDimensions.width,
            height: displayDimensions.height,
            locked: false
          };
          
          // Calculate activity metadata for pasted image
          const bounds = calculateImageBounds(newImage);
          const activityMetadata: ActivityMetadata = {
            type: 'paste',
            bounds,
            timestamp: Date.now()
          };
          
          console.log(`[ImageOperations] Created activity metadata for paste:`, activityMetadata);
          
          setState((prev: any) => ({
            ...prev,
            images: [...prev.images, newImage]
          }));
          
          // Add to history with activity metadata
          setTimeout(() => {
            addToHistory({
              lines: state.lines,
              images: [...state.images, newImage],
              selectionState: state.selectionState
            }, activityMetadata);
          }, 0);
          
          // Send operation to sync
          if (sendOperation && !isApplyingRemoteOperation.current) {
            console.log(`[ImageOperations] Sending paste operation to sync:`, newImage);
            const operation = serializeAddImageOperation(newImage);
            sendOperation(operation);
          }
        } catch (error) {
          console.error('Failed to load image dimensions:', error);
          // Fallback to original fixed dimensions if loading fails
          const imageId = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const newImage: ImageObject = {
            id: imageId,
            x: 100,
            y: 100,
            src,
            width: 200,
            height: 150,
            locked: false
          };
          
          setState((prev: any) => ({
            ...prev,
            images: [...prev.images, newImage]
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  }, [state.lines, state.images, state.selectionState, setState, addToHistory, sendOperation, isApplyingRemoteOperation]);

  // Update image state with transformation tracking
  const updateImageState = useCallback((imageId: string, updates: Partial<ImageObject>) => {
    console.log(`[ImageOperations] Updating image ${imageId}:`, updates);
    
    // Check if this is a transform operation (position change only)
    const isTransformUpdate = 'x' in updates || 'y' in updates;
    
    setState((prev: any) => {
      const updatedImages = prev.images.map((image: ImageObject) =>
        image.id === imageId ? { ...image, ...updates } : image
      );
      
      // If this is a transform operation, track activity
      if (isTransformUpdate) {
        const updatedImage = updatedImages.find((img: ImageObject) => img.id === imageId);
        if (updatedImage) {
          const bounds = calculateImageBounds(updatedImage);
          const activityMetadata: ActivityMetadata = {
            type: 'move',
            bounds,
            timestamp: Date.now()
          };
          
          console.log(`[ImageOperations] Created activity metadata for move:`, activityMetadata);
          
          // Add to history with activity metadata
          setTimeout(() => {
            addToHistory({
              lines: prev.lines,
              images: updatedImages,
              selectionState: prev.selectionState
            }, activityMetadata);
          }, 0);
        }
      }
      
      return {
        ...prev,
        images: updatedImages
      };
    });
    
    // Send operation to sync
    if (sendOperation && !isApplyingRemoteOperation.current) {
      const operation = serializeUpdateImageOperation(imageId, updates);
      sendOperation(operation);
    }
  }, [setState, state.lines, state.selectionState, addToHistory, sendOperation, isApplyingRemoteOperation]);

  // Update image with activity tracking
  const updateImage = useCallback((imageId: string, updates: Partial<ImageObject>) => {
    updateImageState(imageId, updates);
  }, [updateImageState]);

  // Toggle image lock
  const toggleImageLock = useCallback((imageId: string) => {
    setState((prev: any) => ({
      ...prev,
      images: prev.images.map((image: ImageObject) =>
        image.id === imageId ? { ...image, locked: !image.locked } : image
      )
    }));
    
    // Add to history
    setTimeout(() => {
      addToHistory({
        lines: state.lines,
        images: state.images,
        selectionState: state.selectionState
      });
    }, 0);
    
    // Send operation to sync
    if (sendOperation && !isApplyingRemoteOperation.current) {
      const image = state.images.find((img: ImageObject) => img.id === imageId);
      if (image) {
        const operation = serializeUpdateImageOperation(imageId, { locked: !image.locked });
        sendOperation(operation);
      }
    }
  }, [setState, state.lines, state.images, state.selectionState, addToHistory, sendOperation, isApplyingRemoteOperation]);

  return {
    handlePaste,
    updateImageState,
    updateImage,
    toggleImageLock
  };
};
