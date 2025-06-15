
import { useCallback } from 'react';
import { ImageObject } from '@/types/whiteboard';
import { serializeAddImageOperation, serializeUpdateImageOperation } from '@/utils/operationSerializer';
import { v4 as uuidv4 } from 'uuid';
import Konva from 'konva';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('images');

export const useSharedImageOperations = (
  state: any,
  setState: any,
  addToHistory: () => void,
  sendOperation: any,
  isApplyingRemoteOperation: React.MutableRefObject<boolean>,
  whiteboardId?: string
) => {
  // Image update function with sync
  const updateImageState = useCallback((imageId: string, newAttrs: Partial<ImageObject>) => {
    setState((prev: any) => ({
      ...prev,
      images: prev.images.map((img: ImageObject) =>
        img.id === imageId ? { ...img, ...newAttrs } : img
      )
    }));

    // Always send the operation to the database for persistence
    // But only sync to other clients if we're on the teacher's main board
    if (sendOperation && !isApplyingRemoteOperation.current) {
      // Create the operation
      const operation = serializeUpdateImageOperation(imageId, newAttrs);
      
      // Send it to the database/sync system
      sendOperation(operation);
      
      debugLog('Update', 'Image operation sent', { imageId, operation: 'update' });
    }

    // Add to history after state update
    setTimeout(() => addToHistory(), 0);
  }, [setState, sendOperation, isApplyingRemoteOperation, addToHistory]);

  // Handle paste functionality - fixed to accept correct parameters
  const handlePaste = useCallback((e: ClipboardEvent, stage: Konva.Stage | null) => {
    e.preventDefault();
    
    const items = e.clipboardData?.items;
    if (!items || !stage) {
      return;
    }
  
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) {
          continue;
        }
  
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          const image = new window.Image();
          image.src = imageUrl;
          image.onload = () => {
            // Get pointer position relative to this specific stage
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
            
            // Always send the operation to the database for persistence
            // But only sync to other clients if we're on the teacher's main board
            if (sendOperation && !isApplyingRemoteOperation.current) {
              // Create the operation
              const operation = serializeAddImageOperation(newImage);
              
              // Send it to the database/sync system
              sendOperation(operation);
              
              debugLog('Paste', 'Image pasted and operation sent', { imageId: newImage.id });
            }
          };
        };
        reader.readAsDataURL(file);
      }
    }
  }, [state.panZoomState, addToHistory, sendOperation, isApplyingRemoteOperation, setState]);

  // Toggle image lock state
  const toggleImageLock = useCallback((imageId: string) => {
    setState((prev: any) => ({
      ...prev,
      images: prev.images.map((img: ImageObject) =>
        img.id === imageId ? { ...img, locked: !img.locked } : img
      )
    }));

    // Always send the operation to the database for persistence
    // But only sync to other clients if we're on the teacher's main board
    if (sendOperation && !isApplyingRemoteOperation.current) {
      // Get the current image to determine new lock state
      const currentImage = state.images.find((img: ImageObject) => img.id === imageId);
      const newLockState = !currentImage?.locked;
      
      // Create the operation
      const operation = serializeUpdateImageOperation(imageId, { locked: newLockState });
      
      // Send it to the database/sync system
      sendOperation(operation);
      
      debugLog('Lock', 'Image lock toggled', { imageId, locked: newLockState });
    }

    // Add to history after state update
    setTimeout(() => addToHistory(), 0);
  }, [setState, sendOperation, isApplyingRemoteOperation, addToHistory, state.images]);

  // Alias for updateImageState to match expected interface
  const updateImage = updateImageState;

  return {
    updateImageState,
    updateImage,
    handlePaste,
    toggleImageLock
  };
};
