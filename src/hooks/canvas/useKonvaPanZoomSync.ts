
import { useEffect } from 'react';
import Konva from 'konva';
import { PanZoomState, Tool } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('toolSync');

interface UseKonvaPanZoomSyncProps {
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: PanZoomState;
  currentTool: Tool;
}

export const useKonvaPanZoomSync = ({
  stageRef,
  panZoomState,
  currentTool
}: UseKonvaPanZoomSyncProps) => {
  // Sync pan/zoom state to Konva stage
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    debugLog('KonvaPanZoomSync', 'Updating stage pan/zoom', {
      x: panZoomState.x,
      y: panZoomState.y,
      scale: panZoomState.scale
    });

    stage.x(panZoomState.x);
    stage.y(panZoomState.y);
    stage.scaleX(panZoomState.scale);
    stage.scaleY(panZoomState.scale);
    stage.batchDraw();
  }, [stageRef, panZoomState]);

  // Sync current tool to stage attribute - CRITICAL FOR TOUCH SELECTION
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      debugLog('KonvaPanZoomSync', 'No stage reference for tool sync', { currentTool });
      return;
    }

    const previousTool = stage.getAttr('currentTool');
    
    debugLog('KonvaPanZoomSync', 'Setting currentTool on stage', {
      previousTool,
      newTool: currentTool,
      toolChanged: previousTool !== currentTool,
      stageExists: !!stage
    });

    stage.setAttr('currentTool', currentTool);
    
    // Verify the attribute was set correctly
    const verifyTool = stage.getAttr('currentTool');
    debugLog('KonvaPanZoomSync', 'Tool attribute verification', {
      requested: currentTool,
      actual: verifyTool,
      success: verifyTool === currentTool
    });

  }, [stageRef, currentTool]);

  // Add periodic verification logging
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const verifyInterval = setInterval(() => {
      const stageAttr = stage.getAttr('currentTool');
      debugLog('KonvaPanZoomSync', 'Periodic tool verification', {
        expectedTool: currentTool,
        stageAttr,
        match: stageAttr === currentTool,
        stageAttrType: typeof stageAttr,
        currentToolType: typeof currentTool
      });
    }, 3000);

    return () => clearInterval(verifyInterval);
  }, [stageRef, currentTool]);
};
