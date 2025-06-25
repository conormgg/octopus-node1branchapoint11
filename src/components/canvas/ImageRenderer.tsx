
import React, { useRef, useEffect } from 'react';
import { Image, Transformer } from 'react-konva';
import Konva from 'konva';
import { ImageObject } from '@/types/whiteboard';
import useImage from 'use-image';

interface ImageRendererProps {
  imageObject: ImageObject;
  isSelected: boolean;
  isHovered?: boolean;
  isInGroup?: boolean; // New prop to indicate if this image is part of a group
  onSelect: () => void;
  onChange: (newAttrs: Partial<ImageObject>) => void;
  onUpdateState: () => void;
  currentTool?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onToggleLock?: (imageId: string) => void;
  onContextMenu?: (imageId: string, x: number, y: number) => void;
}

const ImageRenderer: React.FC<ImageRendererProps> = React.memo(({
  imageObject,
  isSelected,
  isHovered = false,
  isInGroup = false, // Default to false
  onSelect,
  onChange,
  onUpdateState,
  currentTool = 'pencil',
  onMouseEnter,
  onMouseLeave,
  onToggleLock,
  onContextMenu,
}) => {
  const [image] = useImage(imageObject.src);
  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const isLocked = imageObject.locked || false;
  
  // Only show individual transformer if selected, not in group, not locked, and using select tool
  const showTransformer = isSelected && !isInGroup && !isLocked && currentTool === 'select';

  useEffect(() => {
    if (showTransformer) {
      trRef.current?.nodes([imageRef.current!]);
      trRef.current?.getLayer()?.batchDraw();
    }
  }, [showTransformer]);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isInGroup) {
      onChange({
        x: e.target.x(),
        y: e.target.y(),
      });
      onUpdateState();
    }
  };

  const handleTransformEnd = () => {
    if (!isInGroup) {
      const node = imageRef.current;
      if (node) {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(node.height() * scaleY),
          rotation: node.rotation(), // Include rotation in the update
        });
        onUpdateState();
      }
    }
  };

  const handleRightClick = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    if (onContextMenu) {
      const stage = e.target.getStage();
      if (stage) {
        const pointerPosition = stage.getPointerPosition();
        if (pointerPosition) {
          onContextMenu(imageObject.id, pointerPosition.x, pointerPosition.y);
        }
      }
    }
  };

  const handleToggleLock = () => {
    if (onToggleLock) {
      onToggleLock(imageObject.id);
    }
  };

  return (
    <>
      <Image
        onClick={onSelect}
        onTap={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onContextMenu={handleRightClick}
        ref={imageRef}
        image={image}
        x={imageObject.x}
        y={imageObject.y}
        rotation={imageObject.rotation || 0}
        draggable={showTransformer && !isInGroup} // Don't allow individual dragging when in group
        onDragStart={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        stroke={isHovered && !isSelected ? 'rgba(0, 123, 255, 0.3)' : isLocked ? 'rgba(255, 165, 0, 0.5)' : undefined}
        strokeWidth={isHovered && !isSelected ? 2 : isLocked ? 3 : 0}
        opacity={isLocked ? 0.8 : 1}
        {...(imageObject.width && { width: imageObject.width })}
        {...(imageObject.height && { height: imageObject.height })}
      />
      {showTransformer && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if these specific props change
  return (
    prevProps.imageObject.id === nextProps.imageObject.id &&
    prevProps.imageObject.src === nextProps.imageObject.src &&
    prevProps.imageObject.x === nextProps.imageObject.x &&
    prevProps.imageObject.y === nextProps.imageObject.y &&
    prevProps.imageObject.width === nextProps.imageObject.width &&
    prevProps.imageObject.height === nextProps.imageObject.height &&
    prevProps.imageObject.rotation === nextProps.imageObject.rotation &&
    prevProps.imageObject.locked === nextProps.imageObject.locked &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isInGroup === nextProps.isInGroup &&
    prevProps.currentTool === nextProps.currentTool
  );
});

export default ImageRenderer;
