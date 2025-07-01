import React, { useRef } from 'react';
import Konva from 'konva';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
import { usePalmRejection } from '@/hooks/usePalmRejection';
import { useStageEventHandlers } from '@/hooks/useStageEventHandlers';
import { useKonvaKeyboardHandlers } from '@/hooks/canvas/useKonvaKeyboardHandlers';
import { useKonvaPanZoomSync } from '@/hooks/canvas/useKonvaPanZoomSync';
import KonvaStageCanvas from './KonvaStageCanvas';
import KonvaImageContextMenuHandler from './KonvaImageContextMenuHandler';
import KonvaImageOperationsHandler from './KonvaImageOperationsHandler';

interface KonvaStageProps {
  width: number;
  height: number;
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  isReadOnly?: boolean;
  palmRejectionConfig?: {
    maxContactSize: number;
    minPressure: number;
    palmTimeoutMs: number;
    clusterDistance: number;
    preferStylus: boolean;
    enabled: boolean;
  };
  normalizedState?: ReturnType<typeof useNormalizedWhiteboardState>;
  stageRef?: React.RefObject<any>;
}

const KonvaStage: React.FC<KonvaStageProps> = ({
  width,
  height,
  whiteboardState,
  isReadOnly = false,
  palmRejectionConfig = {
    maxContactSize: 40,
    minPressure: 0.1,
    palmTimeoutMs: 500,
    clusterDistance: 100,
    preferStylus: true,
    enabled: true
  },
  normalizedState,
  stageRef: externalStageRef
}) => {
  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = externalStageRef || internalStageRef;
  const layerRef = useRef<Konva.Layer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    panZoom,
    selection,
    updateLine
  } = whiteboardState;

  // Get whiteboard ID for this instance with proper typing
  const whiteboardId: string = 'whiteboardId' in whiteboardState && typeof whiteboardState.whiteboardId === 'string' 
    ? whiteboardState.whiteboardId 
    : 'default';

  const palmRejection = usePalmRejection(palmRejectionConfig);

  // Use focused hooks for specific functionality
  useKonvaPanZoomSync({
    stageRef,
    panZoomState: state.panZoomState,
    currentTool: state.currentTool
  });

  useKonvaKeyboardHandlers({
    containerRef,
    whiteboardState,
    isReadOnly,
    whiteboardId
  });

  // Set up all event handlers
  useStageEventHandlers({
    containerRef,
    stageRef,
    panZoomState: state.panZoomState,
    palmRejection,
    palmRejectionConfig,
    panZoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isReadOnly
  });

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full select-none outline-none" 
      style={{ 
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: palmRejectionConfig.enabled ? 'manipulation' : 'auto'
      }}
      tabIndex={0}
      data-whiteboard-id={whiteboardId}
    >
      <KonvaImageContextMenuHandler
        whiteboardState={whiteboardState}
        whiteboardId={whiteboardId}
      >
        <KonvaStageCanvas
          width={width}
          height={height}
          stageRef={stageRef}
          layerRef={layerRef}
          lines={state.lines}
          images={state.images}
          currentTool={state.currentTool}
          panZoomState={state.panZoomState}
          palmRejectionConfig={palmRejectionConfig}
          panZoom={panZoom}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          isReadOnly={isReadOnly}
          onStageClick={(e) => {
            const clickedOnEmpty = e.target === e.target.getStage();
            if (clickedOnEmpty && selection) {
              selection.clearSelection();
            }
          }}
          selectionBounds={selection?.selectionState?.selectionBounds || null}
          isSelecting={selection?.selectionState?.isSelecting || false}
          selection={selection}
          onUpdateLine={updateLine}
          onUpdateImage={(imageId, updates) => {
            if ('updateImage' in whiteboardState && whiteboardState.updateImage) {
              whiteboardState.updateImage(imageId, updates);
            }
          }}
          onTransformEnd={() => {
            if ('addToHistory' in whiteboardState && whiteboardState.addToHistory) {
              whiteboardState.addToHistory();
            }
          }}
          normalizedState={normalizedState}
          extraContent={
            <KonvaImageOperationsHandler
              whiteboardState={whiteboardState}
              whiteboardId={whiteboardId}
            />
          }
        />
      </KonvaImageContextMenuHandler>
    </div>
  );
};

export default KonvaStage;
