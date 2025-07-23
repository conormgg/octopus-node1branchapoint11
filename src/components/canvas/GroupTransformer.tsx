
import React, { useRef, useEffect } from 'react';
import { Transformer } from 'react-konva';
import Konva from 'konva';

interface GroupTransformerProps {
  targetRef: React.RefObject<Konva.Group>;
  isVisible: boolean;
  selectedObjectsLength: number;
  onTransformStart: () => void;
  onTransformEnd: () => void;
}

const GroupTransformer: React.FC<GroupTransformerProps> = ({
  targetRef,
  isVisible,
  selectedObjectsLength,
  onTransformStart,
  onTransformEnd
}) => {
  const transformerRef = useRef<Konva.Transformer>(null);

  // Set up transformer when group is created
  useEffect(() => {
    if (isVisible && targetRef.current && transformerRef.current) {
      transformerRef.current.nodes([targetRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isVisible, selectedObjectsLength, targetRef]);

  // Update transformer bounds when objects change position
  useEffect(() => {
    if (isVisible && transformerRef.current && targetRef.current) {
      // Force transformer to recalculate bounds
      transformerRef.current.forceUpdate();
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <Transformer
      ref={transformerRef}
      boundBoxFunc={(oldBox, newBox) => {
        // Limit minimum size
        if (newBox.width < 10 || newBox.height < 10) {
          return oldBox;
        }
        return newBox;
      }}
      enabledAnchors={[
        'top-left', 'top-right', 'bottom-left', 'bottom-right',
        'middle-left', 'middle-right', 'top-center', 'bottom-center'
      ]}
      rotateEnabled={true}
      resizeEnabled={true}
      onTransformStart={onTransformStart}
      onTransformEnd={onTransformEnd}
    />
  );
};

export default GroupTransformer;
