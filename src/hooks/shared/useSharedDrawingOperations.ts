
import { ActivityMetadata } from '@/types/whiteboard';
import { useSharedDrawing } from './drawing/useSharedDrawing';
import { useSharedErasing } from './drawing/useSharedErasing';
import { useSharedObjectOperations } from './drawing/useSharedObjectOperations';

/**
 * @fileoverview Refactored shared drawing operations coordinator
 * @description Combines drawing, erasing, and object operations into a unified interface
 */

export const useSharedDrawingOperations = (
  state: any,
  setState: any,
  addToHistory: (snapshot?: any, activityMetadata?: ActivityMetadata) => void,
  sendOperation: any,
  isApplyingRemoteOperation: React.MutableRefObject<boolean>,
  whiteboardId?: string
) => {
  // Drawing operations (pencil, highlighter) - now with whiteboardId
  const drawingOps = useSharedDrawing(state, setState, addToHistory, sendOperation, isApplyingRemoteOperation, whiteboardId);
  
  // Erasing operations - now with whiteboardId
  const erasingOps = useSharedErasing(state, setState, addToHistory, sendOperation, isApplyingRemoteOperation, whiteboardId);
  
  // Object operations (update, delete) - now with whiteboardId
  const objectOps = useSharedObjectOperations(state, setState, addToHistory, sendOperation, isApplyingRemoteOperation, whiteboardId);

  return {
    ...drawingOps,
    ...erasingOps,
    ...objectOps
  };
};
