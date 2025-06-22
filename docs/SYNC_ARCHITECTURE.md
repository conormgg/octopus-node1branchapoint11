# Sync Architecture Deep Dive

## 🚨 CRITICAL WARNING

This document describes the sync architecture that has caused **multiple production outages** when modified incorrectly. The sender ID filtering and immutable configuration patterns are extremely fragile. **DO NOT modify sync-related files without understanding every detail in this document.**

## Architecture Overview

The OctoPi Ink sync system enables real-time collaboration between multiple users on shared whiteboards. The architecture is built around four core principles:

1. **Centralized Channel Management**: SyncConnectionManager pools and manages Supabase channels per whiteboard
2. **Immutable Sender Identity**: Each connection maintains a fixed sender ID that never changes
3. **Operation Filtering**: Prevents echo-back loops by filtering operations from the same sender
4. **Connection Pooling**: Efficiently shares channels while maintaining sender isolation

## Core Components

### 1. SyncConnectionManager (`src/utils/sync/SyncConnectionManager.ts`)

The SyncConnectionManager is a singleton that centrally manages Supabase channels and pools connections.

**Critical Implementation Details:**
```typescript
class SyncConnectionManager {
  private connections: Map<string, Connection> = new Map();
  private channels: Map<string, RealtimeChannel> = new Map(); // ⚠️ CENTRALIZED
  
  public registerHandler(config: SyncConfig, handler: OperationHandler) {
    // Centrally manage channel subscriptions - one channel per whiteboard
    const channelName = `whiteboard-${config.whiteboardId}`;
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      // Create and subscribe to new Supabase channel
      channel = supabase.channel(channelName)
        .on('postgres_changes', {...}, (payload) => 
          this.handleChannelPayload(payload, config.whiteboardId)
        )
        .subscribe();
      this.channels.set(channelName, channel);
    }
    
    // Create connection with shared channel
    connection = new Connection(config, handler, channel); // ⚠️ SHARED CHANNEL
  }
  
  // Centralized payload dispatch to all connections for a whiteboard
  private handleChannelPayload(payload: any, whiteboardId: string): void {
    this.connections.forEach((connection, connectionId) => {
      if (connectionId.startsWith(whiteboardId)) {
        connection.handlePayload(payload); // Dispatch to relevant connections
      }
    });
  }
}
```

**Key Responsibilities:**
- **Channel Pooling**: One Supabase channel per whiteboard, shared by all connections
- **Centralized Dispatch**: Routes incoming payloads to relevant connections
- **Connection Lifecycle**: Manages connection creation, handler registration, and cleanup
- **Channel Cleanup**: Removes unused channels when no connections remain

### 2. Connection (`src/utils/sync/Connection.ts`)

The Connection class manages sender-specific filtering and operation handling for a shared channel.

