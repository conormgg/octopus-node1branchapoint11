
import React from 'react';
import { Layer } from 'react-konva';

interface ImagesLayerProps {
  extraContent?: React.ReactNode;
}

const ImagesLayer: React.FC<ImagesLayerProps> = ({ extraContent }) => {
  return (
    <Layer>
      {extraContent}
    </Layer>
  );
};

export default ImagesLayer;
