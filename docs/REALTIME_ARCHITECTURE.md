# Real-time Architecture Guide

## Overview

OctoPi Ink uses a sophisticated multi-layered real-time system that combines three different approaches to achieve optimal performance, security, and user experience across different collaboration scenarios.

## Architecture Layers

### 1. Connection-Based Sync (Core Operations)

**Purpose**: Handles user-generated drawing operations with sender identity filtering

**Implementation**: `src/utils/sync/Connection.ts`, `src/utils/sync/SyncConnectionManager.ts`

**Key Features**:
- Immutable sender ID for operation filtering
- Connection pooling by sender identity  
- Echo-back prevention
- Peer-to-peer operation synchronization

**Use Cases**:
- Drawing operations (lines, erasing)
- Image operations (paste, move, resize)
- Selection operations
- Undo/redo operations

### 2. Database Real-time Subscriptions (Teacher-to-Student Updates)

**Purpose**: Enables students to receive teacher updates without authentication

**Implementation**: Supabase real-time subscriptions with anonymous RLS policy

**Key Features**:
- Anonymous access for students
- Direct database-to-client streaming
- Reduced authentication complexity
- Optimized for teacher-main board updates

**RLS Policy**:
```sql
CREATE POLICY "Allow anonymous reads for real-time streaming" 
ON "public"."whiteboard_data" 
AS PERMISSIVE 
FOR SELECT 
TO anon 
USING (true);
```

**Use Cases**:
- Students receiving teacher drawing updates
- Real-time collaboration without student authentication
- Simplified connection management for read-only participants

### 3. Broadcast Channels (Instant Control Updates)

**Purpose**: Instant propagation of sync direction changes bypassing RLS restrictions

**Implementation**: `src/hooks/useSyncDirectionBroadcastListener.ts`

**Key Features**:
- Bypasses Row Level Security
- Instant UI state synchronization
- Minimal latency for control changes
- Channel-based messaging

**Use Cases**:
- Teacher control toggle propagation
- Sync direction state management  
- UI responsiveness for toolbar visibility
- Real-time participant control updates

## Data Flow Diagrams

### Multi-Layer Sync Flow

```
Teacher Action (Draw on Main Board):
┌─────────────────────┐
│ Teacher draws line  │
└─────────────────────┘
           │
    ┌─────────────────────┐     ┌──────────────────────┐
    │ Connection-based    │────▶│ Database Insert      │
    │ Sync (self)         │     │ (whiteboard_data)    │
    └─────────────────────┘     └──────────────────────┘
           │                               │
           ▼                               │
    ┌─────────────────────┐               │
    │ Local UI Update     │               │
    │ (immediate feedback)│               │
    └─────────────────────┘               │
                                         │
    ┌─────────────────────────────────────┘
    │
    ▼
┌─────────────────────┐     ┌──────────────────────┐
│ Database Real-time  │────▶│ Student Reception    │
│ Subscription        │     │ (anonymous)          │
└─────────────────────┘     └──────────────────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ Student UI Update    │
                            │ (teacher content)    │
                            └──────────────────────┘
```

### Sync Direction Broadcast Flow

```
Teacher Control Toggle:
┌─────────────────────┐     ┌──────────────────────┐
│ Teacher toggles     │────▶│ Database Update      │
│ sync direction      │     │ (session_participants│
└─────────────────────┘     └──────────────────────┘
           │                               │
           ▼                               ▼
┌─────────────────────┐     ┌──────────────────────┐
│ Broadcast Channel   │     │ Real-time Sub        │
│ (instant)           │     │ (eventual)           │
└─────────────────────┘     └──────────────────────┘
           │                               │
           ▼                               │
┌─────────────────────┐               │
│ All Students        │◀──────────────────┘
│ Receive Broadcast   │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│ Instant UI Update   │
│ (toolbar visibility)│
└─────────────────────┘
```

## Implementation Patterns

### Anonymous Real-time Subscription

```typescript
// Student subscribing to teacher updates without auth
const setupRealtimeSubscription = (sessionId: string, boardId: string) => {
  const channel = supabase
    .channel('schema-db-changes')
    .on('postgres_changes', {
      event: 'INSERT', 
      schema: 'public',
      table: 'whiteboard_data',
      filter: `session_id=eq.${sessionId}&board_id=eq.${boardId}`
    }, (payload) => {
      const operation = convertToWhiteboardOperation(payload.new);
      handleRealtimeUpdate(operation);
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
};
```

### Broadcast Channel Setup