**Critical Implementation Details:**
```typescript
export class Connection {
  private info: ConnectionInfo;
  private connectionId: string;
  private readonly originalConfig: SyncConfig; // ⚠️ IMMUTABLE
  
  constructor(config: SyncConfig, handler: OperationHandler, channel: RealtimeChannel) {
    // Store the original config as immutable to prevent overwrites
    this.originalConfig = { ...config }; // ⚠️ NEVER MODIFY
    
    // Use the provided shared channel (managed by SyncConnectionManager)
    this.info = {
      channel, // ⚠️ SHARED CHANNEL, NOT CREATED HERE
      config: this.originalConfig,
      handlers: new Set([handler]),
      isConnected: channel.state === 'joined',
      lastActivity: Date.now()
    };
    
    // Include senderId in connectionId to ensure unique connections per sender
    this.connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}`;
  }
}
```

**Key Responsibilities:**
- Maintains immutable sender ID configuration
- Filters incoming operations to prevent echo-back (using shared channel data)
- Manages multiple handlers for the same sender
- Provides debugging information for operation flow

**Critical Filtering Logic:**
```typescript
public handlePayload(payload: any): void {
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

### 3. Payload Conversion (`src/utils/sync/PayloadConverter.ts`)

Handles conversion between internal operation format and database storage format.

## Operation Flow Diagrams

### Centralized Channel Management Flow
```
SyncConnectionManager (Singleton):
┌─────────────────────────┐    ┌──────────────────────────┐
│ registerHandler()       │───▶│ Check for existing       │
│ (Teacher1)              │    │ whiteboard channel       │
└─────────────────────────┘    └──────────────────────────┘
                                         │
                               ┌──────────────────────────┐
                               │ Create new channel if    │
                               │ needed, subscribe to     │
                               │ postgres_changes         │
                               └──────────────────────────┘
                                         │
                               ┌──────────────────────────┐
                               │ Create Connection with   │
                               │ shared channel           │
                               └──────────────────────────┘

registerHandler() (Student1):
┌─────────────────────────┐    ┌──────────────────────────┐
│ Same whiteboard         │───▶│ Reuse existing channel   │
│ different sender        │    │ (whiteboard-123)         │
└─────────────────────────┘    └──────────────────────────┘
                                         │
                               ┌──────────────────────────┐
                               │ Create new Connection    │
                               │ with same shared channel │
                               └──────────────────────────┘
```

### Centralized Payload Dispatch Flow
```
Supabase Realtime Event:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Database INSERT │───▶│ Channel receives │───▶│ SyncConnectionMgr│
│ (any sender)    │    │ postgres_changes │    │ handleChannelPayload│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                               ┌─────────────────┐
                                               │ Dispatch to ALL │
                                               │ connections for │
                                               │ this whiteboard │
                                               └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Teacher1        │◀───│ Connection       │◀───│ Each connection │
│ filters &       │    │ handlePayload()  │    │ filters by      │
│ applies if      │    │                  │    │ sender_id       │
│ sender ≠ self   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Student1        │◀───│ Connection       │◀───│ Same payload,   │
│ filters &       │    │ handlePayload()  │    │ different       │
│ applies if      │    │                  │    │ filtering       │
│ sender ≠ self   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Multi-User Sync Flow (Updated)
```
Teacher1 operation gets synced to Student1:

Teacher1:                 SyncConnectionMgr:              Student1:
┌─────────────┐    send   ┌─────────────┐    dispatch   ┌─────────────┐
│ sendOperation│─────────▶│ Shared      │──────────────▶│ handlePayload│
│ via Connection│          │ Channel     │               │ via same    │
└─────────────┘          └─────────────┘               │ Channel     │
       │                        │                      └─────────────┘
       ▼                        ▼                             │
┌─────────────┐          ┌─────────────┐                     │
│ Supabase    │◀─────────│ Centralized │                     │
│ INSERT      │          │ Dispatch    │                     │
└─────────────┘          └─────────────┘                     │
                                                             ▼
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

### Echo-Back Prevention (Updated)
```
Teacher1 operation echo-back prevention with centralized dispatch:

Teacher1:                 SyncConnectionMgr:              Teacher1:
┌─────────────┐    send   ┌─────────────┐    dispatch   ┌─────────────┐
│ sendOperation│─────────▶│ Shared      │──────────────▶│ handlePayload│
│ sender_id:   │          │ Channel     │               │ Received:   │
│ 'teacher1'   │          │ (broadcasts │               │ 'teacher1'  │
└─────────────┘          │ to ALL)     │               └─────────────┘
                         └─────────────┘                      │
                                │                             │
                         ┌─────────────┐                     │
                         │ Student1    │                     │
                         │ also gets   │                     │
                         │ same payload│                     │
                         └─────────────┘                     │
                                                             ▼
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

### 2. Manual Channel Creation in Connection

**❌ WRONG - Bypasses centralized management:**
```typescript
// Connection should NOT create its own channel
constructor(config: SyncConfig, handler: OperationHandler) {
  const channel = supabase.channel(`whiteboard-${config.whiteboardId}`); // ❌ FORBIDDEN
}
```

**✅ CORRECT - Uses shared channel:**
```typescript
// Connection accepts shared channel from manager
constructor(config: SyncConfig, handler: OperationHandler, channel: RealtimeChannel) {
  this.info = { channel, ... }; // ✅ Uses provided channel
}
```

### 3. Missing Sender ID in Connection Key

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

### 4. Incorrect Filtering Logic

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

### Key Debug Points (Updated for Centralized Architecture)

1. **Channel Creation (SyncConnectionManager):**
```typescript
debugLog('Manager', `Creating and subscribing to new Supabase channel: ${channelName}`);
debugLog('Manager', `Channel ${channelName} subscription status: ${status}`);
```

2. **Connection Creation:**
```typescript
debugLog('Connection', `Created connection ${connectionId} with senderId: ${config.senderId}`);
```

3. **Centralized Dispatch:**
```typescript
debugLog('Manager', 'Received payload from channel:', payload);
debugLog('Manager', `Dispatching to connections for whiteboard: ${whiteboardId}`);
```

4. **Operation Filtering:**
```typescript
debugLog('Dispatch', `Operation from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`);
debugLog('Dispatch', `Skipping operation from self (${operation.sender_id})`);
```

5. **Config Protection:**
```typescript
debugLog('Manager', `Keeping original config for ${connectionId} to prevent sender ID conflicts`);
```

### Debug Output Analysis (Updated)

**Healthy centralized sync output:**
```
[Manager] Creating and subscribing to new Supabase channel: whiteboard-board-123
[Manager] Channel whiteboard-board-123 subscription status: SUBSCRIBED
[Connection] Created connection board-123-session-456-teacher1 with senderId: teacher1
[Manager] Received payload from channel: {...}
[Manager] Dispatching to connections for whiteboard: board-123
[Dispatch] Operation from: student1, local: teacher1 ← Operation received
[Dispatch] Skipping operation from self (teacher1) ← Echo-back prevented
```

**Problematic output (indicates config overwrite):**
```
[Connection] Created connection board-123-session-456-teacher1 with senderId: teacher1
[Dispatch] Operation from: teacher1, local: student1 ← Sender ID changed!
[Dispatch] Skipping operation from self (student1) ← Wrong filtering
```

**Channel management issues:**
```
[Manager] Creating multiple channels for same whiteboard ← Channel pooling broken
[Error] Channel subscription failed ← Network/WebSocket issues
[Manager] No connections found for payload dispatch ← Connection cleanup too aggressive
```

## Testing Multi-Component Scenarios

### Test Setup (Updated)
```typescript
// Simulate Teacher1 + Student1 on same whiteboard with shared channel
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

// Both should register and share the same channel
SyncConnectionManager.registerHandler(teacher1Config, teacher1Handler);
SyncConnectionManager.registerHandler(student1Config, student1Handler);

// Verify shared channel
const debugInfo = SyncConnectionManager.getDebugInfo();
console.log('Active connections:', debugInfo);
```

### Expected Behavior (Updated)
- Teacher1 and Student1 share the same Supabase channel ✓
- Teacher1 sees operations from Student1 ✓
- Student1 sees operations from Teacher1 ✓
- Teacher1 does NOT see own operations ✓
- Student1 does NOT see own operations ✓
- Only one channel exists per whiteboard ✓
- Centralized dispatch works correctly ✓

## Real-time Connection Issues

### Common iPad/Incognito/Cross-Browser Issues
The centralized architecture helps with many real-time issues but some browser-specific problems remain:

1. **WebSocket Limitations**: Some browsers/contexts have stricter WebSocket policies
2. **Connection Timing**: Network latency can affect channel subscription timing
3. **Background Tab Throttling**: iOS Safari may throttle WebSocket connections in background tabs

### Debugging Real-time Issues
```typescript
// Check channel subscription status
const channel = this.channels.get(channelName);
console.log('Channel state:', channel?.state); // Should be 'joined'

// Monitor connection status updates
debugLog('Manager', `Channel ${channelName} subscription status: ${status}`);

// Verify payload dispatch
debugLog('Manager', 'Received payload from channel:', payload);
```

## File Modification Checklist (Updated)

Before modifying any sync-related files, ensure:

- [ ] I understand the centralized channel management pattern
- [ ] I understand the immutable config pattern
- [ ] I know how sender ID filtering works with shared channels
- [ ] I've tested with multiple components (Teacher1 + Student1)
- [ ] I've verified no config overwrites occur
- [ ] I've verified channel pooling works correctly
- [ ] I've added appropriate debug logging
- [ ] I've tested operation echo-back prevention
- [ ] I've tested channel cleanup and lifecycle
- [ ] I've documented any changes to this file

## Files Requiring Expert Understanding (Updated)

- `src/utils/sync/SyncConnectionManager.ts` - **CRITICAL**: Channel pooling and centralized dispatch
- `src/utils/sync/Connection.ts` - Core connection and filtering logic with shared channels
- `src/hooks/useSyncState.ts` - Hook integration with connection manager
- `src/hooks/useRemoteOperationHandler.ts` - Remote operation processing
- `src/hooks/shared/useSharedOperationsCoordinator.ts` - Operation coordination

**Remember: This architecture has caused production outages when modified incorrectly. The centralized channel management adds complexity that must be carefully maintained. When in doubt, don't modify it.**
