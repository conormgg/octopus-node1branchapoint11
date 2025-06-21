
# State Management and Data Flow

## Whiteboard State Structure

### Core State Objects
```typescript
WhiteboardState {
  lines: LineObject[]        // All drawn strokes
  images: ImageObject[]      // All placed images
  currentTool: Tool          // Active drawing tool
  panZoomState: PanZoomState // Canvas position/scale
  selectionState?: SelectionState // Current selection
  history: HistorySnapshot[] // Undo/redo stack with activity metadata
  historyIndex: number       // Current position in history
}

HistorySnapshot {
  lines: LineObject[]
  images: ImageObject[]
  selectionState: SelectionState
  lastActivity?: ActivityMetadata // Eye button activity tracking
}

ActivityMetadata {
  type: 'draw' | 'erase' | 'move' | 'paste'
  bounds: { x: number; y: number; width: number; height: number }
  timestamp: number
}
```

### State Management Flow

1. **Local Operations** (drawing, selecting)
   - User interaction → Event handler → Tool operation → State update → Activity tracking
   - Immediate UI feedback for responsiveness

2. **Collaborative Operations** (real-time sync with centralized channels)
   - Local operation → Activity metadata → Sync coordinator → Supabase realtime → Centralized dispatch → Remote clients
   - Remote operation → Centralized payload handler → Individual connection filtering → State merge → UI update

3. **History Management** (undo/redo)
   - State changes → Activity metadata → History stack → Undo/redo operations → State restoration
   - Activity persistence across history navigation

4. **Eye Button Integration** (activity tracking)
   - User activity → Bounds calculation → Activity metadata → History integration → Button state update
   - Button click → Activity retrieval → Viewport centering

## Sync Operation Flow (CRITICAL ARCHITECTURE - UPDATED)

### 🚨 Centralized Channel Management and Sender ID Filtering

The sync system now uses **centralized channel management with shared channels** that requires extreme care when modifying:

#### Channel Creation and Lifecycle (NEW)
```
SyncConnectionManager (Singleton):
Manages channels centrally - one channel per whiteboard shared by all connections

First Connection for Whiteboard:
syncConfig = { whiteboardId: 'board-123', sessionId: 'session-456', senderId: 'teacher1' }
    ↓
SyncConnectionManager.registerHandler(syncConfig, handler)
    ↓
channelName = `whiteboard-board-123`
    ↓
Create new Supabase channel + Subscribe to postgres_changes + Store in channels map
    ↓
Create Connection with shared channel: new Connection(config, handler, channel)
    ↓
Connection stores originalConfig = { ...syncConfig } (NEVER modified)

Second Connection for Same Whiteboard:
syncConfig = { whiteboardId: 'board-123', sessionId: 'session-456', senderId: 'student1' }
    ↓
SyncConnectionManager.registerHandler(syncConfig, handler)
    ↓
channelName = `whiteboard-board-123` (SAME as first)
    ↓
Reuse existing channel from channels map
    ↓
Create NEW Connection with SAME shared channel: new Connection(config, handler, channel)
    ↓
Connection stores DIFFERENT originalConfig = { ...syncConfig } (senderId: 'student1')
```

#### Operation Sending Flow (UPDATED)
```
Local User Action (Teacher1):
User draws line → Tool handler → sendOperation({ type: 'draw', data: lineData })
    ↓
Connection.sendOperation():
- Add sender_id from originalConfig.senderId ('teacher1')
- Add timestamp and whiteboard_id
- Convert to database format
    ↓
Supabase.insert(database_record)
    ↓
Database triggers realtime notification to shared channel: whiteboard-board-123
```

#### Centralized Operation Receiving Flow (NEW)
```
Supabase Realtime Event:
Database insert triggers realtime → Shared channel whiteboard-board-123 receives payload
    ↓
SyncConnectionManager.handleChannelPayload(payload, whiteboardId):
- Convert payload to WhiteboardOperation
- Dispatch to ALL connections for this whiteboard
    ↓
Centralized Dispatch Loop:
connections.forEach((connection, connectionId) => {
  if (connectionId.startsWith('board-123')) {
    connection.handlePayload(payload); // SAME payload to ALL connections
  }
});
    ↓
Individual Connection Filtering (Teacher1):
Connection.handlePayload(payload):
- Extract sender_id from operation
- Filter Logic: if (operation.sender_id !== 'teacher1') { handler(operation) }
- Result: Receives operations from student1 ✓, blocks teacher1 ✗
    ↓
Individual Connection Filtering (Student1):
Connection.handlePayload(payload):
- Extract sender_id from operation  
- Filter Logic: if (operation.sender_id !== 'student1') { handler(operation) }
- Result: Receives operations from teacher1 ✓, blocks student1 ✗
```

