
/**
 * @fileoverview Central coordinator for all tablet event handling
 * @description TABLET-FRIENDLY: Main entry point for tablet/stylus support
 */

import { useCallback } from 'react';
import Konva from 'konva';
import { PanZoomState } from '@/types/whiteboard';
import { usePalmRejection } from './usePalmRejection';
import { useTextSelectionPrevention } from './useTextSelectionPrevention';
import { useTabletOptimizations } from './useTabletOptimizations';
import { usePointerEventDetection } from '../eventHandling/usePointerEventDetection';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('tablet');

/**
 * TABLET-FRIENDLY: Configuration interface for tablet event handling
 */
export interface TabletEventConfig {
  /** Enable palm rejection for stylus/finger discrimination */
  palmRejectionEnabled: boolean;
  /** Maximum contact size for valid touch (palm rejection) */
  maxContactSize: number;
  /** Minimum pressure for valid input */
  minPressure: number;
  /** Timeout after palm detection in milliseconds */
  palmTimeoutMs: number;
  /** Distance threshold for detecting clustered touches */
  clusterDistance: number;
  /** Always prefer stylus input over finger touches */
  preferStylus: boolean;
  /** Enable text selection prevention across all layers */
  preventTextSelection: boolean;
  /** Enable Safari/iPad specific optimizations */
  enableSafariOptimizations: boolean;
}

/**
 * TABLET-FRIENDLY: Default tablet configuration optimized for iPad with Apple Pencil
 */
export const DEFAULT_TABLET_CONFIG: TabletEventConfig = {
  palmRejectionEnabled: true,
  maxContactSize: 40,
  minPressure: 0.1,
  palmTimeoutMs: 500,
  clusterDistance: 100,
  preferStylus: true,
  preventTextSelection: true,
  enableSafariOptimizations: true
};

interface UseTabletEventHandlingProps {
  containerRef: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: PanZoomState;
  config?: Partial<TabletEventConfig>;
  panZoom: {
    startPan: (x: number, y: number) => void;
    continuePan: (x: number, y: number) => void;
    stopPan: () => void;
    zoom: (factor: number, centerX?: number, centerY?: number) => void;
    handleTouchStart: (e: TouchEvent) => void;
    handleTouchMove: (e: TouchEvent) => void;
    handleTouchEnd: (e: TouchEvent) => void;
  };
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
}

/**
 * TABLET-FRIENDLY: Central hook for coordinating all tablet event handling
 * @description Provides unified tablet support with palm rejection, text selection prevention, and Safari optimizations
 */
export const useTabletEventHandling = ({
  containerRef,
  stageRef,
  panZoomState,
  config = {},
  panZoom,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly
}: UseTabletEventHandlingProps) => {
  const finalConfig = { ...DEFAULT_TABLET_CONFIG, ...config };

  debugLog('TabletEvents', 'Initializing tablet event handling', { 
    config: finalConfig,
    isReadOnly 
  });

  // TABLET-FRIENDLY: Initialize palm rejection with configuration
  const palmRejection = usePalmRejection({
    maxContactSize: finalConfig.maxContactSize,
    minPressure: finalConfig.minPressure,
    palmTimeoutMs: finalConfig.palmTimeoutMs,
    clusterDistance: finalConfig.clusterDistance,
    preferStylus: finalConfig.preferStylus
  });

  // TABLET-FRIENDLY: Set up text selection prevention
  useTextSelectionPrevention({
    containerRef,
    enabled: finalConfig.preventTextSelection
  });

  // TABLET-FRIENDLY: Apply Safari/iPad optimizations
  useTabletOptimizations({
    containerRef,
    enabled: finalConfig.enableSafariOptimizations,
    palmRejectionEnabled: finalConfig.palmRejectionEnabled
  });

  // TABLET-FRIENDLY: Detect pointer event support
  const { supportsPointerEvents } = usePointerEventDetection();

  /**
   * TABLET-FRIENDLY: Determine which event system to use based on capabilities and configuration
   */
  const getEventStrategy = useCallback(() => {
    const usePointerEvents = supportsPointerEvents && finalConfig.palmRejectionEnabled;
    const useTouchEvents = !usePointerEvents;
    
    debugLog('TabletEvents', 'Event strategy determined', {
      usePointerEvents,
      useTouchEvents,
      supportsPointerEvents,
      palmRejectionEnabled: finalConfig.palmRejectionEnabled
    });

    return {
      usePointerEvents,
      useTouchEvents,
      touchAction: usePointerEvents ? 'none' : 'manipulation'
    };
  }, [supportsPointerEvents, finalConfig.palmRejectionEnabled]);

  /**
   * TABLET-FRIENDLY: Check if a pointer event should be processed for drawing
   */
  const shouldProcessForDrawing = useCallback((event: PointerEvent) => {
    // Always allow pen/stylus input
    if (event.pointerType === 'pen') {
      return true;
    }
    
    // For touch input, check palm rejection if enabled
    if (finalConfig.palmRejectionEnabled) {
      return palmRejection.shouldProcessPointer(event);
    }
    
    // If palm rejection is disabled, allow all touch input
    return true;
  }, [finalConfig.palmRejectionEnabled, palmRejection]);

  /**
   * TABLET-FRIENDLY: Check if a pointer event should trigger panning
   */
  const shouldProcessForPanning = useCallback((event: PointerEvent) => {
    // Right-click always triggers panning
    if (event.button === 2 || event.buttons === 2) {
      return true;
    }
    
    // For pen input, allow panning when not in drawing tools
    if (event.pointerType === 'pen') {
      return false; // Let drawing tools handle pen input
    }
    
    // For touch input, allow panning when drawing is not possible
    return !shouldProcessForDrawing(event);
  }, [shouldProcessForDrawing]);

  return {
    palmRejection,
    config: finalConfig,
    eventStrategy: getEventStrategy(),
    shouldProcessForDrawing,
    shouldProcessForPanning,
    debugInfo: {
      supportsPointerEvents,
      activePointers: palmRejection.activePointerCount
    }
  };
};
