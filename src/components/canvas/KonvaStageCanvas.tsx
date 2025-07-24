
import React, { useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useKonvaPanZoomSync } from '@/hooks/canvas/useKonvaPanZoomSync';
import { useKonvaKeyboardHandlers } from '@/hooks/canvas/useKonvaKeyboardHandlers';
import ImagesLayer from './layers/ImagesLayer';
import LinesLayer from './layers/LinesLayer';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

interface KonvaStageCanvasProps {
  width: number;
  height: number;
  whiteboardState: any;
  isReadOnly?: boolean;
  palmRejectionConfig?: any;
  normalizedState?: any;
}

const KonvaStageCanvas: React.FC<KonvaStageCanvasProps> = ({
  width,
  height,
  whiteboardState,
  isReadOnly = false,
  palmRejectionConfig,
  normalizedState
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  debugLog('KonvaStageCanvas', 'Rendering', {
    isReadOnly,
    linesCount: whiteboardState.state.lines.length,
    imagesCount: whiteboardState.state.images.length
  });

  // Extract state for cleaner access
  const { state } = whiteboardState;

  // Set up pan/zoom synchronization
  useKonvaPanZoomSync({
    stageRef,
    panZoomState: state.panZoomState,
    currentTool: state.currentTool
  });

  // Set up keyboard handlers
  useKonvaKeyboardHandlers({
    containerRef,
    whiteboardState,
    isReadOnly
  });

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ 
        touchAction: 'none'
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={state.panZoomState.scale}
        scaleY={state.panZoomState.scale}
        x={state.panZoomState.x}
        y={state.panZoomState.y}
      >
        <Layer>
          <LinesLayer 
            layerRef={useRef<Konva.Layer>(null)}
            lines={state.lines}
            images={state.images}
            currentTool={state.currentTool}
            normalizedState={normalizedState}
            onUpdateLine={whiteboardState.updateLine}
            onUpdateImage={whiteboardState.updateImage}
            stageRef={stageRef}
          />
          <ImagesLayer />
        </Layer>
      </Stage>
    </div>
  );
};

export default KonvaStageCanvas;
