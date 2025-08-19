# Sync Architecture Deep Dive

## 🚨 CRITICAL WARNING

This document describes the sync architecture that has caused **multiple production outages** when modified incorrectly. The sender ID filtering and immutable configuration patterns are extremely fragile. **DO NOT modify sync-related files without understanding every detail in this document.**

## Architecture Overview

The OctoPi Ink sync system enables real-time collaboration between multiple users on shared whiteboards. The architecture is built around three core principles:

1. **Immutable Sender Identity**: Each connection maintains a fixed sender ID that never changes
2. **Operation Filtering**: Prevents echo-back loops by filtering operations from the same sender
3. **Connection Pooling**: Efficiently shares Supabase channels while maintaining sender isolation

## Core Components

### 1. Connection (`src/utils/sync/Connection.ts`)

The Connection class manages a single Supabase realtime channel for a specific whiteboard and sender combination.

**Critical Implementation Details:**
```typescript
export class Connection {
  private info: ConnectionInfo;
  private connectionId: string;
  private readonly originalConfig: SyncConfig; // ⚠️ IMMUTABLE
  
  constructor(config: SyncConfig, handler: OperationHandler) {
    // Store the original config as immutable to prevent overwrites
    this.originalConfig = { ...config }; // ⚠️ NEVER MODIFY
    
    // Include senderId in connectionId to ensure unique connections per sender
    this.connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}`;
  }
}
```

**Key Responsibilities:**
- Maintains immutable sender ID configuration
- Filters incoming operations to prevent echo-back
- Manages Supabase channel subscription lifecycle
- Provides debugging information for operation flow

**Critical Filtering Logic:**
```typescript
private handlePayload(payload: any) {
  const operation = PayloadConverter.toOperation(payload);
  
  // Notify all registered handlers except the sender
  this.info.handlers.forEach(handler => {
    // Don't send operations back to the sender using the ORIGINAL config
    if (operation.sender_id !== this.originalConfig.senderId) {
      handler(operation); // Forward to handlers
    } else {
      // Skip - this is our own operation
    }
  });
}
```

### 2. SyncConnectionManager (`src/utils/sync/SyncConnectionManager.ts`)

The SyncConnectionManager is a singleton that pools connections and manages handler registration.

**Critical Implementation Details:**
```typescript
class SyncConnectionManager {
  private connections: Map<string, Connection> = new Map();
  
