
import { useState, useRef } from 'react';
import { WhiteboardState } from '@/types/whiteboard';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';

export const useSharedStateInitialization = (whiteboardId?: string) => {
  const { getWhiteboardState } = useWhiteboardStateContext();
  const hasInitialized = useRef(false);
  
  // STABLE: Initialize state with empty state - persistence will load data if needed
  const [state, setState] = useState<WhiteboardState>(() => {
    if (hasInitialized.current) {
      return {
        lines: [],
        images: [],
        currentTool: 'pencil',
        currentColor: '#000000',
        currentStrokeWidth: 5,
        pencilSettings: { color: '#000000', strokeWidth: 5 },
        highlighterSettings: { color: '#FFFF00', strokeWidth: 12 },
        isDrawing: false,
        panZoomState: { x: 0, y: 0, scale: 1 },
        selectionState: {
          selectedObjects: [],
          selectionBounds: null,
          isSelecting: false,
          transformationData: {}
        },
        history: [{
          lines: [],
          images: [],
          selectionState: {
            selectedObjects: [],
            selectionBounds: null,
            isSelecting: false,
            transformationData: {}
          }
        }],
        historyIndex: 0
      };
    }
    
    hasInitialized.current = true;
    console.log(`[StateInit] STABLE - Initializing whiteboard ${whiteboardId} with empty state - persistence will load data if available`);
    
    return {
      lines: [], // Start with empty lines - persistence will populate if needed
      images: [],
      currentTool: 'pencil',
      currentColor: '#000000',
      currentStrokeWidth: 5,
      pencilSettings: {
        color: '#000000',
        strokeWidth: 5
      },
      highlighterSettings: {
        color: '#FFFF00',
        strokeWidth: 12
      },
      isDrawing: false,
      panZoomState: { x: 0, y: 0, scale: 1 },
      selectionState: {
        selectedObjects: [],
        selectionBounds: null,
        isSelecting: false,
        transformationData: {}
      },
      history: [{
        lines: [], // Start with empty history
        images: [],
        selectionState: {
          selectedObjects: [],
          selectionBounds: null,
          isSelecting: false,
          transformationData: {}
        }
      }],
      historyIndex: 0
    };
  });

  // STABLE: Enhanced setState with reduced logging to prevent spam
  const enhancedSetState = (updater: (prev: WhiteboardState) => WhiteboardState) => {
    setState(prev => {
      const newState = updater(prev);
      // Only log significant changes to reduce spam
      if (newState.lines.length !== prev.lines.length || newState.currentTool !== prev.currentTool) {
        console.log('[StateInit] STABLE - State updated:', {
          linesCount: newState.lines.length,
          currentTool: newState.currentTool,
          isDrawing: newState.isDrawing
        });
      }
      return newState;
    });
  };

  return { state, setState: enhancedSetState };
};
