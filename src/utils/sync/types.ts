
import { WhiteboardOperation, SyncConfig } from '@/types/sync';
import { RealtimeChannel } from '@supabase/supabase-js';

export type OperationHandler = (operation: WhiteboardOperation) => void;

export interface ConnectionInfo {
  channel: RealtimeChannel;
  config: SyncConfig;
  handlers: Set<OperationHandler>;
  isConnected: boolean;
  lastActivity: number;
}
