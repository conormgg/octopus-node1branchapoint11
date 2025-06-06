
import React from 'react';
import KonvaStage from './canvas/KonvaStage';
import { WhiteboardCanvasProps } from '@/types/unifiedWhiteboard';

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  width,
  height,
  whiteboardState,
  isReadOnly = false
}) => {
  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
      <KonvaStage
        width={width}
        height={height}
        whiteboardState={whiteboardState}
        isReadOnly={isReadOnly}
      />
    </div>
  );
};

export default WhiteboardCanvas;
