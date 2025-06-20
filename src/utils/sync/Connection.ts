
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
  
  constructor(config: SyncConfig, handler: OperationHandler) {
    // Store the original config as immutable to prevent overwrites
    this.originalConfig = { ...config };
    
    // Include senderId in connectionId to ensure unique connections per sender
    this.connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}`;
    
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
        (payload) => this.handlePayload(payload)
      )
      .subscribe((status) => {
        debugLog('Subscription', `Status for ${this.connectionId}: ${status}`);
        this.info.isConnected = status === 'SUBSCRIBED';
        this.info.lastActivity = Date.now();
      });
    
    this.info = {
      channel,
      config: this.originalConfig, // Use immutable config
      handlers: new Set([handler]),
      isConnected: false,
      lastActivity: Date.now()
    };
    
    debugLog('Connection', `Created connection ${this.connectionId} with senderId: ${config.senderId}, isReceiveOnly: ${config.isReceiveOnly}`);
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
    debugLog('Send', `Connection ${this.connectionId} attempting to send operation - isReceiveOnly: ${this.originalConfig.isReceiveOnly}`);
    
    if (this.originalConfig.isReceiveOnly) {
      debugLog('Send', `Blocked operation send - connection is receive-only`);
      return null;
    }
    
    const fullOperation: WhiteboardOperation = {
      ...operation,
      whiteboard_id: this.originalConfig.whiteboardId,
      timestamp: Date.now(),
      sender_id: this.originalConfig.senderId // Use original config sender ID
    };
    
    debugLog('Send', `Sending ${fullOperation.operation_type} to database from ${this.originalConfig.senderId}`, fullOperation);
    
    // Send to Supabase
    const dbRecord = PayloadConverter.toDatabaseRecord(
      fullOperation, 
      this.originalConfig.sessionId
    );
    
    debugLog('Send', `Database record for insertion:`, dbRecord);
    
    supabase
      .from('whiteboard_data')
      .insert(dbRecord)
      .then(({ error, data }) => {
        if (error) {
          logError('Connection', 'Error sending operation to database', error);
          debugLog('Send', `Database insertion failed for ${fullOperation.operation_type}:`, error);
        } else {
          debugLog('Send', `Successfully sent ${fullOperation.operation_type} to database`, data);
          this.info.lastActivity = Date.now();
        }
      });
    
    return fullOperation;
  }
  
  /**
   * Close this connection
   */
  close() {
    supabase.removeChannel(this.info.channel);
    debugLog('Connection', `Closed connection ${this.connectionId}`);
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
   * REMOVED: updateConfig method to prevent config overwrites
   * Each connection maintains its immutable original configuration
   */
  
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
}
