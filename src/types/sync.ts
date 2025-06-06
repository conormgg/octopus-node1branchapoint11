
import { LineObject } from './whiteboard';

export type OperationType = 'draw' | 'erase';

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
