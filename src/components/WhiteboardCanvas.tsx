import React from 'react';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import KonvaStage from './canvas/KonvaStage';

interface WhiteboardCanvasProps {
  width: number;
  height: number;
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  isReadOnly?: boolean;
}

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
