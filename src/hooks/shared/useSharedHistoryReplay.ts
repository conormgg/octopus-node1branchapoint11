
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
}

/**
 * @hook useSharedHistoryReplay
 * @description Replays operations sequentially to rebuild both final state and history stack
 */
export const useSharedHistoryReplay = () => {
  const replayOperations = useCallback((
    orderedOperations: WhiteboardOperation[],
    initialState: WhiteboardState,
    addToHistory: (snapshot: any, activityMetadata?: ActivityMetadata) => void
  ): HistoryReplayResult => {
    console.log(`[HistoryReplay] Starting replay of ${orderedOperations.length} operations`);
    
    let currentState = { ...initialState };
    const historyStack: Array<{
      lines: any[];
      images: any[];
      selectionState: any;
      lastActivity?: ActivityMetadata;
    }> = [];
    
    // Add initial state to history
    const initialSnapshot = {
      lines: [...currentState.lines],
      images: [...currentState.images],
      selectionState: currentState.selectionState
    };
    historyStack.push(initialSnapshot);
    
    // Replay each operation and build history
    orderedOperations.forEach((operation, index) => {
      console.log(`[HistoryReplay] Replaying operation ${index + 1}/${orderedOperations.length}: ${operation.operation_type}`);
      
      // Skip undo/redo operations during replay - they would interfere with history building
      if (operation.operation_type === 'undo' || operation.operation_type === 'redo') {
        console.log(`[HistoryReplay] Skipping ${operation.operation_type} operation during replay`);
        return;
      }
      
      // Apply the operation to get the new state
      const newState = applyOperation(currentState, operation);
      
      // Create activity metadata for this operation
      const activityMetadata = createActivityFromOperation(operation, newState);
      
      // Create history snapshot
      const snapshot = {
        lines: [...newState.lines],
        images: [...newState.images],
        selectionState: currentState.selectionState, // Keep current selection state
        lastActivity: activityMetadata
      };
      
      // Add to history stack
      historyStack.push(snapshot);
      
      // Call addToHistory to properly integrate with the history system
      addToHistory(snapshot, activityMetadata);
      
      // Update current state for next iteration
      currentState = newState;
    });
    
    console.log(`[HistoryReplay] Replay complete. Final state: ${currentState.lines.length} lines, ${currentState.images.length} images`);
    console.log(`[HistoryReplay] History stack length: ${historyStack.length}`);
    
    return {
      finalState: currentState,
      historyStack
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
