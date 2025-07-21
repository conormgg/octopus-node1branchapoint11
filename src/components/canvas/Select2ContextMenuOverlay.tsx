
import React from 'react';
import { createPortal } from 'react-dom';
import SelectionContextMenu from './SelectionContextMenu';
import { SelectedObject } from '@/types/whiteboard';

interface Select2ContextMenuOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<any>;
  contextMenuVisible: boolean;
  contextMenuPosition: { x: number; y: number } | null;
  selectedObjects: SelectedObject[];
  onDeleteSelected: () => void;
  onToggleLock: () => void;
  onCloseContextMenu: () => void;
  hasLockedImages: boolean;
  hasUnlockedImages: boolean;
  panZoomState: { x: number; y: number; scale: number };
}

const Select2ContextMenuOverlay: React.FC<Select2ContextMenuOverlayProps> = ({
  containerRef,
  stageRef,
  contextMenuVisible,
  contextMenuPosition,
  selectedObjects,
  onDeleteSelected,
  onToggleLock,
  onCloseContextMenu,
  hasLockedImages,
  hasUnlockedImages,
  panZoomState
}) => {
  if (!contextMenuVisible || !contextMenuPosition || !containerRef.current || !stageRef.current) {
    return null;
  }

  // Convert canvas coordinates to screen coordinates
  const convertToScreenCoords = (canvasX: number, canvasY: number) => {
    const stage = stageRef.current;
    const container = containerRef.current;
    if (!stage || !container) return { x: canvasX, y: canvasY };

    const containerRect = container.getBoundingClientRect();
    
    // Apply pan and zoom transformation
    const screenX = (canvasX * panZoomState.scale) + panZoomState.x + containerRect.left;
    const screenY = (canvasY * panZoomState.scale) + panZoomState.y + containerRect.top;

    return { x: screenX, y: screenY };
  };

  const screenCoords = convertToScreenCoords(contextMenuPosition.x, contextMenuPosition.y);

  // Create portal to render outside the canvas
  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 1000 }}>
      <div style={{ pointerEvents: 'auto' }}>
        <SelectionContextMenu
          x={screenCoords.x}
          y={screenCoords.y}
          selectedObjects={selectedObjects}
          onDelete={onDeleteSelected}
          onToggleLock={onToggleLock}
          onClose={onCloseContextMenu}
          hasLockedImages={hasLockedImages}
          hasUnlockedImages={hasUnlockedImages}
        />
      </div>
    </div>,
    document.body
  );
};

export default Select2ContextMenuOverlay;
