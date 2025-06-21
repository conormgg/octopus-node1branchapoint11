
import React from 'react';
import { Rect } from 'react-konva';
import { SelectionBounds } from '@/types/whiteboard';

interface SelectionRectProps {
  selectionBounds: SelectionBounds | null;
  isVisible: boolean;
}

const SelectionRect: React.FC<SelectionRectProps> = ({
  selectionBounds,
  isVisible
}) => {
  console.log('[DEBUG] SelectionRect render - isVisible:', isVisible, 'selectionBounds:', selectionBounds);

  if (!isVisible || !selectionBounds) {
    console.log('[DEBUG] SelectionRect not rendering - isVisible:', isVisible, 'selectionBounds:', selectionBounds);
    return null;
  }

  console.log('[DEBUG] SelectionRect rendering with bounds:', selectionBounds);

  return (
    <Rect
      x={selectionBounds.x}
      y={selectionBounds.y}
      width={selectionBounds.width}
      height={selectionBounds.height}
      fill="rgba(0, 123, 255, 0.1)"
      stroke="rgba(0, 123, 255, 0.8)"
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  );
};

export default SelectionRect;
