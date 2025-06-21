
import React, { useRef, useEffect } from 'react';
import Konva from 'konva';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
import KonvaStageCanvas from './KonvaStageCanvas';

interface KonvaStageProps {
  width: number;
  height: number;
  whiteboardState: any;
  isReadOnly?: boolean;
  palmRejectionConfig?: any;
  normalizedState?: ReturnType<typeof useNormalizedWhiteboardState>;
}

const KonvaStage: React.FC<KonvaStageProps> = ({
  width,
  height,
  whiteboardState,
  isReadOnly = false,
  palmRejectionConfig,
  normalizedState
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);

  return (
    <KonvaStageCanvas
      width={width}
      height={height}
      stageRef={stageRef}
      layerRef={layerRef}
      lines={whiteboardState.state.lines}
      images={whiteboardState.state.images}
      currentTool={whiteboardState.state.currentTool}
      panZoomState={whiteboardState.state.panZoomState}
      palmRejectionConfig={palmRejectionConfig || { enabled: false }}
      panZoom={whiteboardState.panZoom}
      handlePointerDown={whiteboardState.handlePointerDown}
      handlePointerMove={whiteboardState.handlePointerMove}
      handlePointerUp={whiteboardState.handlePointerUp}
      isReadOnly={isReadOnly}
      selectionBounds={whiteboardState.state.selectionState?.selectionBounds}
      isSelecting={whiteboardState.state.selectionState?.isSelecting}
      selection={whiteboardState.selection}
      onUpdateLine={whiteboardState.updateLine}
      onUpdateImage={whiteboardState.updateImage}
      onTransformEnd={whiteboardState.addToHistory}
      normalizedState={normalizedState}
    />
  );
};

export default KonvaStage;
