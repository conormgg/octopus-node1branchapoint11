
import { WhiteboardOperation, SyncConfig } from '@/types/sync';

export type OperationHandler = (operation: WhiteboardOperation) => void;

export interface ConnectionInfo {
  channel: any;
  config: SyncConfig;
  handlers: Set<OperationHandler>;
  isConnected: boolean;
  lastActivity: number;
}
