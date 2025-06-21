
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

2. **Collaborative Operations** (real-time sync)
   - Local operation → Activity metadata → Sync coordinator → Supabase realtime → Remote clients
   - Remote operation → Operation handler → State merge → UI update

3. **History Management** (undo/redo)
   - State changes → Activity metadata → History stack → Undo/redo operations → State restoration
   - Activity persistence across history navigation

4. **Eye Button Integration** (activity tracking)
   - User activity → Bounds calculation → Activity metadata → History integration → Button state update
   - Button click → Activity retrieval → Viewport centering

## Sync Operation Flow (CRITICAL ARCHITECTURE)

### 🚨 Sender ID Filtering and Connection Management

The sync system uses a **sender-specific connection pooling** strategy that requires extreme care when modifying:

#### Connection Creation and Lifecycle
```
Component Mount:
syncConfig = { whiteboardId: 'board-123', sessionId: 'session-456', senderId: 'teacher1' }
    ↓
SyncConnectionManager.registerHandler(syncConfig, handler)
    ↓
connectionId = `board-123-session-456-teacher1` (includes sender ID)
    ↓
Check if connection exists:
- If NO: Create new Connection with IMMUTABLE config
- If YES: Add handler to existing connection, KEEP original config
    ↓
Connection stores originalConfig = { ...syncConfig } (NEVER modified)
```

#### Operation Sending Flow
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
Database triggers realtime notification to ALL subscribers
```

#### Operation Receiving Flow
```
Supabase Realtime Event:
Database insert triggers realtime → ALL connections on same whiteboard receive payload
    ↓
Connection.handlePayload(payload):
- Convert payload to WhiteboardOperation
- Extract sender_id from operation
    ↓
Filter Logic (CRITICAL):
if (operation.sender_id !== this.originalConfig.senderId) {
  // Forward to handlers (not from self)
  handlers.forEach(handler => handler(operation))
} else {
  // Skip - this is our own operation
  debugLog('Skipping operation from self')
}
```

#### Multi-Component Scenario (Teacher1 + Student1)
```
Teacher1 Component:
- connectionId: 'board-123-session-456-teacher1'
- originalConfig.senderId: 'teacher1'
- Receives operations from: student1 ✓, teacher1 ✗ (filtered out)

Student1 Component:
- connectionId: 'board-123-session-456-student1'  
- originalConfig.senderId: 'student1'
- Receives operations from: teacher1 ✓, student1 ✗ (filtered out)

Both share same Supabase channel but maintain separate sender identity!
```

### Connection Pooling and Handler Management
```
First Handler Registration:
registerHandler(config, handler1) → Create new connection → Store immutable config

Second Handler Registration (same sender):
registerHandler(config, handler2) → Reuse connection → Add handler2 → Keep original config

Component Unmount:
unregisterHandler(config, handler) → Remove handler → Start 30s grace period → Cleanup if unused
```

### Debug Logging for Sync Issues
```typescript
// Enable sync debugging
const debugLog = createDebugLogger('sync');

// Connection creation
debugLog('Connection', `Created connection ${connectionId} with senderId: ${config.senderId}`);

// Operation filtering
debugLog('Dispatch', `Operation from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`);
debugLog('Dispatch', `Skipping operation from self (${operation.sender_id})`);

// Config protection
debugLog('Manager', `Keeping original config for ${connectionId} to prevent sender ID conflicts`);
```

## Collaborative Undo/Redo Flow (Phase 2 Implementation)

### Synchronized Undo/Redo Operations
```
Teacher Action:
User clicks undo/redo → History operation → Send undo/redo operation → Supabase realtime
    ↓
Student Sync:
Receive undo/redo operation → Apply to local history → State update → UI refresh
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

## Sync Operation Flow

### Local to Remote
1. User performs operation (draw, erase, undo, redo, etc.)
2. Activity metadata generated and stored locally (if applicable)
3. Operation serialized to sync payload
4. Sent via Supabase realtime channel
5. Other clients receive and apply operation
6. Activity metadata synchronized for eye button

### Remote to Local
1. Receive operation from Supabase realtime
2. Deserialize operation payload
3. Apply to local state (bypassing local handlers)
4. Update UI to reflect changes
5. Activity metadata integrated into local history

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

## Critical State Considerations

- **Race Conditions**: Operations are timestamped and ordered
- **Conflict Resolution**: Last-write-wins for simplicity
- **State Consistency**: All clients eventually converge to same state
- **Performance**: Only send incremental changes, not full state
- **Activity Persistence**: Activity metadata preserved across sessions
- **Memory Management**: Activity timeout to prevent unbounded growth
- **Cross-Window Sync**: Activity state maintained across minimize/maximize
- **History Replay**: Pure simulation ensures accurate state reconstruction
- **Undo/Redo Sync**: Teacher1-Student1 synchronized undo/redo operations
- **🚨 Sender ID Immutability**: Connection configs NEVER change after creation
- **🚨 Operation Filtering**: Critical for preventing infinite loops and echo-back
- **🚨 Connection Isolation**: Different sender IDs must maintain separate connections

## Debugging Sync Issues

### Common Symptoms and Causes
1. **Infinite Loops**: Usually caused by operation echo-back (check sender ID filtering)
2. **Missing Operations**: Check if sender IDs are being overwritten
3. **Cross-Component Interference**: Verify connection isolation by sender ID
4. **Config Overwrites**: Look for unauthorized `updateConfig` calls

### Debug Checklist
```typescript
// Check connection creation
debugLog('Connection', `Created connection ${connectionId} with senderId: ${config.senderId}`);

// Verify filtering logic
debugLog('Dispatch', `Operation from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`);

// Confirm config immutability
debugLog('Manager', `Keeping original config for ${connectionId} to prevent sender ID conflicts`);

// Monitor connection reuse
debugLog('Manager', `Reusing existing connection for ${connectionId}`);
```