  public registerHandler(config: SyncConfig, handler: OperationHandler) {
    // Include sender ID in connection ID to prevent conflicts
    const connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}`;
    let connection = this.connections.get(connectionId);
    
    if (!connection) {
      // Create new connection with immutable config
      connection = new Connection(config, handler);
      this.connections.set(connectionId, connection);
    } else {
      // Connection exists, just add the handler
      connection.addHandler(handler);
      
      // ⚠️ DO NOT update config - each connection maintains its immutable config
      // This prevents sender ID overwrites that cause operation filtering issues
    }
  }
}
```

**Key Responsibilities:**
- Pools connections by whiteboard + session + sender ID
- Prevents config overwrites that break filtering
- Manages connection lifecycle with grace periods
- Provides debugging information about active connections

### 3. Payload Conversion (`src/utils/sync/PayloadConverter.ts`)

Handles conversion between internal operation format and database storage format.

## Operation Flow Diagrams

### Single User Operation Flow
```
Teacher1 draws line:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ User draws line │───▶│ Tool handler     │───▶│ sendOperation   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ UI updates      │◀───│ State update     │◀───│ Add sender_id   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Supabase insert │◀───│ Database format  │◀───│ PayloadConverter│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Multi-User Sync Flow
```
Teacher1 operation gets synced to Student1:

Teacher1:                          Supabase:                    Student1:
┌─────────────┐    insert      ┌─────────────┐    realtime   ┌─────────────┐
│ sendOperation│──────────────▶│ Database    │──────────────▶│ handlePayload│
└─────────────┘               └─────────────┘               └─────────────┘
                                                                     │
                                                            ┌─────────────┐
                                                            │ Filter check│
                                                            │ sender_id ≠ │
                                                            │ 'student1'  │
                                                            └─────────────┘
                                                                     │ ✓ Pass
                                                            ┌─────────────┐
                                                            │ Apply to    │
                                                            │ local state │
                                                            └─────────────┘
```

### Echo-Back Prevention
```
Teacher1 operation echo-back prevention:

Teacher1:                          Supabase:                    Teacher1:
┌─────────────┐    insert      ┌─────────────┐    realtime   ┌─────────────┐
│ sendOperation│──────────────▶│ Database    │──────────────▶│ handlePayload│
│ sender_id:   │               │ sender_id:  │               │ Received:   │
│ 'teacher1'   │               │ 'teacher1'  │               │ 'teacher1'  │
└─────────────┘               └─────────────┘               └─────────────┘
                                                                     │
                                                            ┌─────────────┐
                                                            │ Filter check│
                                                            │ sender_id = │
                                                            │ 'teacher1'  │
                                                            └─────────────┘
                                                                     │ ✗ Block
                                                            ┌─────────────┐
                                                            │ Skip - our  │
                                                            │ own operation│
                                                            └─────────────┘
```

## Common Pitfalls and How to Avoid Them

### 1. Config Overwrites (CRITICAL)

**❌ NEVER DO THIS:**
```typescript
// This breaks sender ID filtering!
class SyncConnectionManager {
  registerHandler(config: SyncConfig, handler: OperationHandler) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.updateConfig(config); // ❌ FORBIDDEN
    }
  }
}
```

**✅ CORRECT APPROACH:**
```typescript
class SyncConnectionManager {
  registerHandler(config: SyncConfig, handler: OperationHandler) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.addHandler(handler); // ✅ Just add handler
      // Keep original immutable config
    }
  }
}
```

### 2. Missing Sender ID in Connection Key

**❌ WRONG - Causes conflicts:**
```typescript
// This allows different senders to share connections!
const connectionId = `${config.whiteboardId}-${config.sessionId}`;
```

**✅ CORRECT - Isolates by sender:**
```typescript
// Each sender gets its own connection
const connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}`;
```

### 3. Incorrect Filtering Logic

**❌ WRONG - Causes infinite loops:**
```typescript
// Using current config instead of original
if (operation.sender_id !== this.currentConfig.senderId) {
  handler(operation); // ❌ Config might have changed
}
```

**✅ CORRECT - Uses immutable original:**
```typescript
// Always use original immutable config
if (operation.sender_id !== this.originalConfig.senderId) {
  handler(operation); // ✅ Reliable filtering
}
```

## Debugging Guide

### Enable Sync Debugging
```typescript
// Add to any component using sync
import { createDebugLogger } from '@/utils/debug/debugConfig';
const debugLog = createDebugLogger('sync');
```

### Key Debug Points

1. **Connection Creation:**
```typescript
debugLog('Connection', `Created connection ${connectionId} with senderId: ${config.senderId}`);
```

2. **Operation Filtering:**
```typescript
debugLog('Dispatch', `Operation from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`);
debugLog('Dispatch', `Skipping operation from self (${operation.sender_id})`);
```

3. **Config Protection:**
```typescript
debugLog('Manager', `Keeping original config for ${connectionId} to prevent sender ID conflicts`);
```

### Debug Output Analysis

**Healthy sync output:**
```
[Connection] Created connection board-123-session-456-teacher1 with senderId: teacher1
[Dispatch] Operation from: student1, local: teacher1 ← Operation received
[Dispatch] Skipping operation from self (teacher1) ← Echo-back prevented
```

**Problematic output (indicates config overwrite):**
```
[Connection] Created connection board-123-session-456-teacher1 with senderId: teacher1
[Dispatch] Operation from: teacher1, local: student1 ← Sender ID changed!
[Dispatch] Skipping operation from self (student1) ← Wrong filtering
```

