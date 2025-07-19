
import { useEffect } from 'react';
import Konva from 'konva';
import { PanZoomState } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('panZoom');

interface UseKonvaPanZoomSyncProps {
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: PanZoomState;
  currentTool: string;
}

export const useKonvaPanZoomSync = ({
  stageRef,
  panZoomState,
  currentTool
}: UseKonvaPanZoomSyncProps) => {
  // Apply pan/zoom transformations to the stage
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Set stage position and scale to match our pan/zoom state
    stage.x(panZoomState.x);
    stage.y(panZoomState.y);
    stage.scaleX(panZoomState.scale);
    stage.scaleY(panZoomState.scale);

    debugLog('StageSync', 'Stage position updated', {
      panZoomState,
      stagePosition: { x: stage.x(), y: stage.y() },
      stageScale: { x: stage.scaleX(), y: stage.scaleY() }
    });

    // Force stage to update its internal transformations
    stage.batchDraw();
  }, [panZoomState, stageRef]);

  // Store current tool on stage for access in event handlers
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    stage.setAttr('currentTool', currentTool);
  }, [currentTool, stageRef]);
};
