
import { SyncConfig, WhiteboardOperation } from '@/types/sync';
import { Connection } from './Connection';
import { OperationHandler } from './types';
import { createDebugLogger, logError } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('connection');

/**
 * Singleton manager for whiteboard sync connections
 * Maintains connections across component remounts
 */
class SyncConnectionManager {
  private static instance: SyncConnectionManager;
  private connections: Map<string, Connection> = new Map();
  
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
    let connection = this.connections.get(connectionId);
    
    // If connection doesn't exist, create it
    if (!connection) {
      debugLog('Manager', `Creating new connection for ${connectionId}`);
      connection = new Connection(config, handler);
      this.connections.set(connectionId, connection);
    } else {
      // Connection exists, just add the handler
      debugLog('Manager', `Reusing existing connection for ${connectionId}`);
      connection.addHandler(handler);
      
      // Update the config in case it has changed (e.g., different senderId)
      connection.updateConfig(config);
    }
    
    return {
      isConnected: connection.isConnected
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
    
    const connectionId = `${config.whiteboardId}-${config.sessionId}`;
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
   * Get connection status
   */
  public getConnectionStatus(config: SyncConfig): { isConnected: boolean } {
    const connectionId = `${config.whiteboardId}-${config.sessionId}`;
    const connection = this.connections.get(connectionId);
    
    return {
      isConnected: connection?.isConnected || false
    };
  }
}

export default SyncConnectionManager.getInstance();
