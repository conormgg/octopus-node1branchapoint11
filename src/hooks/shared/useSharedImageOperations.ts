
import { useCallback } from 'react';
import { ImageObject } from '@/types/whiteboard';
import { serializeAddImageOperation, serializeUpdateImageOperation } from '@/utils/operationSerializer';
import { v4 as uuidv4 } from 'uuid';
import Konva from 'konva';

export const useSharedImageOperations = (
  state: any,
  setState: any,
  addToHistory: () => void,
  sendOperation: any,
  isApplyingRemoteOperation: React.MutableRefObject<boolean>
) => {
  // Image update function with sync
  const updateImageState = useCallback((imageId: string, newAttrs: Partial<ImageObject>) => {
    console.log('Updating image state:', imageId, newAttrs);
    
    setState((prev: any) => ({
      ...prev,
      images: prev.images.map((img: ImageObject) =>
        img.id === imageId ? { ...img, ...newAttrs } : img
      )
    }));

    // Sync the image update if we're not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current) {
      console.log('Syncing image update:', imageId, newAttrs);
      sendOperation(serializeUpdateImageOperation(imageId, newAttrs));
    }

    // Add to history after state update
    setTimeout(() => addToHistory(), 0);
  }, [setState, sendOperation, isApplyingRemoteOperation, addToHistory]);

  // Handle paste functionality
  const handlePaste = useCallback((e: ClipboardEvent, stage: Konva.Stage | null) => {
    console.log('Paste event triggered in shared whiteboard state');
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items || !stage) {
      console.log('No clipboard items or stage available');
      return;
    }
  
    console.log('Processing clipboard items:', items.length);
    for (let i = 0; i < items.length; i++) {
      console.log('Item type:', items[i].type);
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) {
          console.log('Could not get file from clipboard item');
          continue;
        }
  
        console.log('Processing image file:', file.name, file.type);
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          const image = new window.Image();
          image.src = imageUrl;
          image.onload = () => {
            console.log('Image loaded, creating image object');
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
            
            // Sync the new image if we're not in receive-only mode
            if (sendOperation && !isApplyingRemoteOperation.current) {
              console.log('Syncing new image to other clients:', newImage);
              sendOperation(serializeAddImageOperation(newImage));
            }
            
            console.log('Image added to whiteboard');
          };
        };
        reader.readAsDataURL(file);
      }
    }
  }, [state.panZoomState, addToHistory, sendOperation, isApplyingRemoteOperation]);

  return {
    updateImageState,
    handlePaste
  };
};
