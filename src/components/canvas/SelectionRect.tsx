import React from 'react';
import { Rect } from 'react-konva';
import { SelectionBounds } from '@/types/whiteboard';

interface SelectionRectProps {
  selectionBounds: SelectionBounds | null;
  isVisible: boolean;
  rotation?: number;
  imageCenter?: { x: number; y: number };
}

const SelectionRect: React.FC<SelectionRectProps> = ({
  selectionBounds,
  isVisible,
  rotation = 0,
  imageCenter
}) => {
  if (!isVisible || !selectionBounds) {
    return null;
  }

  // Calculate rotation position - if we have an image center, rotate around that
  let rectX = selectionBounds.x;
  let rectY = selectionBounds.y;
  let offsetX = 0;
  let offsetY = 0;

  if (rotation !== 0 && imageCenter) {
    // For rotated images, position the selection rect to rotate around the image center
    rectX = imageCenter.x;
    rectY = imageCenter.y;
    offsetX = selectionBounds.width / 2;
    offsetY = selectionBounds.height / 2;
  }

  return (
    <Rect
      x={rectX}
      y={rectY}
      width={selectionBounds.width}
      height={selectionBounds.height}
      rotation={rotation}
      offsetX={offsetX}
      offsetY={offsetY}
      fill="rgba(0, 123, 255, 0.1)"
      stroke="rgba(0, 123, 255, 0.8)"
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  );
};

export default SelectionRect;
