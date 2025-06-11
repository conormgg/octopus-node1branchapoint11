
import { WhiteboardOperation } from '@/types/sync';

export class PayloadConverter {
  /**
   * Converts a database payload to a WhiteboardOperation
   */
  static toOperation(payload: any): WhiteboardOperation {
    const data = payload.new as any;
    
    return {
      whiteboard_id: data.board_id,
      operation_type: data.action_type,
      timestamp: new Date(data.created_at).getTime(),
      sender_id: data.user_id,
      data: data.object_data
    };
  }
  
  /**
   * Converts a WhiteboardOperation to a database record
   */
  static toDatabaseRecord(operation: WhiteboardOperation, sessionId: string): any {
    return {
      action_type: operation.operation_type,
      board_id: operation.whiteboard_id,
      object_data: operation.data,
      object_id: `${operation.operation_type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      session_id: sessionId,
      user_id: operation.sender_id
    };
  }
}
