
import React from 'react';
import { Rect } from 'react-konva';
import { GroupBounds } from '@/utils/groupBoundsCalculator';

interface SelectionGroupBackgroundProps {
  groupBounds: GroupBounds | null;
  isGroupPositioned?: boolean;
}

const SelectionGroupBackground: React.FC<SelectionGroupBackgroundProps> = ({ 
  groupBounds, 
  isGroupPositioned = false 
}) => {
  if (!groupBounds) {
    return null;
  }

  return (
    <Rect
      name="group-background"
      x={isGroupPositioned ? 0 : groupBounds.x}
      y={isGroupPositioned ? 0 : groupBounds.y}
      width={groupBounds.width}
      height={groupBounds.height}
      fill="transparent"
      listening={true}
    />
  );
};

export default SelectionGroupBackground;
