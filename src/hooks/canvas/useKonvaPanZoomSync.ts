
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

    console.log('[KonvaPanZoomSync] Applying transformations:', {
      x: panZoomState.x,
      y: panZoomState.y,
      scale: panZoomState.scale
    });

    // Apply transformations to stage
    stage.x(panZoomState.x);
    stage.y(panZoomState.y);
    stage.scaleX(panZoomState.scale);
    stage.scaleY(panZoomState.scale);
    
    // Force stage to redraw immediately to ensure transformations are applied
    stage.batchDraw();
    
    // Verify the transformation was applied correctly
    console.log('[KonvaPanZoomSync] Stage transformation verified:', {
      stageX: stage.x(),
      stageY: stage.y(),
      stageScaleX: stage.scaleX(),
      stageScaleY: stage.scaleY(),
      expectedX: panZoomState.x,
      expectedY: panZoomState.y,
      expectedScale: panZoomState.scale
    });
  }, [panZoomState, stageRef]);

  // Store current tool on stage for access in event handlers
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    stage.setAttr('currentTool', currentTool);
    console.log('[KonvaPanZoomSync] Tool updated on stage:', currentTool);
  }, [currentTool, stageRef]);
};
