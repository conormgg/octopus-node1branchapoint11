
import React, { useState } from 'react';
import ImageContextMenu from './ImageContextMenu';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';

interface KonvaImageContextMenuHandlerProps {
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  whiteboardId?: string;
  children: React.ReactNode;
}

const KonvaImageContextMenuHandler: React.FC<KonvaImageContextMenuHandlerProps> = ({
  whiteboardState,
  whiteboardId,
  children
}) => {
  const [contextMenu, setContextMenu] = useState<{ imageId: string; x: number; y: number } | null>(null);
  const { state } = whiteboardState;

  const handleContextMenu = (imageId: string, x: number, y: number) => {
    setContextMenu({ imageId, x, y });
  };

  const handleToggleLock = () => {
    if (!contextMenu) return;
    
    if ('toggleImageLock' in whiteboardState && typeof whiteboardState.toggleImageLock === 'function') {
      whiteboardState.toggleImageLock(contextMenu.imageId);
    }
    setContextMenu(null);
  };

  return (
    <>
      {React.cloneElement(children as React.ReactElement, {
        onImageContextMenu: handleContextMenu
      })}
      
      {contextMenu && (
        <ImageContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isLocked={state.images?.find(img => img.id === contextMenu.imageId)?.locked || false}
          onToggleLock={handleToggleLock}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};

export default KonvaImageContextMenuHandler;
