import { SyncConfig, WhiteboardOperation } from '@/types/sync';
import { Connection } from './Connection';
import { OperationHandler } from './types';
import { createDebugLogger, logError } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('connection');

/**
 * Singleton manager for whiteboard sync connections
 * Maintains connections across component remounts with improved conflict handling
 */
class SyncConnectionManager {
  private static instance: SyncConnectionManager;
  private connections: Map<string, Connection> = new Map();
  private connectionAttempts: Map<string, number> = new Map();
  
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
   * Creates the connection if it doesn't exist, with retry logic
   */
  public registerHandler(
    config: SyncConfig,
    handler: OperationHandler
  ): { isConnected: boolean } {
    const connectionId = `${config.whiteboardId}-${config.sessionId}`;
    let connection = this.connections.get(connectionId);
    
    debugLog('Manager', `Registering handler for ${connectionId}`);
    
    // If connection doesn't exist, create it
    if (!connection) {
      try {
        debugLog('Manager', `Creating new connection for ${connectionId}`);
        connection = new Connection(config, handler);
        this.connections.set(connectionId, connection);
        this.connectionAttempts.set(connectionId, 1);
      } catch (error) {
        const attempts = this.connectionAttempts.get(connectionId) || 0;
        logError('Manager', `Failed to create connection for ${connectionId} (attempt ${attempts + 1})`, error);
        
        if (attempts < 3) {
          // Retry with exponential backoff
          setTimeout(() => {
            this.connectionAttempts.set(connectionId, attempts + 1);
            this.registerHandler(config, handler);
          }, Math.pow(2, attempts) * 1000);
        }
        
        return { isConnected: false };
      }
    } else {
      // Connection exists, just add the handler
      debugLog('Manager', `Reusing existing connection for ${connectionId}`);
      connection.addHandler(handler);
      
      // Update the config in case it has changed (e.g., different senderId)
      connection.updateConfig(config);
      
      // Reset connection attempts on successful reuse
      this.connectionAttempts.set(connectionId, 0);
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
      
      // Keep connection alive for a grace period (15 seconds - reduced from 30)
      if (connection.handlerCount === 0) {
        debugLog('Manager', `No more handlers for ${connectionId}, scheduling cleanup in 15s`);
        setTimeout(() => {
          this.cleanupConnection(connectionId);
        }, 15000);
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
      // Check if there's been any activity in the last 15 seconds
      const inactiveTime = Date.now() - connection.lastActivity;
      if (inactiveTime > 15000) {
        debugLog('Manager', `Cleaning up inactive connection for ${connectionId}`);
        connection.close();
        this.connections.delete(connectionId);
        this.connectionAttempts.delete(connectionId);
      } else {
        // Still recent activity, reschedule cleanup
        debugLog('Manager', `Connection ${connectionId} still has recent activity, rescheduling cleanup`);
        setTimeout(() => {
          this.cleanupConnection(connectionId);
        }, 15000);
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
  
  /**
   * Force cleanup all connections (useful for cleanup)
   */
  public forceCleanupAll(): void {
    debugLog('Manager', 'Force cleaning up all connections');
    this.connections.forEach((connection, connectionId) => {
      connection.close();
    });
    this.connections.clear();
    this.connectionAttempts.clear();
  }
}

export default SyncConnectionManager.getInstance();
