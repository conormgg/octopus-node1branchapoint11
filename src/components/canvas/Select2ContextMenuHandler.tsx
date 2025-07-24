import React, { useEffect } from 'react';
import SelectionContextMenu from './SelectionContextMenu';
import { SelectedObject, ImageObject } from '@/types/whiteboard';

interface Select2ContextMenuHandlerProps {
  selectedObjects: SelectedObject[];
  images: ImageObject[];
  contextMenu: {
    isVisible: boolean;
    x: number;
    y: number;
  };
  onDeleteObjects: () => void;
  onLockImages: () => void;
  onUnlockImages: () => void;
  onHideContextMenu: () => void;
  showContextMenu: () => void;
  children: React.ReactNode;
}

const Select2ContextMenuHandler: React.FC<Select2ContextMenuHandlerProps> = ({
  selectedObjects,
  images,
  contextMenu,
  onDeleteObjects,
  onLockImages,
  onUnlockImages,
  onHideContextMenu,
  showContextMenu,
  children
}) => {

  // Show context menu automatically when objects are selected
  useEffect(() => {
    if (selectedObjects.length > 0 && !contextMenu.isVisible) {
      showContextMenu();
    }
  }, [selectedObjects.length, contextMenu.isVisible, showContextMenu]);

  return (
    <>
      {children}
      
      {contextMenu.isVisible && selectedObjects.length > 0 && (
        <SelectionContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedObjects={selectedObjects}
          images={images}
          onDelete={onDeleteObjects}
          onLockImages={onLockImages}
          onUnlockImages={onUnlockImages}
          onClose={onHideContextMenu}
        />
      )}
    </>
  );
};

export default Select2ContextMenuHandler;