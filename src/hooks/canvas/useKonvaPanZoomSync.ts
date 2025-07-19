
import { useEffect } from 'react';
import Konva from 'konva';
import { PanZoomState } from '@/types/whiteboard';

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

    stage.x(panZoomState.x);
    stage.y(panZoomState.y);
    stage.scaleX(panZoomState.scale);
    stage.scaleY(panZoomState.scale);
  }, [panZoomState, stageRef]);

  // Store current tool on stage for access in event handlers
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    stage.setAttr('currentTool', currentTool);
  }, [currentTool, stageRef]);
};
