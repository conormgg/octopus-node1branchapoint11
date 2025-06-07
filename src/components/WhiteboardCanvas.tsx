
import React from 'react';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import KonvaStage from './canvas/KonvaStage';

interface PalmRejectionConfig {
  maxContactSize: number;
  minPressure: number;
  palmTimeoutMs: number;
  clusterDistance: number;
  preferStylus: boolean;
  enabled: boolean;
}

interface WhiteboardCanvasProps {
  width: number;
  height: number;
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  isReadOnly?: boolean;
  palmRejectionConfig?: PalmRejectionConfig;
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  width,
  height,
  whiteboardState,
  isReadOnly = false,
  palmRejectionConfig
}) => {
  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
      <KonvaStage
        width={width}
        height={height}
        whiteboardState={whiteboardState}
        isReadOnly={isReadOnly}
        palmRejectionConfig={palmRejectionConfig}
      />
      
      {/* Zoom indicator */}
      {whiteboardState.state.panZoomState.scale !== 1 && (
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
          {Math.round(whiteboardState.state.panZoomState.scale * 100)}%
        </div>
      )}
    </div>
  );
};

export default WhiteboardCanvas;
