# Architecture Decision Records

## ADR-001: Event Handling Strategy

### Status
Accepted

### Context
The whiteboard needs to handle various input types (mouse, touch, stylus) while providing palm rejection for stylus users. Different browsers and devices have varying support for pointer events.

### Decision
Implement a dual event system:
1. **Pointer Events** (primary): Used when palm rejection is enabled and supported
2. **Touch/Mouse Events** (fallback): Used when pointer events aren't available or palm rejection is disabled

### Rationale
- Pointer events provide the most precise control for stylus input
- Touch events ensure compatibility with all devices
- Prevents duplicate event handling through feature detection
- Allows graceful degradation on older browsers

### Implementation
```typescript
// Feature detection determines which system to use
const usePointerEvents = supportsPointerEvents && palmRejectionConfig.enabled;
const useTouchEvents = !usePointerEvents;
```

### Consequences
- **Positive**: Universal device compatibility, optimal stylus experience
- **Negative**: Increased complexity in event handling logic
- **Maintenance**: Must test on various devices and browsers

---

## ADR-002: State Management Architecture

### Status
Accepted

### Context
The application needs to handle local whiteboard state, real-time collaboration, and undo/redo functionality across multiple components.

### Decision
Implement a layered state management approach:
1. **Local State**: Individual whiteboard instances
2. **Shared State**: Collaborative whiteboard state with sync
3. **History State**: Undo/redo functionality
4. **Context State**: Global session and user state

### Rationale
- Separation of concerns allows for better testing and maintenance
- Local state ensures responsive drawing even during network issues
- Shared state enables real-time collaboration
- History state provides user-expected undo/redo functionality

### Implementation
```typescript
// Hook composition for different use cases
useWhiteboardState() // Local only
useSharedWhiteboardState() // With collaboration
useSyncWhiteboardState() // Session-based collaboration
```

### Consequences
- **Positive**: Flexible state management, good performance
- **Negative**: Complex hook relationships, potential for state inconsistencies
- **Maintenance**: Requires careful synchronization between state layers

---

## ADR-003: Real-time Synchronization Protocol

### Status
Accepted

### Context
Multiple users need to collaborate on the same whiteboard with minimal latency and conflict resolution.

### Decision
Use operation-based synchronization with Supabase Realtime:
1. Operations are serialized and sent through realtime channels
2. Last-write-wins conflict resolution for simplicity
3. Optimistic updates for local responsiveness

### Rationale
- Operation-based sync is more efficient than full state sync
- Supabase Realtime provides reliable WebSocket infrastructure
- Last-write-wins is simple and sufficient for drawing operations
- Optimistic updates provide immediate feedback

### Implementation
```typescript
// Operations are sent as structured payloads
{
  type: 'draw_line',
  payload: { lineData },
  timestamp: Date.now(),
  userId: 'user-123'
}
```

### Consequences
- **Positive**: Real-time collaboration, good performance
- **Negative**: Potential for operation conflicts, requires careful ordering
- **Maintenance**: Need to handle connection issues and recovery

---

## ADR-004: Canvas Rendering Technology

### Status
Accepted

### Context
The whiteboard needs high-performance rendering for smooth drawing with support for complex shapes, images, and transformations.

### Decision
Use Konva.js with React-Konva wrapper:
- 2D Canvas with hardware acceleration
- Built-in support for shapes, images, and transformations
- Event system for object interaction

### Rationale
- Konva.js provides excellent performance for 2D graphics
- React-Konva integrates well with React component model
- Built-in features reduce custom implementation complexity
- Active community and good documentation

### Implementation
```typescript
// Layer-based rendering architecture
<Stage>
  <Layer name="images">
    {images.map(image => <ImageRenderer key={image.id} />)}
  </Layer>
  <Layer name="lines">
    {lines.map(line => <LineRenderer key={line.id} />)}
  </Layer>
</Stage>
```

### Consequences
- **Positive**: High performance, rich feature set, good React integration
- **Negative**: Additional bundle size, learning curve for Konva concepts
- **Maintenance**: Dependency on external library updates

---

## ADR-005: Authentication and Session Management

### Status
Accepted

### Context
The application needs user authentication, session creation, and student management for classroom scenarios.

### Decision
Use Supabase Auth with custom session management:
1. Email/password authentication through Supabase
2. Custom session management for classroom scenarios
3. URL-based student joining system

