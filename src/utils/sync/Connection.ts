
import { supabase } from '@/integrations/supabase/client';
import { ConnectionInfo, OperationHandler } from './types';
import { PayloadConverter } from './PayloadConverter';
import { SyncConfig, WhiteboardOperation } from '@/types/sync';
import { createDebugLogger, logError } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('connection');

export class Connection {
  private info: ConnectionInfo;
  private connectionId: string;
  private readonly originalConfig: SyncConfig; // Store immutable original config
  private channelName: string;
  
  constructor(config: SyncConfig, handler: OperationHandler) {
    // Store the original config as immutable to prevent overwrites
    this.originalConfig = { ...config };
    
    // Include senderId in connectionId to ensure unique connections per sender
    this.connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}`;
    
    // Create a unique channel name that won't conflict with participant channels
    // Format: wb-sync-{whiteboardId}-{timestamp} for absolute uniqueness
    this.channelName = `wb-sync-${config.whiteboardId}-${Date.now()}`;
    
    debugLog('Connection', `Creating whiteboard sync channel: ${this.channelName} for connection ${this.connectionId}`);
    
    const channel = supabase
      .channel(this.channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whiteboard_data',
          filter: `board_id=eq.${config.whiteboardId}`
        },
        (payload) => this.handlePayload(payload)
      )
      .subscribe((status) => {
        debugLog('Subscription', `Whiteboard sync status for ${this.connectionId}: ${status} (channel: ${this.channelName})`);
        this.info.isConnected = status === 'SUBSCRIBED';
        this.info.lastActivity = Date.now();
        
        if (status === 'CHANNEL_ERROR') {
          logError('Connection', `Channel error for ${this.connectionId}`, { channelName: this.channelName });
        }
      });
    
    this.info = {
      channel,
      config: this.originalConfig, // Use immutable config
      handlers: new Set([handler]),
      isConnected: false,
      lastActivity: Date.now()
    };
    
    debugLog('Connection', `Created connection ${this.connectionId} with senderId: ${config.senderId}, channel: ${this.channelName}`);
  }
  
  /**
   * Handle incoming payload from database
   */
  private handlePayload(payload: any) {
    debugLog('Payload', 'Received operation', payload);
    
    // Convert to our internal operation format
    const operation = PayloadConverter.toOperation(payload);
    
    debugLog('Payload', 'Converted operation', operation);
    
    // Update activity timestamp
    this.info.lastActivity = Date.now();
    
    // Notify all registered handlers except the sender
    this.info.handlers.forEach(handler => {
      // Don't send operations back to the sender using the ORIGINAL config
      if (operation.sender_id !== this.originalConfig.senderId) {
        debugLog('Dispatch', `Operation to handler from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`);
        handler(operation);
      } else {
        debugLog('Dispatch', `Skipping operation from self (${operation.sender_id})`);
      }
    });
  }
  
  /**
   * Add a new handler to this connection
   */
  addHandler(handler: OperationHandler) {
    this.info.handlers.add(handler);
    this.info.lastActivity = Date.now();
    debugLog('Connection', `Added handler to ${this.connectionId}, total handlers: ${this.info.handlers.size}`);
  }
  
  /**
   * Remove a handler from this connection
   */
  removeHandler(handler: OperationHandler) {
    this.info.handlers.delete(handler);
    this.info.lastActivity = Date.now();
    debugLog('Connection', `Removed handler from ${this.connectionId}, remaining handlers: ${this.info.handlers.size}`);
  }
  
  /**
   * Send an operation using this connection
   */
  sendOperation(operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>): WhiteboardOperation | null {
    if (this.originalConfig.isReceiveOnly) return null;
    
    const fullOperation: WhiteboardOperation = {
      ...operation,
      whiteboard_id: this.originalConfig.whiteboardId,
      timestamp: Date.now(),
      sender_id: this.originalConfig.senderId // Use original config sender ID
    };
    
    debugLog('Send', `Sending ${fullOperation.operation_type} to database from ${this.originalConfig.senderId}`);
    
    // Send to Supabase
    const dbRecord = PayloadConverter.toDatabaseRecord(
      fullOperation, 
      this.originalConfig.sessionId
    );
    
    supabase
      .from('whiteboard_data')
      .insert(dbRecord)
      .then(({ error, data }) => {
        if (error) {
          logError('Connection', 'Error sending operation', error);
        } else {
          debugLog('Send', 'Successfully sent operation', data);
          this.info.lastActivity = Date.now();
        }
      });
    
    return fullOperation;
  }
  
  /**
   * Close this connection
   */
  close() {
    debugLog('Connection', `Closing connection ${this.connectionId} and removing channel ${this.channelName}`);
    supabase.removeChannel(this.info.channel);
  }
  
  /**
   * Get the number of handlers for this connection
   */
  get handlerCount(): number {
    return this.info.handlers.size;
  }
  
  /**
   * Get the connection status
   */
  get isConnected(): boolean {
    return this.info.isConnected;
  }
  
  /**
   * Get the last activity timestamp
   */
  get lastActivity(): number {
    return this.info.lastActivity;
  }
  
  /**
   * Get the connection ID
   */
  getConnectionId(): string {
    return this.connectionId;
  }
  
  /**
   * Get the original sender ID for debugging
   */
  getSenderId(): string {
    return this.originalConfig.senderId;
  }
  
  /**
   * Get the channel name for debugging
   */
  getChannelName(): string {
    return this.channelName;
  }
}
