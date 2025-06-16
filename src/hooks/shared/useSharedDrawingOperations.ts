
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
  // Drawing operations (pencil, highlighter)
  const drawingOps = useSharedDrawing(state, setState, addToHistory, sendOperation, isApplyingRemoteOperation);
  
  // Erasing operations
  const erasingOps = useSharedErasing(state, setState, addToHistory, sendOperation, isApplyingRemoteOperation);
  
  // Object operations (update, delete)
  const objectOps = useSharedObjectOperations(state, setState, addToHistory, sendOperation, isApplyingRemoteOperation);

  return {
    ...drawingOps,
    ...erasingOps,
    ...objectOps
  };
};