#### Multi-Component Scenario with Shared Channel (UPDATED)
```
Shared Channel Architecture:
Channel: whiteboard-board-123 (managed by SyncConnectionManager)
├── Teacher1 Connection: 'board-123-session-456-teacher1'
│   ├── originalConfig.senderId: 'teacher1' (IMMUTABLE)
│   ├── Receives from: student1 ✓, teacher1 ✗ (filtered)
│   └── Uses shared channel for sending/receiving
├── Student1 Connection: 'board-123-session-456-student1'
│   ├── originalConfig.senderId: 'student1' (IMMUTABLE)  
│   ├── Receives from: teacher1 ✓, student1 ✗ (filtered)
│   └── Uses SAME shared channel for sending/receiving
└── Centralized Dispatch: ALL connections get SAME payload, filter individually
```

### Connection Pooling and Handler Management (UPDATED)
```
First Handler Registration (Teacher1):
registerHandler(teacherConfig, teacherHandler) → Create channel + connection → Store immutable config

First Handler Registration (Student1, same whiteboard):
registerHandler(studentConfig, studentHandler) → Reuse channel + create new connection → Store different immutable config

Additional Handler (Teacher1, same config):
registerHandler(teacherConfig, newHandler) → Reuse connection → Add handler → Keep original config

Component Unmount:
unregisterHandler(config, handler) → Remove handler → Start 30s grace period → Cleanup connection + channel if unused
```

### Debug Logging for Centralized Sync Issues (UPDATED)
```typescript
// Enable sync debugging
const debugLog = createDebugLogger('sync');

// Centralized channel creation
debugLog('Manager', `Creating and subscribing to new Supabase channel: ${channelName}`);
debugLog('Manager', `Channel ${channelName} subscription status: ${status}`);

// Centralized payload dispatch
debugLog('Manager', 'Received payload from channel:', payload);
debugLog('Manager', `Dispatching to connections for whiteboard: ${whiteboardId}`);

// Individual connection filtering  
debugLog('Connection', `Created connection ${connectionId} with senderId: ${config.senderId}`);
debugLog('Dispatch', `Operation from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`);
debugLog('Dispatch', `Skipping operation from self (${operation.sender_id})`);

// Config protection
debugLog('Manager', `Keeping original config for ${connectionId} to prevent sender ID conflicts`);
```

## Collaborative Undo/Redo Flow (Phase 2 Implementation)

### Synchronized Undo/Redo Operations
```
Teacher Action:
User clicks undo/redo → History operation → Send undo/redo operation → Supabase realtime → Centralized dispatch
    ↓
Student Sync:
Receive undo/redo operation via shared channel → Individual filtering → Apply to local history → State update → UI refresh
```

### History Replay System
```
Component Mount/Remount:
Fetch operations from database → Pure history replay → State reconstruction
    ↓
Replay Process:
Initialize empty state + history stack → Process each operation sequentially
    ↓
Operation Processing:
- Draw/Erase: Apply to state → Create history snapshot → Add to stack
- Undo: Move back in history stack → Restore previous state
- Redo: Move forward in history stack → Restore next state
    ↓
Final Result:
Correct final state + Complete history stack + Accurate history index
```

### Cross-View Consistency
```
Minimized View Operations:
User draws/erases → Operations stored in database → History maintained
    ↓
Maximize View:
History replay → All operations reconstructed → Consistent state across views
    ↓
Browser Refresh:
Persistence load → History replay → Session continuity maintained
```

## Event Handling Flow

### Input Priority System
1. **Palm Rejection** (if enabled and supported)
   - Pointer events with stylus detection
   - Rejects large contact areas and low pressure

2. **Touch Events** (fallback)
   - Standard touch handling for mobile devices
   - Multi-touch gesture support

3. **Mouse Events** (desktop)
   - Standard mouse interactions
   - Right-click context menus

### Tool-Specific Flows

#### Drawing Tools (Pencil/Highlighter)
```
pointerdown → startDrawing → create new line
pointermove → continueDrawing → update line points
pointerup → stopDrawing → finalize line + calculate bounds + create activity + history
```

#### Eraser Tool
```
pointerdown → startErasing → find intersecting lines
pointermove → continueErasing → remove intersected lines
pointerup → stopErasing → calculate erased bounds + create activity + finalize erasure + history
```

#### Select Tool
```
pointerdown → check for objects → select/start drag selection
pointermove → update selection bounds → highlight objects
pointerup → finalize selection → enable transformations
transform → calculate new bounds → create move activity + history
```

#### Image Operations
```
paste → calculate image bounds → create paste activity + history
move/resize → calculate new bounds → create move activity + history
```

## Sync Operation Flow (UPDATED)

### Local to Remote (with Centralized Channels)
1. User performs operation (draw, erase, undo, redo, etc.)
2. Activity metadata generated and stored locally (if applicable)
3. Operation serialized to sync payload
4. Sent via shared Supabase channel (managed by SyncConnectionManager)
5. Centralized dispatch to all connections for the whiteboard
6. Individual filtering by each connection
7. Remote state updates and activity metadata synchronization

### Remote to Local (with Centralized Dispatch)
1. Receive operation from shared Supabase channel
2. Centralized dispatch to all relevant connections
3. Individual connection filtering (sender ID comparison)
4. Deserialize operation payload (if not filtered out)
5. Apply to local state (bypassing local handlers)
6. Update UI to reflect changes
7. Activity metadata integrated into local history

