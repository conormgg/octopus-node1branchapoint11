
import { useCallback, useRef } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('pointerEvents');

export const usePointerEventCore = (
  multiTouch: any,
  eventDeduplication: any,
  drawingCoordination: any,
  panZoom: any,
  selection: any,
  stageCoordinates: any,
  currentTool: string
) => {
  const drawingSequenceRef = useRef<number>(0);
  const DRAWING_SEQUENCE_TIMEOUT = 150; // ms

  const updateDrawingSequence = useCallback(() => {
    drawingSequenceRef.current = Date.now();
  }, []);

  const isInDrawingSequence = useCallback(() => {
    return Date.now() - drawingSequenceRef.current < DRAWING_SEQUENCE_TIMEOUT;
  }, []);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    debugLog('PointerCore', 'Pointer down', {
      pointerType: e.pointerType,
      pointerId: e.pointerId,
      pressure: e.pressure,
      currentTool
    });

    // Track pointer for multi-touch detection
    multiTouch.addPointer(e.pointerId, e.pointerType);

    // Check for deduplication with pointer type awareness
    if (!eventDeduplication.shouldProcessEvent('pointer', 'down', e.clientX, e.clientY, e.pointerType)) {
      debugLog('PointerCore', 'Pointer down deduplicated');
      return;
    }

    // Skip if multi-touch (but not for stylus)
    if (e.pointerType !== 'pen' && multiTouch.isMultiTouch()) {
      debugLog('PointerCore', 'Multi-touch detected, skipping drawing');
      return;
    }

    // Update drawing sequence for stylus
    if (e.pointerType === 'pen') {
      updateDrawingSequence();
    }

    // Get stage coordinates
    const stagePos = stageCoordinates.getStagePosition(e.clientX, e.clientY);
    if (!stagePos) return;

    // Route to appropriate handler
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      drawingCoordination.handleDrawingStart(stagePos.x, stagePos.y);
    } else if (currentTool === 'select' && selection) {
      selection.handlePointerDown(stagePos.x, stagePos.y);
    }
  }, [multiTouch, eventDeduplication, drawingCoordination, stageCoordinates, currentTool, selection, updateDrawingSequence]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    // Track pointer
    multiTouch.addPointer(e.pointerId, e.pointerType);

    // Check for deduplication with pointer type awareness
    if (!eventDeduplication.shouldProcessEvent('pointer', 'move', e.clientX, e.clientY, e.pointerType)) {
      return;
    }

    // Skip if multi-touch (but not for stylus)
    if (e.pointerType !== 'pen' && multiTouch.isMultiTouch()) {
      return;
    }

    // For stylus, continue drawing sequence
    if (e.pointerType === 'pen' && isInDrawingSequence()) {
      updateDrawingSequence();
    }

    // Get stage coordinates
    const stagePos = stageCoordinates.getStagePosition(e.clientX, e.clientY);
    if (!stagePos) return;

    // Route to appropriate handler
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      drawingCoordination.handleDrawingContinue(stagePos.x, stagePos.y);
    } else if (currentTool === 'select' && selection) {
      selection.handlePointerMove(stagePos.x, stagePos.y);
    }
  }, [multiTouch, eventDeduplication, drawingCoordination, stageCoordinates, currentTool, selection, updateDrawingSequence, isInDrawingSequence]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    debugLog('PointerCore', 'Pointer up', {
      pointerType: e.pointerType,
      pointerId: e.pointerId,
      currentTool
    });

    // Remove pointer from tracking
    multiTouch.removePointer(e.pointerId);

    // Check for deduplication with pointer type awareness
    if (!eventDeduplication.shouldProcessEvent('pointer', 'up', e.clientX, e.clientY, e.pointerType)) {
      debugLog('PointerCore', 'Pointer up deduplicated');
      return;
    }

    // Route to appropriate handler
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      drawingCoordination.handleDrawingEnd();
    } else if (currentTool === 'select' && selection) {
      selection.handlePointerUp();
    }
  }, [multiTouch, eventDeduplication, drawingCoordination, currentTool, selection]);

  const handlePointerLeave = useCallback((e: PointerEvent) => {
    debugLog('PointerCore', 'Pointer leave', {
      pointerType: e.pointerType,
      pointerId: e.pointerId
    });

    // Remove pointer from tracking
    multiTouch.removePointer(e.pointerId);

    // End drawing operations
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      drawingCoordination.handleDrawingEnd();
    } else if (currentTool === 'select' && selection) {
      selection.handlePointerUp();
    }
  }, [multiTouch, drawingCoordination, currentTool, selection]);

  const handleContextMenu = useCallback((e: Event) => {
    // Always prevent context menu during drawing tools
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [currentTool]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleContextMenu
  };
};
