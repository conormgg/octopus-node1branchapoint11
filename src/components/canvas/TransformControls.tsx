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

  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const rad = (rotation * Math.PI) / 180;

  const rotatePoint = (x: number, y: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const newX = dx * Math.cos(rad) - dy * Math.sin(rad) + centerX;
    const newY = dx * Math.sin(rad) + dy * Math.cos(rad) + centerY;
    return { x: newX, y: newY };
  };

  const handles = [
    { type: 'nw', ...rotatePoint(bounds.x, bounds.y) },
    { type: 'n', ...rotatePoint(bounds.x + bounds.width / 2, bounds.y) },
    { type: 'ne', ...rotatePoint(bounds.x + bounds.width, bounds.y) },
    { type: 'e', ...rotatePoint(bounds.x + bounds.width, bounds.y + bounds.height / 2) },
    { type: 'se', ...rotatePoint(bounds.x + bounds.width, bounds.y + bounds.height) },
    { type: 's', ...rotatePoint(bounds.x + bounds.width / 2, bounds.y + bounds.height) },
    { type: 'sw', ...rotatePoint(bounds.x, bounds.y + bounds.height) },
    { type: 'w', ...rotatePoint(bounds.x, bounds.y + bounds.height / 2) }
  ];

  const rotationHandle = rotatePoint(
    bounds.x + bounds.width / 2,
    bounds.y - rotationHandleOffset
  );

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

  const groupProps = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    rotation: rotation,
  };

  return (
    <Group listening={false}>
      {/* Selection border */}
      <Rect
        {...groupProps}
        fill="transparent"
        stroke="hsl(var(--primary))"
        strokeWidth={1 / zoom}
        dash={[4 / zoom, 4 / zoom]}
        listening={false}
        offsetX={bounds.width / 2}
        offsetY={bounds.height / 2}
        x={bounds.x + bounds.width / 2}
        y={bounds.y + bounds.height / 2}
      />

      {/* Resize handles */}
      {handles.map((handle) => (
        <Rect
          key={handle.type}
          x={handle.x}
          y={handle.y}
          width={handleSize}
          height={handleSize}
          fill="hsl(var(--background))"
          stroke="hsl(var(--primary))"
          strokeWidth={1 / zoom}
          rotation={rotation}
          offsetX={handleSize / 2}
          offsetY={handleSize / 2}
          listening={false}
        />
      ))}

      {/* Rotation handle line */}
      <Line
        points={[
          rotationHandle.x,
          rotationHandle.y,
          centerX,
          centerY,
        ]}
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
