
import React, { useRef, useEffect } from 'react';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { useWheelEventHandlers } from '@/hooks/eventHandling/useWheelEventHandlers';
import { useTouchEventHandlers } from '@/hooks/eventHandling/useTouchEventHandlers';
import { usePointerEventDetection } from '@/hooks/eventHandling/usePointerEventDetection';
import { useEventDebug } from '@/hooks/eventHandling/useEventDebug';
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

  // Event handling setup
  const { supportsPointerEvents } = usePointerEventDetection();
  const { logEventHandling } = useEventDebug();

  // Add wheel event handling for zoom
  useWheelEventHandlers({
    containerRef,
    panZoom: whiteboardState.panZoom
  });

  // Add touch event handling for advanced gestures
  useTouchEventHandlers({
    containerRef,
    panZoom: whiteboardState.panZoom,
    logEventHandling,
    supportsPointerEvents,
    palmRejectionEnabled: palmRejectionConfig?.enabled || false,
    currentTool: whiteboardState.state.currentTool
  });

  // Keyboard shortcuts for panning
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isSpacePressed = false;
    let wasSpacePanning = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        isSpacePressed = true;
        wasSpacePanning = false;
        // Don't prevent default yet - only when actually panning
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isSpacePressed) {
        isSpacePressed = false;
        if (wasSpacePanning) {
          whiteboardState.panZoom.stopPan();
          wasSpacePanning = false;
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (isSpacePressed && e.button === 0) {
        e.preventDefault();
        whiteboardState.panZoom.startPan(e.clientX, e.clientY);
        wasSpacePanning = true;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isSpacePressed && wasSpacePanning) {
        e.preventDefault();
        whiteboardState.panZoom.continuePan(e.clientX, e.clientY);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isSpacePressed && wasSpacePanning && e.button === 0) {
        e.preventDefault();
        whiteboardState.panZoom.stopPan();
        wasSpacePanning = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
    };
  }, [whiteboardState.panZoom]);

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
      data-whiteboard-id="main-canvas"
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
