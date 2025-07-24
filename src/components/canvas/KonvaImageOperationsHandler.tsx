
import React from 'react';
import ImageRenderer from './ImageRenderer';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';

interface KonvaImageOperationsHandlerProps {
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  whiteboardId?: string;
  onImageContextMenu?: (imageId: string, x: number, y: number) => void;
}

const KonvaImageOperationsHandler: React.FC<KonvaImageOperationsHandlerProps> = ({
  whiteboardState,
  whiteboardId,
  onImageContextMenu
}) => {
  const { state } = whiteboardState; // selection now handled by select2 system

  // Helper function to update image state
  const updateImageState = (imageId: string, newAttrs: any) => {
    if ('updateImageState' in whiteboardState && typeof whiteboardState.updateImageState === 'function') {
      whiteboardState.updateImageState(imageId, newAttrs);
    } else {
      console.log(`[${whiteboardId}] Image update requested but no updateImageState available on the provided state object.`);
    }
  };

  const handleToggleLock = (imageId: string) => {
    if ('toggleImageLock' in whiteboardState && typeof whiteboardState.toggleImageLock === 'function') {
      whiteboardState.toggleImageLock(imageId);
    } else {
      console.log(`[${whiteboardId}] Image lock toggle requested but no toggleImageLock available on the provided state object.`);
    }
  };

  return (
    <>
      {state.images?.map((image) => {
        return (
          <ImageRenderer
            key={image.id}
            imageObject={image}
            isSelected={false} // Selection now handled by select2 system
            isHovered={false}
            onSelect={() => {
              // Image selection now handled by select2 system
            }}
            onChange={(newAttrs) => {
              if ('updateImage' in whiteboardState && whiteboardState.updateImage) {
                whiteboardState.updateImage(image.id, newAttrs);
              } else {
                updateImageState(image.id, newAttrs);
              }
            }}
            onUpdateState={() => {
              if ('addToHistory' in whiteboardState && whiteboardState.addToHistory) {
                whiteboardState.addToHistory();
              }
            }}
            currentTool={state.currentTool}
            onToggleLock={() => handleToggleLock(image.id)}
            onContextMenu={onImageContextMenu}
          />
        );
      }) || null}
    </>
  );
};

export default KonvaImageOperationsHandler;
