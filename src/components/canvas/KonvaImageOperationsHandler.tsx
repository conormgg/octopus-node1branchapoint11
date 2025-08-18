
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
  const { state, selection, updateImage, addToHistory } = whiteboardState;

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
        // NOTE: Original isObjectSelected function removed - using fallback
        const selectionWithIsSelected = selection as any;
        const isSelected = selectionWithIsSelected?.isObjectSelected?.(image.id) || false;
        const isInGroup = selection?.selectionState?.selectedObjects?.length > 1 && isSelected;
        
        return (
          <ImageRenderer
            key={image.id}
            imageObject={image}
            isSelected={isSelected && !isInGroup}
            isHovered={selection?.hoveredObjectId === image.id}
            onSelect={() => {
              if (selection && state.currentTool === 'select') {
                // NOTE: Original selectObjects removed - function may not exist
                const selectionWithSelectObjects = selection as any;
                if (selectionWithSelectObjects?.selectObjects && typeof selectionWithSelectObjects.selectObjects === 'function') {
                  selectionWithSelectObjects.selectObjects([{ id: image.id, type: 'image' }]);
                }
              }
            }}
            onChange={(newAttrs) => {
              if (updateImage) {
                updateImage(image.id, newAttrs);
              } else {
                updateImageState(image.id, newAttrs);
              }
            }}
            onUpdateState={() => {
              if (addToHistory) {
                addToHistory();
              }
            }}
            currentTool={state.currentTool}
            onMouseEnter={state.currentTool === 'select' ? () => {
              if (selection?.setHoveredObjectId) {
                selection.setHoveredObjectId(image.id);
              }
            } : undefined}
            onMouseLeave={state.currentTool === 'select' ? () => {
              if (selection?.setHoveredObjectId) {
                selection.setHoveredObjectId(null);
              }
            } : undefined}
            onToggleLock={() => handleToggleLock(image.id)}
            onContextMenu={onImageContextMenu}
          />
        );
      }) || null}
    </>
  );
};

export default KonvaImageOperationsHandler;
