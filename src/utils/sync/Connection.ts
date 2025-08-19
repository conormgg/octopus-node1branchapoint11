
import { ConnectionInfo, OperationHandler } from './types';
import { PayloadConverter } from './PayloadConverter';
import { SyncConfig, WhiteboardOperation } from '@/types/sync';
import { createDebugLogger, logError } from '@/utils/debug/debugConfig';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const debugLog = createDebugLogger('connection');

export class Connection {
  private info: ConnectionInfo;
  private connectionId: string;
  private readonly originalConfig: SyncConfig; // Store immutable original config
  
  constructor(config: SyncConfig, handler: OperationHandler, channel: RealtimeChannel) {
    // Store the original config as immutable to prevent overwrites
    this.originalConfig = { ...config };
    
    // Include senderId and read/write state in connectionId to ensure unique connections
    this.connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}-${config.isReceiveOnly ? 'ro' : 'rw'}`;
    
    this.info = {
      channel, // Use the provided shared channel
      config: this.originalConfig, // Use immutable config
      handlers: new Set([handler]),
      isConnected: channel.state === 'joined',
      lastActivity: Date.now()
    };
    
    debugLog('Connection', `Created connection ${this.connectionId} with senderId: ${config.senderId}`);
  }
  
  /**
   * Handle incoming payload from database (called by SyncConnectionManager)
   */
  public handlePayload(payload: any): void {
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
   * Update connection status (called by SyncConnectionManager)
   */
  public updateConnectionStatus(isConnected: boolean): void {
    this.info.isConnected = isConnected;
    this.info.lastActivity = Date.now();
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
    
    // Check authentication status and use appropriate method
    this.sendOperationWithAuth(fullOperation);
    
    return fullOperation;
  }

  /**
   * Send operation with proper authentication detection
   */
  private async sendOperationWithAuth(fullOperation: WhiteboardOperation): Promise<void> {
    const sessionUuid = this.originalConfig.sessionId;
    
    try {
      // Check if user is authenticated by getting current session
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        debugLog('Auth', 'Error checking session, assuming anonymous user', authError);
      }
      
      const isAuthenticated = session?.user?.id;
      
      if (isAuthenticated) {
        // Use direct insert for authenticated users
        const dbRecord = PayloadConverter.toDatabaseRecord(
          fullOperation, 
          this.originalConfig.sessionId
        );
        
        const { error, data } = await supabase
          .from('whiteboard_data')
          .insert(dbRecord);
          
        if (error) {
          logError('Connection', 'Error sending operation via direct insert', error);
        } else {
          debugLog('Send', 'Successfully sent operation via direct insert', data);
          this.info.lastActivity = Date.now();
        }
      } else {
        // Use public RPC for anonymous users (bypasses RLS)
        const { error, data } = await supabase
          .rpc('public_save_whiteboard_operation', {
            p_session_id: sessionUuid,
            p_board_id: fullOperation.whiteboard_id,
            p_action_type: fullOperation.operation_type,
            p_object_data: fullOperation.data,
            p_user_id: fullOperation.sender_id
          });
          
        if (error) {
          logError('Connection', 'Error sending operation via public RPC', error);
        } else {
          debugLog('Send', 'Successfully sent operation via public RPC', data);
          this.info.lastActivity = Date.now();
        }
      }
    } catch (err) {
      logError('Connection', 'Error in sendOperationWithAuth', err);
    }
  }
  
  /**
   * Close this connection (channel cleanup is handled by SyncConnectionManager)
   */
  close() {
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
   * Get the connection ID
   */
  getConnectionId(): string {
    return this.connectionId;
  }
  
  /**
   * Get the whiteboard ID for channel cleanup
   */
  getWhiteboardId(): string {
    return this.originalConfig.whiteboardId;
  }
  
  /**
   * Get the original sender ID for debugging
   */
  getSenderId(): string {
    return this.originalConfig.senderId;
  }
}