### Rationale
- Supabase Auth provides secure, scalable authentication
- Custom session management allows for classroom-specific features
- URL-based joining is simple for students to understand

### Implementation
```typescript
// Session structure
{
  id: 'session-uuid',
  title: 'Math Class',
  teacher_id: 'teacher-uuid',
  students: ['alice', 'bob', 'charlie'],
  url: 'app.com/join/session-uuid',
  status: 'active'
}
```

### Consequences
- **Positive**: Secure authentication, flexible session management
- **Negative**: Custom session logic complexity, URL management
- **Maintenance**: Need to handle session lifecycle and cleanup

---

## ADR-006: Palm Rejection Implementation

### Status
Accepted

### Context
Users with touch devices and styluses need palm rejection to prevent accidental touches while drawing.

### Decision
Implement heuristic-based palm rejection using pointer event properties:
1. Contact size detection (large contacts = palm)
2. Pressure detection (low pressure = palm)
3. Timing-based rejection (rapid successive touches)

### Rationale
- Pointer events provide contact size and pressure data
- Heuristic approach works across different devices
- No need for machine learning or complex algorithms
- Can be tuned for different use cases

### Implementation
```typescript
const isPalmTouch = (event: PointerEvent) => {
  return event.width > maxContactSize || 
         event.pressure < minPressure ||
         isRapidSuccessiveTouch(event);
};
```

### Consequences
- **Positive**: Improved drawing experience, works on most devices
- **Negative**: May have false positives/negatives, device-dependent
- **Maintenance**: May need tuning for different devices and use cases

---

## ADR-007: TypeScript Integration Strategy

### Status
Accepted

### Context
The application needs strong typing for maintainability, but must balance type safety with development speed.

### Decision
Use strict TypeScript with comprehensive type definitions:
1. Strict mode enabled for all files
2. Complete type coverage for all APIs
3. Generic types for reusable components
4. Utility types for complex transformations

### Rationale
- Strict TypeScript catches errors at compile time
- Complete type coverage improves IDE experience
- Generic types provide reusability without sacrificing safety
- Better refactoring support and documentation

### Implementation
```typescript
// Comprehensive type definitions
interface WhiteboardState {
  lines: LineObject[];
  images: ImageObject[];
  currentTool: Tool;
  // ... all properties typed
}

// Generic hooks for reusability
function useStateManager<T>(initialState: T): StateManager<T>
```

### Consequences
- **Positive**: Better code quality, improved developer experience
- **Negative**: Additional upfront development time, learning curve
- **Maintenance**: Type definitions must be kept in sync with implementation

---

## ADR-008: Sender ID Filtering and Immutable Sync Configuration

### Status
Accepted - CRITICAL ARCHITECTURE

### Context
Multiple components (Teacher1, Student1) need to share the same Supabase realtime channel while maintaining separate operation filtering to prevent echo-back loops. Previous attempts to share or update sync configurations have caused production outages due to sender ID conflicts.

### Decision
Implement immutable sync configuration with sender-specific connection pooling:
1. **Immutable Configuration**: Each connection stores its original config that NEVER changes
2. **Sender-Specific Connection IDs**: Include sender ID in connection identifier for isolation
3. **Operation Filtering**: Use original sender ID for filtering, never updated sender ID
4. **No Config Updates**: Remove all `updateConfig` functionality to prevent overwrites

### Rationale
- Multiple components must coexist on the same channel without interfering
- Operation echo-back causes infinite loops and corrupted state
- Config overwrites break the filtering logic by changing sender IDs mid-connection
- Immutable configuration ensures predictable filtering behavior

### Implementation
```typescript
// Connection creation with immutable config
class Connection {
  private readonly originalConfig: SyncConfig; // Immutable
  
  constructor(config: SyncConfig, handler: OperationHandler) {
    this.originalConfig = { ...config }; // Store immutable copy
    this.connectionId = `${config.whiteboardId}-${config.sessionId}-${config.senderId}`;
  }
  
  private handlePayload(payload: any) {
    const operation = PayloadConverter.toOperation(payload);
    // Use ORIGINAL config for filtering
    if (operation.sender_id !== this.originalConfig.senderId) {
      this.handlers.forEach(handler => handler(operation));
    }
  }
}

// Connection manager prevents config overwrites
class SyncConnectionManager {
  registerHandler(config: SyncConfig, handler: OperationHandler) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.addHandler(handler);
      // DO NOT update config - keep original immutable config
    }
  }
}
```

