import React from 'react';
import { Group, Rect, Circle, Line } from 'react-konva';
import { SelectionBounds } from '@/types/whiteboard';

interface TransformControlsProps {
  bounds: SelectionBounds;
  isVisible: boolean;
  onHandleMouseDown: (handleType: string, e: any) => void;
  zoom: number;
  rotation?: number;
}

export const TransformControls: React.FC<TransformControlsProps> = ({
  bounds,
  isVisible,
  onHandleMouseDown,
  zoom,
  rotation = 0
}) => {
  if (!isVisible || !bounds) return null;

  // Scale handle size based on zoom level for consistent visual size
  const handleSize = Math.max(8, 12 / zoom);
  const rotationHandleOffset = Math.max(20, 30 / zoom);

  // Center of the bounding box
  const centerX = bounds.width / 2;
  const centerY = bounds.height / 2;

  // Calculate handle positions relative to the center
  const handles = [
    { type: 'nw', x: 0, y: 0 },
    { type: 'n', x: centerX, y: 0 },
    { type: 'ne', x: bounds.width, y: 0 },
    { type: 'e', x: bounds.width, y: centerY },
    { type: 'se', x: bounds.width, y: bounds.height },
    { type: 's', x: centerX, y: bounds.height },
    { type: 'sw', x: 0, y: bounds.height },
    { type: 'w', x: 0, y: centerY }
  ];

  // Rotation handle position (above the selection)
  const rotationHandle = {
    x: centerX,
    y: -rotationHandleOffset
  };

  const getCursor = (handleType: string) => {
    switch (handleType) {
      case 'nw':
      case 'se':
        return 'nw-resize';
      case 'ne':
      case 'sw':
        return 'ne-resize';
      case 'n':
      case 's':
        return 'ns-resize';
      case 'e':
      case 'w':
        return 'ew-resize';
      case 'rotate':
        return 'grab';
      default:
        return 'default';
    }
  };

  return (
    <Group
      x={bounds.x + bounds.width / 2}
      y={bounds.y + bounds.height / 2}
      rotation={rotation}
      offsetX={bounds.width / 2}
      offsetY={bounds.height / 2}
    >
      {/* Selection border */}
      <Rect
        x={0}
        y={0}
        width={bounds.width}
        height={bounds.height}
        fill="transparent"
        stroke="hsl(var(--primary))"
        strokeWidth={1 / zoom}
        dash={[4 / zoom, 4 / zoom]}
        listening={false}
      />

      {/* Resize handles */}
      {handles.map((handle) => (
        <Rect
          key={handle.type}
          x={handle.x - handleSize / 2}
          y={handle.y - handleSize / 2}
          width={handleSize}
          height={handleSize}
          fill="hsl(var(--background))"
          stroke="hsl(var(--primary))"
          strokeWidth={1 / zoom}
          listening={false}
          rotation={-rotation} // Counter-rotate handles to keep them upright
        />
      ))}

      {/* Rotation handle line */}
      <Line
        points={[centerX, 0, rotationHandle.x, rotationHandle.y]}
        stroke="hsl(var(--primary))"
        strokeWidth={1 / zoom}
        listening={false}
      />

      {/* Rotation handle */}
      <Circle
        x={rotationHandle.x}
        y={rotationHandle.y}
        radius={handleSize / 2}
        fill="hsl(var(--background))"
        stroke="hsl(var(--primary))"
        strokeWidth={1 / zoom}
        listening={false}
      />
    </Group>
  );
};
