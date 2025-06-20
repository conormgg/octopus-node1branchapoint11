
import { SyncConfig, WhiteboardOperation } from '@/types/sync';
import { Connection } from './Connection';
import { OperationHandler } from './types';
import { createDebugLogger, logError } from '@/utils/debug/debugConfig';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const debugLog = createDebugLogger('connection');

/**
 * Singleton manager for whiteboard sync connections
 * Maintains connections across component remounts and centrally manages Supabase channels
 */
class SyncConnectionManager {
  private static instance: SyncConnectionManager;
  private connections: Map<string, Connection> = new Map();
  private channels: Map<string, RealtimeChannel> = new Map();
  
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
   * Creates the connection if it doesn't exist, manages shared channel subscriptions
   */
  public registerHandler(
    config: SyncConfig,
    handler: OperationHandler
  ): { isConnected: boolean } {
    // Include read/write state in connection ID to prevent stale connection reuse
    const connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}-${config.isReceiveOnly ? 'ro' : 'rw'}`;
    
    // Centrally manage channel subscriptions - one channel per whiteboard
    const channelName = `whiteboard-${config.whiteboardId}`;
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      debugLog('Manager', `Creating and subscribing to new Supabase channel: ${channelName}`);
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'whiteboard_data',
            filter: `board_id=eq.${config.whiteboardId}`
          },
          (payload) => this.handleChannelPayload(payload, config.whiteboardId)
        )
        .subscribe((status) => {
          debugLog('Manager', `Channel ${channelName} subscription status: ${status}`);
          // Update connection status for all connections using this channel
          this.updateConnectionStatus(config.whiteboardId, status === 'SUBSCRIBED');
        });
      
      this.channels.set(channelName, channel);
    }
    
    let connection = this.connections.get(connectionId);
    
    // If connection doesn't exist, create it with the shared channel
    if (!connection) {
      debugLog('Manager', `Creating new connection for ${connectionId}`);
      connection = new Connection(config, handler, channel);
      this.connections.set(connectionId, connection);
    } else {
      // Connection exists, just add the handler
      debugLog('Manager', `Reusing existing connection for ${connectionId}`);
      connection.addHandler(handler);
      
      // DO NOT update config - each connection maintains its immutable config
      // This prevents sender ID overwrites that cause operation filtering issues
      debugLog('Manager', `Keeping original config for ${connectionId} to prevent sender ID conflicts`);
    }
    
    return {
      isConnected: channel.state === 'joined'
    };
  }
  
  /**
   * Handle incoming payload from Supabase channel and dispatch to relevant connections
   */
  private handleChannelPayload(payload: any, whiteboardId: string): void {
    debugLog('Manager', 'Received payload from channel:', payload);
    
    // Dispatch to all connections for this whiteboard
    this.connections.forEach((connection, connectionId) => {
      if (connectionId.startsWith(whiteboardId)) {
        connection.handlePayload(payload);
      }
    });
  }
  
  /**
   * Update connection status for all connections using a specific whiteboard channel
   */
  private updateConnectionStatus(whiteboardId: string, isConnected: boolean): void {
    this.connections.forEach((connection, connectionId) => {
      if (connectionId.startsWith(whiteboardId)) {
        connection.updateConnectionStatus(isConnected);
      }
    });
  }
  
  /**
   * Unregister a handler for a specific whiteboard connection
   * Keeps the connection alive for a grace period
   */
  public unregisterHandler(
    config: SyncConfig,
    handler: OperationHandler
  ): void {
    // Include read/write state in connection ID to find the correct connection
    const connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}-${config.isReceiveOnly ? 'ro' : 'rw'}`;
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      debugLog('Manager', `Unregistering handler for ${connectionId}`);
      connection.removeHandler(handler);
      
      // Keep connection alive for a grace period (30 seconds)
      // This allows for quick reconnection if component remounts
      if (connection.handlerCount === 0) {
        debugLog('Manager', `No more handlers for ${connectionId}, scheduling cleanup`);
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
    
    // Include read/write state in connection ID to find the correct connection
    const connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}-${config.isReceiveOnly ? 'ro' : 'rw'}`;
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      logError('Manager', `No connection found for ${connectionId}`);
      return null;
    }
    
    return connection.sendOperation(operation);
  }
  
  /**
   * Clean up a connection if it's no longer needed
   */
  private cleanupConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    
    if (connection && connection.handlerCount === 0) {
      // Check if there's been any activity in the last 30 seconds
      const inactiveTime = Date.now() - connection.lastActivity;
      if (inactiveTime > 30000) {
        debugLog('Manager', `Cleaning up inactive connection for ${connectionId}`);
        connection.close();
        this.connections.delete(connectionId);
        
        // Check if we can clean up the channel too
        this.cleanupChannelIfUnused(connection.getWhiteboardId());
      } else {
        // Still recent activity, reschedule cleanup
        debugLog('Manager', `Connection ${connectionId} still has recent activity, rescheduling cleanup`);
        setTimeout(() => {
          this.cleanupConnection(connectionId);
        }, 30000);
      }
    }
  }
  
  /**
   * Clean up channel if no connections are using it
   */
  private cleanupChannelIfUnused(whiteboardId: string): void {
    const hasActiveConnections = Array.from(this.connections.keys())
      .some(connectionId => connectionId.startsWith(whiteboardId));
    
    if (!hasActiveConnections) {
      const channelName = `whiteboard-${whiteboardId}`;
      const channel = this.channels.get(channelName);
      if (channel) {
        debugLog('Manager', `Cleaning up unused channel: ${channelName}`);
        supabase.removeChannel(channel);
        this.channels.delete(channelName);
      }
    }
  }
  
  /**
   * Get connection status
   */
  public getConnectionStatus(config: SyncConfig): { isConnected: boolean } {
    // Include read/write state in connection ID to find the correct connection
    const connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}-${config.isReceiveOnly ? 'ro' : 'rw'}`;
    const connection = this.connections.get(connectionId);
    
    return {
      isConnected: connection?.isConnected || false
    };
  }
  
  /**
   * Debug method to inspect current connections
   */
  public getDebugInfo(): { connectionId: string; handlerCount: number; isConnected: boolean; senderId: string }[] {
    const info: { connectionId: string; handlerCount: number; isConnected: boolean; senderId: string }[] = [];
    
    this.connections.forEach((connection, connectionId) => {
      info.push({
        connectionId,
        handlerCount: connection.handlerCount,
        isConnected: connection.isConnected,
        senderId: connection.getSenderId()
      });
    });
    
    return info;
  }
}

export default SyncConnectionManager.getInstance();
