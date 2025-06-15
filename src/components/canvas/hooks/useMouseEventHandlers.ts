
import { useCallback, useMemo } from 'react';
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
  selection?: any;
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

  // Log mouse events with stable reference - using centralized debug system
  const logMouseEvent = useCallback((eventType: string, e: any) => {
    debugLog('MouseEvents', `${eventType} from mouse`, {
      button: e.evt.button,
      buttons: e.evt.buttons,
      currentTool: stableCurrentTool,
      palmRejectionEnabled: stablePalmRejectionEnabled
    });
  }, [stableCurrentTool, stablePalmRejectionEnabled]);

  // Use memoized event handlers for stability
  const handlers = useMemoizedEventHandlers({
    handleMouseDown: {
      handler: (e: Konva.KonvaEventObject<MouseEvent>) => {
        logMouseEvent('mousedown', e);
        
        // Handle right-click pan - works for everyone, including read-only users
        if (e.evt.button === 2) {
          panZoom.startPan(e.evt.clientX, e.evt.clientY);
          // Clear hover state when starting pan to prevent jerky behavior
          if (selection?.setHoveredObjectId) {
            selection.setHoveredObjectId(null);
          }
          return;
        }
        
        // Handle selection tool clicks
        if (stableCurrentTool === 'select' && selection && !stableIsReadOnly) {
          // Check if we clicked on a line or image
          const clickedShape = e.target;
          if (clickedShape && clickedShape !== e.target.getStage()) {
            // Don't handle the click here - let the shape's onClick handler deal with it
            // This allows dragging to work properly
            return;
          }
          // For empty space clicks with select tool, let handlePointerDown handle it
          // so that drag-to-select can work
        } else if (onStageClick && stableCurrentTool !== 'select') {
          // Call the stage click handler for other tools
          onStageClick(e);
        }
        
        // Only proceed with drawing/selection if not in read-only mode or palm rejection is disabled
        if (stableIsReadOnly || (stablePalmRejectionEnabled && stableCurrentTool !== 'select')) return;
        
        const stage = e.target.getStage();
        if (!stage) return;

        const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
        handlePointerDown(x, y);
      },
      deps: [logMouseEvent, panZoom, selection, stableCurrentTool, stableIsReadOnly, onStageClick, stablePalmRejectionEnabled, getRelativePointerPosition, handlePointerDown]
    },

    handleMouseMove: {
      handler: (e: Konva.KonvaEventObject<MouseEvent>) => {
        logMouseEvent('mousemove', e);
        
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
        
        // Only proceed with drawing/selection if not in read-only mode or palm rejection is disabled
        if (stableIsReadOnly || (stablePalmRejectionEnabled && stableCurrentTool !== 'select')) return;
        
        const stage = e.target.getStage();
        if (!stage) return;

        const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
        handlePointerMove(x, y);
      },
      deps: [logMouseEvent, panZoom, selection, stableIsReadOnly, stablePalmRejectionEnabled, stableCurrentTool, getRelativePointerPosition, handlePointerMove]
    },

    handleMouseUp: {
      handler: (e: Konva.KonvaEventObject<MouseEvent>) => {
        logMouseEvent('mouseup', e);
        
        // Handle right-click pan end - works for everyone, including read-only users
        if (e.evt.button === 2) {
          panZoom.stopPan();
          return;
        }
        
        // Only proceed with drawing/selection if not in read-only mode or palm rejection is disabled
        if (stableIsReadOnly || (stablePalmRejectionEnabled && stableCurrentTool !== 'select')) return;
        
        handlePointerUp();
      },
      deps: [logMouseEvent, panZoom, stableIsReadOnly, stablePalmRejectionEnabled, stableCurrentTool, handlePointerUp]
    }
  });

  return handlers;
};