## Testing Multi-Component Scenarios

### Test Setup
```typescript
// Simulate Teacher1 + Student1 on same whiteboard
const teacher1Config = {
  whiteboardId: 'board-123',
  sessionId: 'session-456',
  senderId: 'teacher1'
};

const student1Config = {
  whiteboardId: 'board-123',
  sessionId: 'session-456',
  senderId: 'student1'
};

// Both should register without conflicts
SyncConnectionManager.registerHandler(teacher1Config, teacher1Handler);
SyncConnectionManager.registerHandler(student1Config, student1Handler);
```

### Expected Behavior
- Teacher1 sees operations from Student1 ✓
- Student1 sees operations from Teacher1 ✓
- Teacher1 does NOT see own operations ✓
- Student1 does NOT see own operations ✓

## File Modification Checklist

Before modifying any sync-related files, ensure:

- [ ] I understand the immutable config pattern
- [ ] I know how sender ID filtering works
- [ ] I've tested with multiple components (Teacher1 + Student1)
- [ ] I've verified no config overwrites occur
- [ ] I've added appropriate debug logging
- [ ] I've tested operation echo-back prevention
- [ ] I've documented any changes to this file

## Broadcast Channel Architecture

### Real-time Sync Direction Updates

The application uses Supabase broadcast channels to instantly propagate sync direction changes (teacher control toggles) to all participants, bypassing RLS restrictions.

#### Broadcast Channel Components

**useSyncDirectionBroadcastListener** (`src/hooks/useSyncDirectionBroadcastListener.ts`)
- Listens for sync direction changes via broadcast channels
- Bypasses RLS policies for instant updates
- Updates student UI state immediately when teacher toggles control

**Key Implementation:**
```typescript
const channel = supabase.channel(`sync-direction-broadcast-${sessionId}`, {
  config: { broadcast: { self: false } }
});

channel.on('broadcast', { event: 'sync_direction_changed' }, handleBroadcast);
```

**Broadcast Payload:**
```typescript
{
  participantId: number;
  syncDirection: SyncDirection;
  boardSuffix: string;
  timestamp: number;
}
```

### Database Real-time Subscriptions

**Anonymous Access for Real-time Updates:**
Students can now receive real-time whiteboard updates via Supabase real-time subscriptions using an anonymous RLS policy:

```sql
-- Allow anonymous reads for real-time streaming
CREATE POLICY "Allow anonymous reads for real-time streaming" 
ON "public"."whiteboard_data" 
AS PERMISSIVE 
FOR SELECT 
TO anon 
USING (true);
```

**Hybrid Architecture Benefits:**
1. **Connection-based sync**: For user-generated operations with sender filtering
2. **Database real-time**: For receiving teacher updates without authentication
3. **Broadcast channels**: For instant sync direction changes bypassing RLS

### Debugging Broadcast Channels

**Enable broadcast debugging:**
```typescript
const debugLog = createDebugLogger('sync');

// In broadcast sender
debugLog('broadcast-send', `Broadcasting sync direction change: ${participantId} -> ${direction}`);

// In broadcast listener
debugLog('broadcast-received', `Received sync direction change: participant ${participantId} -> ${syncDirection}`);
```

## Files Requiring Expert Understanding

- `src/utils/sync/Connection.ts` - Core connection and filtering logic
- `src/utils/sync/SyncConnectionManager.ts` - Connection pooling and lifecycle
- `src/hooks/useSyncState.ts` - Hook integration with connection manager
- `src/hooks/useRemoteOperationHandler.ts` - Remote operation processing
- `src/hooks/shared/useSharedOperationsCoordinator.ts` - Operation coordination
- `src/hooks/useSyncDirectionBroadcastListener.ts` - Real-time sync direction updates
- `src/hooks/useSyncDirectionManager.ts` - Sync direction state management

**Remember: This architecture has caused production outages when modified incorrectly. When in doubt, don't modify it.**
