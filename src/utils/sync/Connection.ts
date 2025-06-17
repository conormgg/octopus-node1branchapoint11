import { supabase } from '@/integrations/supabase/client';
import { ConnectionInfo, OperationHandler } from './types';
import { PayloadConverter } from './PayloadConverter';
import { SyncConfig, WhiteboardOperation } from '@/types/sync';
import { createDebugLogger, logError } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('connection');

export class Connection {
  private info: ConnectionInfo;
  private connectionId: string;
  private subscribed: boolean = false;
  
  constructor(config: SyncConfig, handler: OperationHandler) {
    this.connectionId = `${config.whiteboardId}-${config.sessionId}`;
    
    // Generate unique channel name to prevent conflicts
    const channelName = `whiteboard-${config.whiteboardId}-${Date.now()}`;
    
    try {
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
        );
      
      this.info = {
        channel,
        config,
        handlers: new Set([handler]),
        isConnected: false,
        lastActivity: Date.now()
      };
      
      // Subscribe with proper error handling
      this.subscribeWithRetry();
      
    } catch (error) {
      logError('Connection', `Failed to create connection for ${this.connectionId}`, error);
      throw error;
    }
  }
  
  /**
   * Subscribe with retry logic and error handling
   */
  private subscribeWithRetry(retryCount: number = 0) {
    if (this.subscribed) {
      debugLog('Connection', `Already subscribed to ${this.connectionId}`);
      return;
    }
    
    try {
      this.info.channel.subscribe((status) => {
        debugLog('Subscription', `Status for ${this.connectionId}: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          this.info.isConnected = true;
          this.subscribed = true;
          this.info.lastActivity = Date.now();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.info.isConnected = false;
          this.subscribed = false;
          
          // Retry subscription if failed and we haven't exceeded retry limit
          if (retryCount < 3) {
            debugLog('Connection', `Retrying subscription for ${this.connectionId} (attempt ${retryCount + 1})`);
            setTimeout(() => {
              this.subscribeWithRetry(retryCount + 1);
            }, Math.pow(2, retryCount) * 1000); // Exponential backoff
          } else {
            logError('Connection', `Failed to establish connection for ${this.connectionId} after 3 attempts`);
          }
        }
      });
    } catch (error) {
      logError('Connection', `Subscription error for ${this.connectionId}`, error);
      if (retryCount < 3) {
        setTimeout(() => {
          this.subscribeWithRetry(retryCount + 1);
        }, Math.pow(2, retryCount) * 1000);
      }
    }
  }
  
  /**
   * Handle incoming payload from database
   */
  private handlePayload(payload: any) {
    debugLog('Payload', 'Received operation', payload);
    
    try {
      // Convert to our internal operation format
      const operation = PayloadConverter.toOperation(payload);
      
      debugLog('Payload', 'Converted operation', operation);
      
      // Update activity timestamp
      this.info.lastActivity = Date.now();
      
      // Notify all registered handlers except the sender
      this.info.handlers.forEach(handler => {
        // Don't send operations back to the sender
        if (operation.sender_id !== this.info.config.senderId) {
          debugLog('Dispatch', `Operation to handler from: ${operation.sender_id}, local: ${this.info.config.senderId}`);
          handler(operation);
        } else {
          debugLog('Dispatch', `Skipping operation from self (${operation.sender_id})`);
        }
      });
    } catch (error) {
      logError('Connection', 'Error handling payload', error);
    }
  }
  
  /**
   * Add a new handler to this connection
   */
  addHandler(handler: OperationHandler) {
    this.info.handlers.add(handler);
    this.info.lastActivity = Date.now();
  }
  
  /**
   * Remove a handler from this connection
   */
  removeHandler(handler: OperationHandler) {
    this.info.handlers.delete(handler);
    this.info.lastActivity = Date.now();
  }
  
  /**
   * Send an operation using this connection
   */
  sendOperation(operation: Omit<WhiteboardOperation, 'id' | 'timestamp' | 'sender_id'>): WhiteboardOperation | null {
    if (this.info.config.isReceiveOnly) return null;
    
    const fullOperation: WhiteboardOperation = {
      ...operation,
      whiteboard_id: this.info.config.whiteboardId,
      timestamp: Date.now(),
      sender_id: this.info.config.senderId
    };
    
    debugLog('Send', `Sending ${fullOperation.operation_type} to database`);
    
    // Send to Supabase
    const dbRecord = PayloadConverter.toDatabaseRecord(
      fullOperation, 
      this.info.config.sessionId
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
    try {
      if (this.info.channel) {
        supabase.removeChannel(this.info.channel);
        this.subscribed = false;
        this.info.isConnected = false;
      }
    } catch (error) {
      logError('Connection', `Error closing connection ${this.connectionId}`, error);
    }
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
   * Update the config for this connection
   */
  updateConfig(config: SyncConfig) {
    this.info.config = config;
  }
  
  /**
   * Get the connection ID
   */
  getConnectionId(): string {
    return this.connectionId;
  }
}
