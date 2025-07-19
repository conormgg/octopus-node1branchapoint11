
import { useEffect } from 'react';
import { useTouchToSelectionBridge } from './useTouchToSelectionBridge';
import { useEventDeduplication } from './useEventDeduplication';
import { PanZoomState } from '@/types/whiteboard';

interface UseTouchEventHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  panZoom: {
    handleTouchStart: (e: TouchEvent) => void;
    handleTouchMove: (e: TouchEvent) => void;
    handleTouchEnd: (e: TouchEvent) => void;
  };
  logEventHandling: (eventType: string, source: 'pointer' | 'touch' | 'mouse', detail?: any) => void;
  supportsPointerEvents: boolean;
  palmRejectionEnabled: boolean;
  currentTool?: string;
  // Phase 2: Touch-to-Selection Bridge props
  panZoomState?: PanZoomState;
  handlePointerDown?: (x: number, y: number) => void;
  handlePointerMove?: (x: number, y: number) => void;
  handlePointerUp?: () => void;
  isReadOnly?: boolean;
  stageRef?: React.RefObject<any>;
}

export const useTouchEventHandlers = ({
  containerRef,
  panZoom,
  logEventHandling,
  supportsPointerEvents,
  palmRejectionEnabled,
  currentTool,
  // Phase 2: Touch-to-Selection Bridge props
  panZoomState,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly = false,
  stageRef
}: UseTouchEventHandlersProps) => {
  // Phase 2: Touch-to-Selection Bridge
  const touchToSelectionBridge = useTouchToSelectionBridge({
    panZoomState: panZoomState!,
    handlePointerDown: handlePointerDown!,
    handlePointerMove: handlePointerMove!,
    handlePointerUp: handlePointerUp!,
    currentTool: currentTool || 'pencil',
    isReadOnly,
    stageRef: stageRef!
  });
  
  // Phase 3: Event Deduplication
  const { shouldProcessEvent, resetEventHistory } = useEventDeduplication();
  // Touch events for pinch/pan - works regardless of read-only status
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /**
     * Touch events are used ONLY when pointer events are not supported.
     * This prevents conflicts between pointer and touch event systems.
     * 
     * IMPORTANT: When select tool is active, single-finger touches should 
     * bypass pan logic and be handled by selection logic instead.
     */
    const shouldUseTouchEvents = !supportsPointerEvents;

    const handleTouchStart = (e: TouchEvent) => {
      // Phase 3: Event Deduplication
      if (!shouldProcessEvent('touch', 'touchstart')) {
        return;
      }
      
      logEventHandling('touchstart', 'touch', { 
        touches: e.touches.length, 
        tool: currentTool 
      });
      
      // Phase 2 & 4: Tool-Aware Event Routing
      // For select tool with single finger, try to bridge to selection logic
      if (currentTool === 'select' && e.touches.length === 1 && touchToSelectionBridge) {
        const bridged = touchToSelectionBridge.bridgeTouchToSelection(e, 'down');
        if (bridged) {
          // Successfully bridged to selection - prevent pan and other processing
          e.preventDefault();
          return;
        }
      }
      
      // Always prevent default for multi-touch to ensure pinch-to-zoom works
      if (e.touches.length >= 2) {
        e.preventDefault();
      }
      
      panZoom.handleTouchStart(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Phase 3: Event Deduplication
      if (!shouldProcessEvent('touch', 'touchmove')) {
        return;
      }
      
      logEventHandling('touchmove', 'touch', { 
        touches: e.touches.length, 
        tool: currentTool 
      });
      
      // Phase 2 & 4: Tool-Aware Event Routing
      // For select tool with single finger, try to bridge to selection logic
      if (currentTool === 'select' && e.touches.length === 1 && touchToSelectionBridge) {
        const bridged = touchToSelectionBridge.bridgeTouchToSelection(e, 'move');
        if (bridged) {
          // Successfully bridged to selection - prevent pan and other processing
          e.preventDefault();
          return;
        }
      }
      
      // Always prevent default for multi-touch gestures
      if (e.touches.length >= 2) {
        e.preventDefault();
      }
      
      panZoom.handleTouchMove(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Phase 3: Event Deduplication
      if (!shouldProcessEvent('touch', 'touchend')) {
        return;
      }
      
      logEventHandling('touchend', 'touch', { 
        touches: e.touches.length, 
        tool: currentTool 
      });
      
      // Phase 2 & 4: Tool-Aware Event Routing
      // For select tool, try to bridge to selection logic
      if (currentTool === 'select' && touchToSelectionBridge) {
        const bridged = touchToSelectionBridge.bridgeTouchToSelection(e, 'up');
        if (bridged) {
          // Successfully bridged to selection - prevent pan and other processing
          e.preventDefault();
          return;
        }
      }
      
      // Only prevent default for multi-touch end events
      if (e.touches.length >= 1 || (e.changedTouches && e.changedTouches.length >= 1)) {
        e.preventDefault();
      }
      
      panZoom.handleTouchEnd(e);
    };

    if (shouldUseTouchEvents) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      if (shouldUseTouchEvents) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [panZoom.handleTouchStart, panZoom.handleTouchMove, panZoom.handleTouchEnd, logEventHandling, supportsPointerEvents, currentTool, shouldProcessEvent, touchToSelectionBridge]);
  
  // Reset event history and touch selection when tool changes
  useEffect(() => {
    resetEventHistory();
    if (touchToSelectionBridge) {
      touchToSelectionBridge.resetTouchSelection();
    }
  }, [currentTool, resetEventHistory, touchToSelectionBridge]);
};
