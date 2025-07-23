import React, { useState, useRef, useEffect } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { ImageObject, Tool } from '@/types/whiteboard';
import { useObjectLocking } from '@/hooks/useObjectLocking';
import { useSelectEventHandlers } from '@/hooks/useSelectEventHandlers';

interface ImageRendererProps {
  image: ImageObject;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onChange: (newAttrs: any) => void;
  onUpdateState: () => void;
  currentTool: Tool;
  onToggleLock: () => void;
  onContextMenu: (imageId: string, x: number, y: number) => void;
}

const ImageRenderer: React.FC<ImageRendererProps> = ({
  image,
  isSelected,
  isHovered,
  onSelect,
  onChange,
  onUpdateState,
  currentTool,
  onToggleLock,
  onContextMenu
}) => {
  const [img] = useImage(image.src);
  const imageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const { isObjectLocked, toggleObjectLock } = useObjectLocking(image.id);

  useEffect(() => {
    if (isSelected && transformerRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleTransform = () => {
    if (!imageRef.current) return;

    const node = imageRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Reset scaling to 1 for accurate width/height
    node.scaleX(1);
    node.scaleY(1);

    onChange({
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: rotation
    });
  };

  return (
    <>
      <KonvaImage
        image={img}
        x={image.x}
        y={image.y}
        width={image.width}
        height={image.height}
        rotation={(image as any).rotation || 0}
        draggable={isSelected && !isObjectLocked}
        ref={imageRef}
        onClick={onSelect}
        onDblClick={onToggleLock}
        onTap={onToggleLock}
        onTransformEnd={handleTransform}
        onDragEnd={handleTransform}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default ImageRenderer;
