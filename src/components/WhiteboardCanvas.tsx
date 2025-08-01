
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
  const isDrawing = whiteboardState.state.isDrawing || false;
  const isDrawingTool = whiteboardState.state.currentTool === 'pencil' || 
                       whiteboardState.state.currentTool === 'highlighter' || 
                       whiteboardState.state.currentTool === 'eraser';

  // Apply stricter CSS classes during drawing
  const canvasClasses = `relative w-full h-full bg-white rounded-lg overflow-hidden select-none ${
    isDrawing && isDrawingTool ? 'prevent-magnifier' : 'drawing-background'
  }`;

  return (
    <div 
      className={canvasClasses}
      style={{ 
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none' as any,
        touchAction: isDrawing && isDrawingTool ? 'none' : 'auto',
        userSelect: 'none',
        pointerEvents: 'auto'
      } as React.CSSProperties}
      data-whiteboard-canvas="true"
    >
      <KonvaStage
        width={width}
        height={height}
        whiteboardState={whiteboardState}
        isReadOnly={isReadOnly}
        palmRejectionConfig={palmRejectionConfig}
        normalizedState={whiteboardState.normalizedState}
      />
      
      {/* Zoom indicator */}
      {whiteboardState.state.panZoomState.scale !== 1 && (
        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm pointer-events-none select-none">
          {Math.round(whiteboardState.state.panZoomState.scale * 100)}%
        </div>
      )}
    </div>
  );
};

export default WhiteboardCanvas;