```typescript
// Teacher broadcasting sync direction changes
const broadcastSyncDirection = async (
  sessionId: string,
  participantId: number, 
  syncDirection: SyncDirection
) => {
  const channel = supabase.channel(`sync-direction-broadcast-${sessionId}`, {
    config: { broadcast: { self: false } }
  });

  await channel.send({
    type: 'broadcast',
    event: 'sync_direction_changed',
    payload: { 
      participantId, 
      syncDirection, 
      boardSuffix: 'A', 
      timestamp: Date.now() 
    }
  });
};

// Student listening for broadcasts
const useSyncDirectionListener = (sessionId: string, onUpdate: Function) => {
  useEffect(() => {
    const channel = supabase.channel(`sync-direction-broadcast-${sessionId}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'sync_direction_changed' }, onUpdate)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId, onUpdate]);
};
```

## Security Considerations

### Anonymous Access Strategy

**Benefits**:
- Simplified student onboarding (no authentication required)
- Reduced connection management complexity
- Faster real-time updates for read operations

**Safeguards**:
- Read-only access (SELECT only)
- Session-scoped data access
- No write permissions for anonymous users
- Broadcast channels for control without database writes

### RLS Policy Design

```sql
-- Anonymous reads for real-time streaming only
CREATE POLICY "Allow anonymous reads for real-time streaming" 
ON "public"."whiteboard_data" 
AS PERMISSIVE 
FOR SELECT 
TO anon 
USING (true);

-- Authenticated writes for operation sending
CREATE POLICY "Allow authenticated writes" 
ON "public"."whiteboard_data" 
AS PERMISSIVE 
FOR INSERT 
TO authenticated 
USING (true);
```

## Performance Optimization

### Connection Management

- **Connection Pooling**: Reuse connections by sender identity
- **Grace Periods**: Prevent rapid connect/disconnect cycles  
- **Selective Subscriptions**: Only subscribe to relevant channels
- **Channel Cleanup**: Proper cleanup prevents memory leaks

### Real-time Efficiency

- **Targeted Filters**: Subscribe only to specific session/board combinations
- **Payload Optimization**: Minimize data in real-time messages
- **Batch Operations**: Group multiple updates when possible
- **Debouncing**: Prevent excessive update frequency

## Troubleshooting Guide

### Common Issues and Solutions

**1. Students Not Receiving Teacher Updates**
- Check anonymous RLS policy exists and is enabled
- Verify real-time subscription filter matches teacher board ID
- Confirm session ID in filter is correct
- Test with database logs to verify inserts are happening

**2. Sync Direction Not Updating Instantly**
- Verify broadcast channel names match between sender and receiver
- Check broadcast payload structure and participant ID matching
- Confirm channel subscription is active before broadcasting
- Test broadcast reception with debug logging

**3. Authentication Errors in Real-time**
- Ensure anonymous access is configured in Supabase
- Check that student clients are not attempting authenticated operations
- Verify RLS policies allow anonymous SELECT operations
- Confirm anon key is valid and not expired

### Debug Logging Strategy

```typescript
// Enable comprehensive debugging
const debugLog = createDebugLogger('realtime');

// Connection-based sync debugging
debugLog('connection', `Created connection for ${senderId}`);
debugLog('operation', `Sending operation: ${operation.type}`);
debugLog('filter', `Filtering operation from ${operation.sender_id}`);

// Database real-time debugging  
debugLog('realtime-setup', `Subscribing to ${boardId} updates`);
debugLog('realtime-received', `Received: ${operation.action_type}`);

// Broadcast debugging
debugLog('broadcast-send', `Broadcasting to session ${sessionId}`);
debugLog('broadcast-received', `Participant ${participantId}: ${direction}`);
```

### Monitoring and Metrics

**Key Performance Indicators**:
- Real-time message latency
- Connection establishment time  
- Broadcast delivery success rate
- Anonymous subscription health
- Operation filtering accuracy

**Monitoring Tools**:
- Supabase real-time logs
- Browser network inspection
- Custom debug logging
- Performance timing measurements

## Migration Considerations

### From Single-Layer to Multi-Layer

**Benefits of Migration**:
- Improved performance for different use cases
- Reduced authentication complexity
- Better user experience for control changes
- More robust error handling

**Migration Strategy**:
1. Implement database real-time alongside existing connections
2. Add broadcast channels for control updates
3. Gradually migrate components to optimal patterns
4. Maintain backward compatibility during transition
5. Monitor performance and adjust layer usage

### Future Enhancements

**Potential Improvements**:
- WebRTC for peer-to-peer drawing (ultra-low latency)
- Operational transforms for conflict resolution
- Presence indicators using Supabase presence
- Voice/video integration with real-time drawing
- Advanced caching strategies for offline support