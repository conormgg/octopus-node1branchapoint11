import { supabase } from '@/integrations/supabase/client';
import { WhiteboardOperation, SyncConfig } from '@/types/sync';

type OperationHandler = (operation: WhiteboardOperation) => void;

interface ConnectionInfo {
  channel: any;
  config: SyncConfig;
  handlers: Set<OperationHandler>;
  isConnected: boolean;
  lastActivity: number;
}

/**
 * Singleton manager for whiteboard sync connections
 * Maintains connections across component remounts
 */
class SyncConnectionManager {
  private static instance: SyncConnectionManager;
  private connections: Map<string, ConnectionInfo> = new Map();
  
  // Private constructor for singleton pattern
  private constructor() {}
  
  public static getInstance(): SyncConnectionManager {
    if (!SyncConnectionManager.instance) {
      SyncConnectionManager.instance = new SyncConnectionManager();
    }
    return SyncConnectionManager.instance;
  }
  
  /**
   * Register a handler for a specific whiteboard connection
   * Creates the connection if it doesn't exist
   */
  public registerHandler(
    config: SyncConfig,
    handler: OperationHandler
  ): { isConnected: boolean } {
    const connectionId = `${config.whiteboardId}-${config.sessionId}`;
    let connectionInfo = this.connections.get(connectionId);
    
    // If connection doesn't exist, create it
    if (!connectionInfo) {
      console.log(`[SyncConnectionManager] Creating new connection for ${connectionId}`);
      
      const channelName = `whiteboard-${config.whiteboardId}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'whiteboard_data',
            filter: `board_id=eq.${config.whiteboardId}`
          },
          (payload) => {
            console.log('[SyncConnectionManager] Received operation:', payload);
            const data = payload.new as any;
            
            // Convert to our internal operation format
            const operation: WhiteboardOperation = {
              whiteboard_id: data.board_id,
              operation_type: data.action_type,
              timestamp: new Date(data.created_at).getTime(),
              sender_id: data.user_id,
              data: data.object_data
            };
            
            // Notify all registered handlers except the sender
            const connectionInfo = this.connections.get(connectionId);
            if (connectionInfo) {
              connectionInfo.lastActivity = Date.now();
              connectionInfo.handlers.forEach(h => {
                // Don't send operations back to the sender
                if (operation.sender_id !== config.senderId) {
                  h(operation);
                }
              });
            }
          }
        )
        .subscribe((status) => {
          console.log(`[SyncConnectionManager] Subscription status for ${connectionId}:`, status);
          const connectionInfo = this.connections.get(connectionId);
          if (connectionInfo) {
            connectionInfo.isConnected = status === 'SUBSCRIBED';
            connectionInfo.lastActivity = Date.now();
          }
        });
      
      connectionInfo = {
        channel,
        config,
        handlers: new Set([handler]),
        isConnected: false,
        lastActivity: Date.now()
      };
      
      this.connections.set(connectionId, connectionInfo);
    } else {
      // Connection exists, just add the handler
      console.log(`[SyncConnectionManager] Reusing existing connection for ${connectionId}`);
      connectionInfo.handlers.add(handler);
      connectionInfo.lastActivity = Date.now();
    }
    
    return {
      isConnected: connectionInfo.isConnected
    };
  }
  
  /**
   * Unregister a handler for a specific whiteboard connection
   * Keeps the connection alive for a grace period
   */
  public unregisterHandler(
    config: SyncConfig,
    handler: OperationHandler
  ): void {
    const connectionId = `${config.whiteboardId}-${config.sessionId}`;
    const connectionInfo = this.connections.get(connectionId);
    
    if (connectionInfo) {
      console.log(`[SyncConnectionManager] Unregistering handler for ${connectionId}`);
      connectionInfo.handlers.delete(handler);
      
      // Keep connection alive for a grace period (30 seconds)
      // This allows for quick reconnection if component remounts
      if (connectionInfo.handlers.size === 0) {
        console.log(`[SyncConnectionManager] No more handlers for ${connectionId}, scheduling cleanup`);
        setTimeout(() => {
          this.cleanupConnection(connectionId);
        }, 30000); // 30 second grace period
      }
    }
  }
  
  /**
   * Send an operation through a specific connection
   */
  public sendOperation(
    config: SyncConfig,
    operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>
  ): WhiteboardOperation | null {
    if (config.isReceiveOnly) return null;
    
    const connectionId = `${config.whiteboardId}-${config.sessionId}`;
    const connectionInfo = this.connections.get(connectionId);
    
    if (!connectionInfo) {
      console.error(`[SyncConnectionManager] No connection found for ${connectionId}`);
      return null;
    }
    
    const fullOperation: WhiteboardOperation = {
      ...operation,
      whiteboard_id: config.whiteboardId,
      timestamp: Date.now(),
      sender_id: config.senderId
    };
    
    // Send to Supabase
    supabase
      .from('whiteboard_data')
      .insert({
        action_type: fullOperation.operation_type,
        board_id: fullOperation.whiteboard_id,
        object_data: fullOperation.data,
        object_id: `${fullOperation.operation_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        session_id: config.sessionId,
        user_id: fullOperation.sender_id
      })
      .then(({ error }) => {
        if (error) {
          console.error('[SyncConnectionManager] Error sending operation:', error);
        } else {
          connectionInfo.lastActivity = Date.now();
        }
      });
    
    return fullOperation;
  }
  
  /**
   * Clean up a connection if it's no longer needed
   */
  private cleanupConnection(connectionId: string): void {
    const connectionInfo = this.connections.get(connectionId);
    
    if (connectionInfo && connectionInfo.handlers.size === 0) {
      // Check if there's been any activity in the last 30 seconds
      const inactiveTime = Date.now() - connectionInfo.lastActivity;
      if (inactiveTime > 30000) {
        console.log(`[SyncConnectionManager] Cleaning up inactive connection for ${connectionId}`);
        supabase.removeChannel(connectionInfo.channel);
        this.connections.delete(connectionId);
      } else {
        // Still recent activity, reschedule cleanup
        console.log(`[SyncConnectionManager] Connection ${connectionId} still has recent activity, rescheduling cleanup`);
        setTimeout(() => {
          this.cleanupConnection(connectionId);
        }, 30000);
      }
    }
  }
  
  /**
   * Get connection status
   */
  public getConnectionStatus(config: SyncConfig): { isConnected: boolean } {
    const connectionId = `${config.whiteboardId}-${config.sessionId}`;
    const connectionInfo = this.connections.get(connectionId);
    
    return {
      isConnected: connectionInfo?.isConnected || false
    };
  }
}

export default SyncConnectionManager.getInstance();
