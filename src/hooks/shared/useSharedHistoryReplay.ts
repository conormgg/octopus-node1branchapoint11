
import { useCallback } from 'react';
import { WhiteboardOperation } from '@/types/sync';
import { WhiteboardState, ActivityMetadata } from '@/types/whiteboard';
import { applyOperation } from '@/utils/operationSerializer';

interface HistoryReplayResult {
  finalState: WhiteboardState;
  historyStack: Array<{
    lines: any[];
    images: any[];
    selectionState: any;
    lastActivity?: ActivityMetadata;
  }>;
  finalHistoryIndex: number;
}

/**
 * @hook useSharedHistoryReplay
 * @description Pure simulator that replays operations to rebuild state and history stack
 */
export const useSharedHistoryReplay = () => {
  const replayOperations = useCallback((
    orderedOperations: WhiteboardOperation[],
    initialState: WhiteboardState
  ): HistoryReplayResult => {
    console.log(`[HistoryReplay] Starting pure simulation of ${orderedOperations.length} operations`);
    
    // Initialize internal history stack and index for simulation
    let historyStack: Array<{
      lines: any[];
      images: any[];
      selectionState: any;
      lastActivity?: ActivityMetadata;
    }> = [];
    
    let historyIndex = -1; // Start at -1, will become 0 when first state is added
    
    // Start with initial state
    let currentState: WhiteboardState = {
      ...initialState,
      lines: [...initialState.lines],
      images: [...initialState.images]
    };
    
    // Add initial state to history
    const initialSnapshot = {
      lines: [...currentState.lines],
      images: [...currentState.images],
      selectionState: {
        selectedObjects: [],
        selectionBounds: null,
        isSelecting: false,
        transformationData: {}
      }
    };
    historyStack.push(initialSnapshot);
    historyIndex = 0;
    
    // Process each operation in the simulation
    orderedOperations.forEach((operation, index) => {
      console.log(`[HistoryReplay] Simulating operation ${index + 1}/${orderedOperations.length}: ${operation.operation_type}`);
      
      if (operation.operation_type === 'undo') {
        // Undo: Move back in history if possible
        if (historyIndex > 0) {
          historyIndex--;
          const previousSnapshot = historyStack[historyIndex];
          currentState = {
            ...currentState,
            lines: [...previousSnapshot.lines],
            images: [...previousSnapshot.images]
          };
          console.log(`[HistoryReplay] Undo applied - moved to history index ${historyIndex}`);
        } else {
          console.log(`[HistoryReplay] Undo ignored - already at beginning of history`);
        }
        return;
      }
      
      if (operation.operation_type === 'redo') {
        // Redo: Move forward in history if possible
        if (historyIndex < historyStack.length - 1) {
          historyIndex++;
          const nextSnapshot = historyStack[historyIndex];
          currentState = {
            ...currentState,
            lines: [...nextSnapshot.lines],
            images: [...nextSnapshot.images]
          };
          console.log(`[HistoryReplay] Redo applied - moved to history index ${historyIndex}`);
        } else {
          console.log(`[HistoryReplay] Redo ignored - already at end of history`);
        }
        return;
      }
      
      // For all other operations: apply them and create new history state
      console.log(`[HistoryReplay] Applying ${operation.operation_type} operation`);
      
      // Apply the operation to get the new state
      const newState = applyOperation(currentState, operation);
      
      // Create activity metadata for this operation
      const activityMetadata = createActivityFromOperation(operation, newState);
      
      // Create new history snapshot
      const newSnapshot = {
        lines: [...newState.lines],
        images: [...newState.images],
        selectionState: {
          selectedObjects: [],
          selectionBounds: null,
          isSelecting: false,
          transformationData: {}
        },
        lastActivity: activityMetadata
      };
      
      // Truncate any "future" history if we're not at the end (user had previously undone)
      if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
        console.log(`[HistoryReplay] Truncated future history, new length: ${historyStack.length}`);
      }
      
      // Add new snapshot to history and advance index
      historyStack.push(newSnapshot);
      historyIndex++;
      
      // Update current state
      currentState = {
        ...currentState,
        lines: [...newState.lines],
        images: [...newState.images]
      };
      
      console.log(`[HistoryReplay] Operation applied - history index: ${historyIndex}, stack length: ${historyStack.length}`);
    });
    
    console.log(`[HistoryReplay] Simulation complete. Final state: ${currentState.lines.length} lines, ${currentState.images.length} images`);
    console.log(`[HistoryReplay] Final history: index ${historyIndex}, stack length ${historyStack.length}`);
    
    return {
      finalState: currentState,
      historyStack,
      finalHistoryIndex: historyIndex
    };
  }, []);
  
  return { replayOperations };
};

// Helper function to create activity metadata from operations during replay
const createActivityFromOperation = (operation: WhiteboardOperation, newState: any): ActivityMetadata | undefined => {
  const timestamp = operation.timestamp || Date.now();

  switch (operation.operation_type) {
    case 'draw': {
      const line = operation.data?.line;
      if (line && line.points && line.points.length >= 4) {
        // Calculate bounds from line points
        const bounds = calculateLineBoundsFromPoints(line.points);
        return {
          type: 'draw',
          bounds,
          timestamp
        };
      }
      break;
    }
    
    case 'erase': {
      const lineIds = operation.data?.line_ids || [];
      const erasedBounds = operation.data?.erased_bounds;
      
      if (lineIds.length > 0) {
        const bounds = erasedBounds || { x: 0, y: 0, width: 50, height: 50 };
        return {
          type: 'erase',
          bounds,
          timestamp
        };
      }
      break;
    }
    
    case 'add_image': {
      const image = operation.data?.image;
      if (image) {
        return {
          type: 'paste',
          bounds: {
            x: image.x || 0,
            y: image.y || 0,
            width: image.width || 100,
            height: image.height || 100
          },
          timestamp
        };
      }
      break;
    }
    
    case 'update_line':
    case 'update_image': {
      // For move operations, create generic move activity
      return {
        type: 'move',
        bounds: { x: 0, y: 0, width: 100, height: 100 }, // Generic bounds for moves
        timestamp
      };
    }
  }
  
  return undefined;
};

// Helper function to calculate bounds from line points
const calculateLineBoundsFromPoints = (points: number[]) => {
  if (points.length < 4) {
    return { x: 0, y: 0, width: 10, height: 10 };
  }
  
  let minX = points[0];
  let minY = points[1];
  let maxX = points[0];
  let maxY = points[1];
  
  for (let i = 2; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  
  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 10),
    height: Math.max(maxY - minY, 10)
  };
};