### Consequences
- **Positive**: Reliable multi-component sync, predictable operation filtering
- **Negative**: More complex connection management, requires careful understanding
- **Critical**: Breaking this pattern causes production outages and infinite loops

### Maintenance Rules
- **NEVER** add `updateConfig` functionality to Connection class
- **NEVER** modify `originalConfig` after construction
- **ALWAYS** use `originalConfig.senderId` for operation filtering
- **ALWAYS** include sender ID in connection identifier
- **TEST** with multiple components (Teacher1 + Student1) before deployment

---

## ADR-009: Connection Pooling with Sender Identity Isolation

### Status
Accepted - CRITICAL ARCHITECTURE

### Context
The application needs efficient connection management while ensuring different components with different sender IDs can safely share Supabase channels without operation conflicts.

### Decision
Implement sender-aware connection pooling with identity isolation:
1. **Sender-Specific Connection IDs**: Include sender ID in connection pooling key
2. **Handler Registration**: Multiple handlers per connection, but each connection maintains original sender ID
3. **Grace Period Cleanup**: 30-second delay before closing unused connections
4. **Connection Reuse**: Reuse connections only for same sender ID combinations

### Rationale
- Efficient resource usage by sharing connections when possible
- Prevents cross-contamination between different sender contexts
- Graceful handling of component remounts and reconnections
- Clear separation of concerns between connection management and operation filtering

### Implementation
```typescript
// Sender-aware connection pooling
class SyncConnectionManager {
  // Connection ID includes sender ID for isolation
  private generateConnectionId(config: SyncConfig): string {
    return `${config.whiteboardId}-${config.sessionId}-${config.senderId}`;
  }
  
  registerHandler(config: SyncConfig, handler: OperationHandler) {
    const connectionId = this.generateConnectionId(config);
    let connection = this.connections.get(connectionId);
    
    if (!connection) {
      // Create new connection with immutable config
      connection = new Connection(config, handler);
      this.connections.set(connectionId, connection);
    } else {
      // Reuse existing connection, add handler
      connection.addHandler(handler);
      // CRITICAL: Do NOT update config
    }
  }
}
```

### Consequences
- **Positive**: Efficient connection usage, clear sender isolation
- **Negative**: More complex lifecycle management
- **Critical**: Sender ID must remain in connection key for proper isolation

---

## ADR-010: Operation Filtering Logic for Shared Whiteboards

### Status
Accepted - CRITICAL ARCHITECTURE

### Context
When multiple components subscribe to the same whiteboard channel, operations must be filtered to prevent components from processing their own operations (echo-back), while still receiving operations from other components.

### Decision
Implement sender-based operation filtering with debug logging:
1. **Sender ID Comparison**: Filter operations where sender_id matches connection's original sender ID
2. **Debug Logging**: Extensive logging to track filtering decisions
3. **Operation Flow**: Clear separation between sending and receiving operations
4. **Error Prevention**: Robust error handling for malformed operations

### Rationale
- Prevents infinite loops from operation echo-back
- Enables debugging of filtering logic
- Maintains clear separation between local and remote operations
- Provides visibility into sync behavior for troubleshooting

### Implementation
```typescript
// Operation filtering with debug logging
private handlePayload(payload: any) {
  const operation = PayloadConverter.toOperation(payload);
  
  // Update activity timestamp
  this.info.lastActivity = Date.now();
  
  // Notify all registered handlers except the sender
  this.info.handlers.forEach(handler => {
    if (operation.sender_id !== this.originalConfig.senderId) {
      debugLog('Dispatch', `Operation to handler from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`);
      handler(operation);
    } else {
      debugLog('Dispatch', `Skipping operation from self (${operation.sender_id})`);
    }
  });
}
```

### Consequences
- **Positive**: Reliable operation filtering, excellent debugging capabilities
- **Negative**: Requires consistent sender ID management
- **Critical**: Filtering logic depends on immutable sender ID configuration

### Debug Patterns
```typescript
// Enable sync debugging
debugLog('Connection', `Created connection ${connectionId} with senderId: ${config.senderId}`);
debugLog('Payload', 'Received operation', payload);
debugLog('Dispatch', `Operation from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`);
```
