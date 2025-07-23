
import React, { useRef } from 'react';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { useWheelEventHandlers } from '@/hooks/eventHandling/useWheelEventHandlers';
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
  whiteboardState: any; // Simplified for now to avoid type conflicts
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
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = whiteboardState.state.isDrawing || false;
  const isDrawingTool = whiteboardState.state.currentTool === 'pencil' || 
                       whiteboardState.state.currentTool === 'highlighter' || 
                       whiteboardState.state.currentTool === 'eraser';

  // Add wheel event handling for zoom
  useWheelEventHandlers({
    containerRef,
    panZoom: whiteboardState.panZoom
  });

  // Apply stricter CSS classes during drawing
  const canvasClasses = `relative w-full h-full bg-white rounded-lg overflow-hidden select-none ${
    isDrawing && isDrawingTool ? 'prevent-magnifier' : 'drawing-background'
  }`;

  return (
    <div 
      ref={containerRef}
      className={canvasClasses}
      style={{ 
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: isDrawing && isDrawingTool ? 'none' : 'auto',
        userSelect: 'none',
        pointerEvents: 'auto'
      }}
      data-whiteboard-canvas="true"
      tabIndex={0} // Make focusable for keyboard events
    >
      <KonvaStage
        width={width}
        height={height}
        whiteboardState={whiteboardState}
        isReadOnly={isReadOnly}
        palmRejectionConfig={palmRejectionConfig}
        normalizedState={whiteboardState.normalizedState}
        containerRef={containerRef}
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
