
import { useCallback, useMemo } from 'react';
import Konva from 'konva';
import { usePalmRejection } from '../../usePalmRejection';
import { useStageCoordinates } from '../../useStageCoordinates';
import { PanZoomState } from '@/types/whiteboard';
import { useMemoizedEventHandlers } from '@/hooks/performance/useMemoizedEventHandlers';
import { useTouchToSelectionBridge } from '../useTouchToSelectionBridge';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('touchEvents');

interface UsePointerEventCoreProps {
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: PanZoomState;
  palmRejection: ReturnType<typeof usePalmRejection>;
  palmRejectionConfig: {
    enabled: boolean;
  };
  panZoom: {
    startPan: (x: number, y: number) => void;
    continuePan: (x: number, y: number) => void;
    stopPan: () => void;
  };
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
  currentToolRef: React.RefObject<string>;
  logEventHandling: (eventType: string, source: 'pointer' | 'touch' | 'mouse', detail?: Record<string, unknown>) => void;
}

export const usePointerEventCore = ({
  stageRef,
  panZoomState,
  palmRejection,
  palmRejectionConfig,
  panZoom,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly,
  currentToolRef,
  logEventHandling
}: UsePointerEventCoreProps) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  // Memoize stable values to prevent unnecessary re-renders
  const stablePalmRejectionEnabled = useMemo(() => palmRejectionConfig.enabled, [palmRejectionConfig.enabled]);
  const stableIsReadOnly = useMemo(() => isReadOnly, [isReadOnly]);

  // Helper function to check if tool is any select variant
  const isSelectTool = useCallback((tool: string | undefined): boolean => {
    return tool === 'select' || tool === 'select2';
  }, []);

  // Touch-to-Selection Bridge for single-finger selection - now works for both select tools
  const touchToSelectionBridge = useTouchToSelectionBridge({
    panZoomState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    currentTool: currentToolRef.current || 'pencil',
    isReadOnly: stableIsReadOnly,
    stageRef
  });

  // Use memoized event handlers for better performance
  const handlers = useMemoizedEventHandlers({
    handlePointerDownEvent: {
      handler: (e: PointerEvent) => {
        const stage = stageRef.current;
        if (!stage) return;

        debugLog('PointerEventCore', 'Pointer down received', {
          pointerId: e.pointerId,
          pointerType: e.pointerType,
          currentTool: currentToolRef.current,
          toolUndefined: currentToolRef.current === undefined,
          button: e.button,
          isTouch: e.pointerType === 'touch',
          isSelectTool: isSelectTool(currentToolRef.current)
        });

        logEventHandling('pointerdown', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Handle right-click pan - works for everyone, including read-only users
        if (e.button === 2) {
          debugLog('PointerEventCore', 'Right-click pan detected');
          e.preventDefault();
          panZoom.startPan(e.clientX, e.clientY);
          return;
        }
        
        // For touch pointers with select tools, check if we should bridge to selection
        if (e.pointerType === 'touch') {
          const stage = stageRef.current;
          const stageTool = stage?.getAttr('currentTool');
          const currentTool = currentToolRef.current;
          const effectiveTool = currentTool || stageTool;
          
          debugLog('PointerEventCore', 'Touch pointer detected - checking for selection bridge', {
            currentTool,
            stageTool,
            effectiveTool,
            isSelectTool: isSelectTool(effectiveTool),
            clientX: e.clientX,
            clientY: e.clientY
          });
          
          if (isSelectTool(effectiveTool)) {
            debugLog('PointerEventCore', 'Touch pointer with select tool - attempting bridge');
            
            // Create a mock touch event for the bridge
            const mockTouchEvent = {
              touches: [{ clientX: e.clientX, clientY: e.clientY }],
              preventDefault: () => e.preventDefault()
            } as unknown as TouchEvent;
            
            const bridged = touchToSelectionBridge.bridgeTouchToSelection(mockTouchEvent, 'down');
            debugLog('PointerEventCore', 'Bridge attempt result', { bridged });
            
            if (bridged) {
              e.preventDefault();
              return;
            }
          }
        }
        
        // Don't prevent default for select tools - let Konva handle dragging
        if (!isSelectTool(currentToolRef.current)) {
          e.preventDefault();
        }
        
        // Only proceed with drawing if not in read-only mode
        if (stableIsReadOnly) {
          debugLog('PointerEventCore', 'Read-only mode - not processing pointer down');
          return;
        }
        
        // Apply palm rejection ONLY if it's enabled
        if (stablePalmRejectionEnabled && !palmRejection.shouldProcessPointer(e)) {
          debugLog('PointerEventCore', 'Palm rejection blocked pointer down');
          return;
        }

        const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
        debugLog('PointerEventCore', 'Calling handlePointerDown', { x, y });
        handlePointerDown(x, y);
      },
      deps: [stageRef, logEventHandling, currentToolRef, panZoom, stableIsReadOnly, stablePalmRejectionEnabled, palmRejection, getRelativePointerPosition, handlePointerDown, touchToSelectionBridge, isSelectTool]
    },

    handlePointerMoveEvent: {
      handler: (e: PointerEvent) => {
        const stage = stageRef.current;
        if (!stage) return;

        logEventHandling('pointermove', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Handle right-click pan - works for everyone, including read-only users
        if (e.buttons === 2) {
          e.preventDefault();
          panZoom.continuePan(e.clientX, e.clientY);
          return;
        }
        
        // For touch pointers with select tools, check if we should bridge to selection
        if (e.pointerType === 'touch') {
          const stage = stageRef.current;
          const stageTool = stage?.getAttr('currentTool');
          const currentTool = currentToolRef.current;
          const effectiveTool = currentTool || stageTool;
          
          if (isSelectTool(effectiveTool)) {
            const mockTouchEvent = {
              touches: [{ clientX: e.clientX, clientY: e.clientY }],
              preventDefault: () => e.preventDefault()
            } as unknown as TouchEvent;
            
            const bridged = touchToSelectionBridge.bridgeTouchToSelection(mockTouchEvent, 'move');
            if (bridged) {
              e.preventDefault();
              return;
            }
          }
        }
        
        // Don't prevent default for select tools - let Konva handle dragging
        if (!isSelectTool(currentToolRef.current)) {
          e.preventDefault();
        }
        
        // Only proceed with drawing if not in read-only mode
        if (stableIsReadOnly) return;
        
        // Apply palm rejection ONLY if it's enabled
        if (stablePalmRejectionEnabled && !palmRejection.shouldProcessPointer(e)) return;

        const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
        handlePointerMove(x, y);
      },
      deps: [stageRef, logEventHandling, currentToolRef, panZoom, stableIsReadOnly, stablePalmRejectionEnabled, palmRejection, getRelativePointerPosition, handlePointerMove, touchToSelectionBridge, isSelectTool]
    },

    handlePointerUpEvent: {
      handler: (e: PointerEvent) => {
        debugLog('PointerEventCore', 'Pointer up received', {
          pointerId: e.pointerId,
          pointerType: e.pointerType,
          currentTool: currentToolRef.current,
          button: e.button,
          isTouch: e.pointerType === 'touch',
          isSelectTool: isSelectTool(currentToolRef.current)
        });

        logEventHandling('pointerup', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Handle right-click pan end - works for everyone, including read-only users
        if (e.button === 2) {
          debugLog('PointerEventCore', 'Right-click pan end');
          e.preventDefault();
          panZoom.stopPan();
          return;
        }
        
        // For touch pointers with select tools, check if we should bridge to selection
        if (e.pointerType === 'touch') {
          const stage = stageRef.current;
          const stageTool = stage?.getAttr('currentTool');
          const currentTool = currentToolRef.current;
          const effectiveTool = currentTool || stageTool;
          
          debugLog('PointerEventCore', 'Touch pointer up - checking for selection bridge', {
            currentTool,
            stageTool,
            effectiveTool,
            isSelectTool: isSelectTool(effectiveTool)
          });
          
          if (isSelectTool(effectiveTool)) {
            debugLog('PointerEventCore', 'Touch pointer up with select tool - attempting bridge');
            
            const mockTouchEvent = {
              touches: [],
              changedTouches: [{ clientX: e.clientX, clientY: e.clientY }],
              preventDefault: () => e.preventDefault()
            } as unknown as TouchEvent;
            
            const bridged = touchToSelectionBridge.bridgeTouchToSelection(mockTouchEvent, 'up');
            debugLog('PointerEventCore', 'Bridge up result', { bridged });
            
            if (bridged) {
              e.preventDefault();
              return;
            }
          }
        }
        
        // Don't prevent default for select tools - let Konva handle dragging
        if (!isSelectTool(currentToolRef.current)) {
          e.preventDefault();
        }
        
        // Always clean up palm rejection state
        palmRejection.onPointerEnd(e.pointerId);
        
        // Only call handlePointerUp for drawing if not in read-only mode
        if (!stableIsReadOnly) {
          debugLog('PointerEventCore', 'Calling handlePointerUp');
          handlePointerUp();
        }
      },
      deps: [logEventHandling, currentToolRef, panZoom, palmRejection, stableIsReadOnly, handlePointerUp, touchToSelectionBridge, isSelectTool]
    },

    handlePointerLeaveEvent: {
      handler: (e: PointerEvent) => {
        debugLog('PointerEventCore', 'Pointer leave', {
          pointerId: e.pointerId,
          pointerType: e.pointerType
        });

        logEventHandling('pointerleave', 'pointer', { pointerId: e.pointerId, pointerType: e.pointerType });
        
        // Always clean up palm rejection state
        palmRejection.onPointerEnd(e.pointerId);
        panZoom.stopPan(); // Always stop pan on leave
        
        // Only call handlePointerUp for drawing if not in read-only mode
        if (!stableIsReadOnly) {
          handlePointerUp();
        }
      },
      deps: [logEventHandling, palmRejection, panZoom, stableIsReadOnly, handlePointerUp]
    },

    handleContextMenu: {
      handler: (e: Event) => {
        e.preventDefault(); // Prevent context menu on right-click
      },
      deps: []
    }
  });

  return handlers;
};
