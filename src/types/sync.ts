import { LineObject, ImageObject, SelectedObject } from './whiteboard';

export type OperationType = 'draw' | 'erase' | 'add_image' | 'update_image' | 'delete_image' | 'select_objects' | 'deselect_objects' | 'transform_objects' | 'update_line' | 'delete_objects' | 'undo' | 'redo';

export interface WhiteboardOperation {
  whiteboard_id: string;
  operation_type: OperationType;
  timestamp: number;
  sender_id: string;
  data: any;
}

export interface DrawOperationData {
  line: LineObject;
}

export interface EraseOperationData {
  line_ids: string[];
}

export interface AddImageOperationData {
  image: ImageObject;
}

export interface UpdateImageOperationData {
  image_id: string;
  updates: Partial<ImageObject>;
}

export interface DeleteImageOperationData {
  image_id: string;
}

export interface SelectObjectsOperationData {
  selectedObjects: SelectedObject[];
}

export interface DeselectObjectsOperationData {
  objectIds: string[];
}


export interface UpdateLineOperationData {
  line_id: string;
  updates: Partial<LineObject>;
}

export interface DeleteObjectsOperationData {
  line_ids: string[];
  image_ids: string[];
}

export interface SyncConfig {
  whiteboardId: string;
  senderId: string;
  sessionId: string;
  isReceiveOnly?: boolean;
}

export interface SyncState {
  isConnected: boolean;
  isReceiveOnly: boolean;
  lastSyncTimestamp: number;
  pendingOperations: WhiteboardOperation[];
}

export interface UndoOperationData {
  // No additional data needed - undo operates on current history state
}

export interface RedoOperationData {
  // No additional data needed - redo operates on current history state
}
