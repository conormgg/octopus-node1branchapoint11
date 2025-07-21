import React from 'react';
import ImageRenderer from './ImageRenderer';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { SelectedObject } from '@/types/whiteboard';

interface KonvaImageOperationsHandlerProps {
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  whiteboardId?: string;
  select2State?: {
    selectedObjects: SelectedObject[];
    hoveredObjectId: string | null;
    // ... other select2 state properties
  };
  onImageContextMenu?: (imageId: string, x: number, y: number) => void;
}

const KonvaImageOperationsHandler: React.FC<KonvaImageOperationsHandlerProps> = ({
  whiteboardState,
  whiteboardId,
  select2State,
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
        // Check selection state for both select and select2 tools
        const isSelectedInSelect = selection?.isObjectSelected(image.id) || false;
        const isSelectedInSelect2 = select2State?.selectedObjects?.some(obj => obj.id === image.id) || false;
        const isSelected = (state.currentTool === 'select' && isSelectedInSelect) || 
                          (state.currentTool === 'select2' && isSelectedInSelect2);
        
        const isInGroup = selection?.selectionState?.selectedObjects?.length > 1 && isSelectedInSelect;
        
        return (
          <ImageRenderer
            key={image.id}
            imageObject={image}
            isSelected={isSelected && !isInGroup}
            isHovered={selection?.hoveredObjectId === image.id}
            onSelect={() => {
              if (selection && state.currentTool === 'select') {
                selection.selectObjects([{ id: image.id, type: 'image' }]);
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
