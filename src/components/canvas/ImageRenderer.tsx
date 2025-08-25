
import React, { useRef, useEffect } from 'react';
import { Image } from 'react-konva';
import Konva from 'konva';
import { ImageObject } from '@/types/whiteboard';
import useImage from 'use-image';

interface ImageRendererProps {
  imageObject: ImageObject;
  isSelected: boolean;
  isHovered?: boolean;
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
  


  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const width = imageObject.width || 100;
    const height = imageObject.height || 100;
    onChange({
      x: e.target.x() - width / 2,
      y: e.target.y() - height / 2,
    });
    onUpdateState();
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

  const isLocked = imageObject.locked || false;

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
        x={imageObject.x + (imageObject.width || 100) / 2}
        y={imageObject.y + (imageObject.height || 100) / 2}
        offsetX={(imageObject.width || 100) / 2}
        offsetY={(imageObject.height || 100) / 2}
        rotation={imageObject.rotation || 0}
        
        draggable={currentTool === 'select2' && isSelected && !isLocked}
        onDragStart={onSelect}
        onDragEnd={handleDragEnd}
        
        stroke={isHovered && !isSelected ? 'rgba(0, 123, 255, 0.3)' : isLocked ? 'rgba(255, 165, 0, 0.5)' : undefined}
        strokeWidth={isHovered && !isSelected ? 2 : isLocked ? 3 : 0}
        opacity={isLocked ? 0.8 : 1}
        {...(imageObject.width && { width: imageObject.width })}
        {...(imageObject.height && { height: imageObject.height })}
      />
    </>
  );
}, (prevProps, nextProps) => {
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
    prevProps.currentTool === nextProps.currentTool
  );
});

export default ImageRenderer;