## Eye Button State Flow

### Activity Tracking
```
User Action → Tool Operation → Bounds Calculation → ActivityMetadata Creation
    ↓
History Integration (addToHistory with activity) → Eye Button State Update
    ↓
Button Enable/Disable → Visual Feedback to User
```

### Activity Retrieval and Centering
```
Button Click → getLastActivity() → History Search → Activity Retrieval
    ↓
Bounds Validation → Pan/Zoom centerOnBounds() → Viewport Animation
    ↓
View Centered on Last Activity
```

### Persistence Flow
```
Activity Creation → History Snapshot → Database Storage (via operations)
    ↓
Page Refresh → Database Load → Activity Reconstruction → Button State Restore
```

## Critical State Considerations (UPDATED)

- **Race Conditions**: Operations are timestamped and ordered
- **Conflict Resolution**: Last-write-wins for simplicity
- **State Consistency**: All clients eventually converge to same state via shared channels
- **Performance**: Only send incremental changes, not full state
- **Activity Persistence**: Activity metadata preserved across sessions
- **Memory Management**: Activity timeout to prevent unbounded growth
- **Cross-Window Sync**: Activity state maintained across minimize/maximize
- **History Replay**: Pure simulation ensures accurate state reconstruction
- **Undo/Redo Sync**: Teacher1-Student1 synchronized undo/redo operations via shared channels
- **🚨 Channel Sharing**: Multiple connections per whiteboard share one Supabase channel
- **🚨 Centralized Dispatch**: All connections for a whiteboard receive the same payload
- **🚨 Individual Filtering**: Each connection filters based on its own immutable sender ID
- **🚨 Sender ID Immutability**: Connection configs NEVER change after creation
- **🚨 Operation Filtering**: Critical for preventing infinite loops with shared channels
- **🚨 Connection Isolation**: Different sender IDs maintain separate filtering despite shared channels

## Debugging Sync Issues (UPDATED)

### Common Symptoms and Causes (Updated for Centralized Architecture)
1. **Infinite Loops**: Usually caused by operation echo-back (check sender ID filtering with shared channels)
2. **Missing Operations**: Check if centralized dispatch is working correctly
3. **Cross-Component Interference**: Verify connection isolation by sender ID despite shared channels
4. **Config Overwrites**: Look for unauthorized `updateConfig` calls
5. **Channel Management Issues**: Check if channels are being created/cleaned up properly
6. **Dispatch Failures**: Verify centralized payload dispatch to all connections

### Debug Checklist (Updated)
```typescript
// Check centralized channel creation
debugLog('Manager', `Creating and subscribing to new Supabase channel: ${channelName}`);

// Verify channel subscription status
debugLog('Manager', `Channel ${channelName} subscription status: ${status}`);

// Monitor centralized dispatch
debugLog('Manager', 'Received payload from channel:', payload);
debugLog('Manager', `Dispatching to connections for whiteboard: ${whiteboardId}`);

// Check individual connection filtering
debugLog('Connection', `Created connection ${connectionId} with senderId: ${config.senderId}`);
debugLog('Dispatch', `Operation from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`);

// Confirm config immutability
debugLog('Manager', `Keeping original config for ${connectionId} to prevent sender ID conflicts`);

// Monitor connection reuse with shared channels
debugLog('Manager', `Reusing existing connection for ${connectionId}`);
debugLog('Manager', `Reusing existing channel: ${channelName}`);
```

## Real-time Connection Issues (UPDATED)

### Centralized Architecture Benefits
The new centralized channel management helps resolve cross-browser/cross-context real-time issues:

**Improved Reliability:**
- **Consistent Channel Creation**: All browser contexts use the same channel creation logic
- **Centralized Error Handling**: WebSocket errors handled in one place
- **Better Resource Management**: One channel per whiteboard instead of one per connection
- **Unified Debugging**: All payload dispatch happens centrally

**Cross-Context Compatibility:**
- **iPad Safari**: Improved WebSocket handling with centralized management
- **Incognito Mode**: Consistent channel behavior across contexts
- **Brave Browser**: Better compatibility with ad-blockers
- **Background Tabs**: Reduced impact of tab throttling

### Debug Steps for Real-time Issues (Updated)
```typescript
// 1. Check centralized channel creation and subscription
const channel = this.channels.get(channelName);
console.log('Channel state:', channel?.state); // Should be 'joined'
debugLog('Manager', `Channel ${channelName} subscription status: ${status}`);

// 2. Verify centralized payload dispatch
debugLog('Manager', 'Received payload from channel:', payload);
debugLog('Manager', `Dispatching to connections for whiteboard: ${whiteboardId}`);

// 3. Check individual connection filtering after dispatch
debugLog('Dispatch', `Operation from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`);

// 4. Monitor connection and channel lifecycle
debugLog('Manager', `Active connections for whiteboard ${whiteboardId}:`, 
  Array.from(this.connections.keys()).filter(id => id.startsWith(whiteboardId)));
```
