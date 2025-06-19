
import { WhiteboardOperation, SyncConfig } from '@/types/sync';

export type OperationHandler = (operation: WhiteboardOperation) => void;

export interface ConnectionInfo {
  channel: RealtimeChannel;
  config: SyncConfig;
  handlers: Set<OperationHandler>;
  isConnected: boolean;
  lastActivity: number;
}

// Minimal type for Supabase Realtime Channel
interface RealtimeChannel {
  unsubscribe: () => void;
  subscribe: () => RealtimeChannel;
}
