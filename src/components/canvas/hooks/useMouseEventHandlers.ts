
import { useMemo } from 'react';
import Konva from 'konva';
import { useStageCoordinates } from '@/hooks/useStageCoordinates';
import { Tool, PanZoomState } from '@/types/whiteboard';
import { useMemoizedEventHandlers } from '@/hooks/performance/useMemoizedEventHandlers';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

interface UseMouseEventHandlersProps {
  currentTool: Tool;
  panZoomState: PanZoomState;
  palmRejectionConfig: { enabled: boolean };
  panZoom: {
    startPan: (x: number, y: number) => void;
    continuePan: (x: number, y: number) => void;
    stopPan: () => void;
  };
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
  onStageClick?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  selection?: {
    setHoveredObjectId?: (id: string | null) => void;
  };
}

export const useMouseEventHandlers = ({
  currentTool,
  panZoomState,
  palmRejectionConfig,
  panZoom,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly,
  onStageClick,
  selection
}: UseMouseEventHandlersProps) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  // Memoize stable values to prevent unnecessary re-renders
  const stableCurrentTool = useMemo(() => currentTool, [currentTool]);
  const stablePalmRejectionEnabled = useMemo(() => palmRejectionConfig.enabled, [palmRejectionConfig.enabled]);
  const stableIsReadOnly = useMemo(() => isReadOnly, [isReadOnly]);

  // Use memoized event handlers for stability
  const handlers = useMemoizedEventHandlers({
    handleMouseDown: {
      handler: (e: Konva.KonvaEventObject<MouseEvent>) => {
        debugLog('MouseEvents', `mousedown from mouse`, {
          button: e.evt.button,
          buttons: e.evt.buttons,
          currentTool: stableCurrentTool,
          palmRejectionEnabled: stablePalmRejectionEnabled
        });
        
        // Handle right-click pan - works for everyone, including read-only users
        if (e.evt.button === 2) {
          panZoom.startPan(e.evt.clientX, e.evt.clientY);
          // Clear hover state when starting pan to prevent jerky behavior
          if (selection?.setHoveredObjectId) {
            selection.setHoveredObjectId(null);
          }
          return;
        }
        
        // Call the stage click handler for tools that need it
        if (onStageClick) {
          onStageClick(e);
        }
        
        // Only proceed with drawing/selection if not in read-only mode
        if (stableIsReadOnly) return;
        
        const stage = e.target.getStage();
        if (!stage) return;

        const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
        handlePointerDown(x, y);
      },
      deps: [panZoom, selection, stableCurrentTool, stableIsReadOnly, onStageClick, stablePalmRejectionEnabled, getRelativePointerPosition, handlePointerDown]
    },

    handleMouseMove: {
      handler: (e: Konva.KonvaEventObject<MouseEvent>) => {
        debugLog('MouseEvents', `mousemove from mouse`, {
          button: e.evt.button,
          buttons: e.evt.buttons,
          currentTool: stableCurrentTool,
          palmRejectionEnabled: stablePalmRejectionEnabled
        });
        
        // Handle right-click pan - works for everyone, including read-only users
        if (e.evt.buttons === 2) {
          e.evt.preventDefault();
          panZoom.continuePan(e.evt.clientX, e.evt.clientY);
          // Clear hover state during pan to prevent jerky behavior
          if (selection?.setHoveredObjectId) {
            selection.setHoveredObjectId(null);
          }
          return;
        }
        
        // Only proceed with drawing/selection if not in read-only mode
        if (stableIsReadOnly) return;
        
        const stage = e.target.getStage();
        if (!stage) return;

        const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
        handlePointerMove(x, y);
      },
      deps: [panZoom, selection, stableIsReadOnly, stablePalmRejectionEnabled, stableCurrentTool, getRelativePointerPosition, handlePointerMove]
    },

    handleMouseUp: {
      handler: (e: Konva.KonvaEventObject<MouseEvent>) => {
        debugLog('MouseEvents', `mouseup from mouse`, {
          button: e.evt.button,
          currentTool: stableCurrentTool
        });
        
        // Handle right-click pan end - works for everyone, including read-only users
        if (e.evt.button === 2) {
          panZoom.stopPan();
          return;
        }
        
        // Only proceed with drawing/selection if not in read-only mode
        if (stableIsReadOnly) return;
        
        handlePointerUp();
      },
      deps: [panZoom, stableIsReadOnly, stablePalmRejectionEnabled, stableCurrentTool, handlePointerUp]
    }
  });

  return handlers;
};
