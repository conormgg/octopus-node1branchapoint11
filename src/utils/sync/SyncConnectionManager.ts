
import { Connection } from './Connection';
import { OperationHandler } from './types';
import { SyncConfig } from '@/types/sync';
import { createDebugLogger, logError } from '@/utils/debug/debugConfig';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const debugLog = createDebugLogger('sync');

export class SyncConnectionManager {
  private static instance: SyncConnectionManager | null = null;
  private connections = new Map<string, Connection>();
  private channels = new Map<string, RealtimeChannel>();

  /**
   * Get the singleton instance of the SyncConnectionManager
   */
  static getInstance(): SyncConnectionManager {
    if (!SyncConnectionManager.instance) {
      SyncConnectionManager.instance = new SyncConnectionManager();
    }
    return SyncConnectionManager.instance;
  }

  /**
   * Create a unique connection ID based on the configuration
   */
  private createConnectionId(config: SyncConfig): string {
    return `${config.whiteboardId}-${config.sessionId}-${config.senderId}`;
  }

  /**
   * Get or create a connection for the given configuration
   */
  async connect(config: SyncConfig, handler: OperationHandler): Promise<Connection> {
    const connectionId = this.createConnectionId(config);
    
    debugLog('Manager', `Connecting with config:`, config);
    debugLog('Manager', `Connection ID: ${connectionId}`);
    
    // Check if connection already exists
    let connection = this.connections.get(connectionId);
    
    if (connection) {
      debugLog('Manager', `Reusing existing connection ${connectionId}`);
      connection.addHandler(handler);
      return connection;
    }

    // Create new connection
    debugLog('Manager', `Creating new connection ${connectionId}`);
    
    // Get or create the Supabase realtime channel for this whiteboard
    const channel = await this.getOrCreateChannel(config.whiteboardId);
    
    // Create the connection
    connection = new Connection(config, handler, channel);
    this.connections.set(connectionId, connection);
    
    debugLog('Manager', `Created connection ${connectionId}, total connections: ${this.connections.size}`);
    
    return connection;
  }

  /**
   * Get or create a Supabase realtime channel for a whiteboard
   */
  private async getOrCreateChannel(whiteboardId: string): Promise<RealtimeChannel> {
    let channel = this.channels.get(whiteboardId);
    
    if (channel) {
      debugLog('Channel', `Reusing existing channel for whiteboard ${whiteboardId}`);
      return channel;
    }

    debugLog('Channel', `Creating new channel for whiteboard ${whiteboardId}`);
    
    // Create channel with board_id filter
    channel = supabase
      .channel(`whiteboard_${whiteboardId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'whiteboard_data',
          filter: `board_id=eq.${whiteboardId}`
        },
        (payload) => this.handleRealtimePayload(whiteboardId, payload)
      );

    // Subscribe to the channel
    const subscribePromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Channel subscription timeout'));
      }, 10000);

      channel!.subscribe((status) => {
        clearTimeout(timeout);
        if (status === 'SUBSCRIBED') {
          debugLog('Channel', `Successfully subscribed to channel for whiteboard ${whiteboardId}`);
          this.updateConnectionStatuses(whiteboardId, true);
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          debugLog('Channel', `Channel subscription failed for whiteboard ${whiteboardId}: ${status}`);
          this.updateConnectionStatuses(whiteboardId, false);
          reject(new Error(`Channel subscription failed: ${status}`));
        }
      });
    });

    try {
      await subscribePromise;
      this.channels.set(whiteboardId, channel);
      debugLog('Channel', `Stored channel for whiteboard ${whiteboardId}, total channels: ${this.channels.size}`);
      return channel;
    } catch (error) {
      logError('Channel', `Failed to create channel for whiteboard ${whiteboardId}`, error);
      throw error;
    }
  }

  /**
   * Handle a realtime payload from Supabase
   */
  private handleRealtimePayload(whiteboardId: string, payload: any): void {
    debugLog('Manager', `Received realtime payload for whiteboard ${whiteboardId}`, payload);
    
    // Iterate through all connections and pass the payload to the appropriate ones
    this.connections.forEach(connection => {
      if (connection.getWhiteboardId() === whiteboardId) {
        connection.handlePayload(payload);
      }
    });
  }

  /**
   * Remove a handler from a connection
   */
  async disconnect(config: SyncConfig, handler: OperationHandler): Promise<void> {
    const connectionId = this.createConnectionId(config);
    const connection = this.connections.get(connectionId);

    if (!connection) {
      debugLog('Manager', `No connection found for ID ${connectionId}, skipping disconnect`);
      return;
    }

    connection.removeHandler(handler);

    // If this was the last handler, close the connection and remove the channel
    if (connection.handlerCount === 0) {
      debugLog('Manager', `Last handler removed from connection ${connectionId}, closing connection`);
      connection.close();
      this.connections.delete(connectionId);

      // Check if there are any other connections using the same whiteboard ID
      const whiteboardId = connection.getWhiteboardId();
      const hasOtherConnections = Array.from(this.connections.values()).some(conn => conn.getWhiteboardId() === whiteboardId);

      if (!hasOtherConnections) {
        // If no other connections are using the channel, unsubsribe and remove it
        debugLog('Manager', `No other connections using whiteboard ${whiteboardId}, unsubscribing channel`);
        await this.removeChannel(whiteboardId);
      } else {
        debugLog('Manager', `Other connections are using whiteboard ${whiteboardId}, skipping channel removal`);
      }
    } else {
      debugLog('Manager', `Handler removed from connection ${connectionId}, ${connection.handlerCount} handlers remaining`);
    }
  }

  /**
   * Remove a channel and unsubscribe from it
   */
  private async removeChannel(whiteboardId: string): Promise<void> {
    const channel = this.channels.get(whiteboardId);

    if (!channel) {
      debugLog('Channel', `No channel found for whiteboard ${whiteboardId}, skipping removal`);
      return;
    }

    try {
      const unsubscribePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Channel unsubscription timeout'));
        }, 10000);

        // Fix: unsubscribe method doesn't take a callback parameter
        const result = channel.unsubscribe();
        clearTimeout(timeout);
        
        if (result === 'ok') {
          debugLog('Channel', `Successfully unsubscribed from channel for whiteboard ${whiteboardId}`);
          resolve();
        } else {
          debugLog('Channel', `Channel unsubscription failed for whiteboard ${whiteboardId}: ${result}`);
          reject(new Error(`Channel unsubscription failed: ${result}`));
        }
      });

      await unsubscribePromise;
      this.channels.delete(whiteboardId);
      debugLog('Channel', `Removed channel for whiteboard ${whiteboardId}, total channels: ${this.channels.size}`);
    } catch (error) {
      logError('Channel', `Failed to remove channel for whiteboard ${whiteboardId}`, error);
    }
  }

  /**
   * Update connection statuses for all connections using a specific whiteboard
   */
  private updateConnectionStatuses(whiteboardId: string, isConnected: boolean): void {
    this.connections.forEach(connection => {
      if (connection.getWhiteboardId() === whiteboardId) {
        connection.updateConnectionStatus(isConnected);
      }
    });
  }

  /**
   * Debug method to log all connections
   */
  logConnections(): void {
    debugLog('Manager', `Logging all connections:`);
    this.connections.forEach((connection, connectionId) => {
      debugLog('Manager', `  ${connectionId}: ${connection.handlerCount} handlers, connected: ${connection.isConnected}, last activity: ${connection.lastActivity}`);
    });
  }
}
