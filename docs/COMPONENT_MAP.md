
# Component Hierarchy Map

## Application Structure

```
App
├── AuthPage (if not authenticated)
│   └── AuthForm
└── Main Application (if authenticated)
    ├── TeacherDashboard (for teachers)
    │   ├── CreateSessionForm
    │   └── TeacherSessionView
    │       ├── TeacherSessionViewHeader
    │       │   └── TeacherHeader (with Session Options dropdown)
    │       └── TeacherSessionMainContent
    │           ├── TeacherSessionSplitView (split view mode)
    │           │   ├── StudentBoardsWindow (portal-based window)
    │           │   └── TeacherMainBoard
    │           └── TeacherSessionResizablePanels (normal mode)
    │               ├── TeacherMainBoard  
    │               └── StudentBoardsGrid
    └── StudentView (for students)
        └── StudentSessionView
```

## Session Management Structure

```
TeacherSessionView
├── Session Student Management (useSessionStudents hook)
│   ├── Individual Student Addition (via Session Options)
│   ├── Individual Student Removal (via Session Options)
│   └── Real-time Participant Updates
├── Split View Window System
│   ├── StudentBoardsWindow (portal-based)
│   │   ├── WindowContentRenderer
│   │   │   ├── WindowContentHeader
│   │   │   │   └── StudentBoardsWindowHeader (layout controls only)
│   │   │   └── WindowContentBody
│   │   │       └── StudentBoardsGrid
│   │   └── Window State Management (useWindowContentState)
│   └── Teacher Main Board (remains in main window)
└── Normal Resizable Panels Mode
    ├── TeacherMainBoard
    └── StudentBoardsGrid
```

## Canvas Component Structure

```
KonvaStage (Main canvas container)
├── KonvaStageCanvas (Konva Stage wrapper)
│   ├── ImagesLayer
│   │   └── ImageRenderer (for each image)
│   └── LinesLayer
│       ├── LineRenderer (for each line/stroke)
│       ├── SelectionRect (drag selection)
│       └── SelectionGroup (group transformations)
└── Event Handlers (attached to container)
    ├── Pointer Events (palm rejection enabled)
    ├── Touch Events (fallback)
    └── Mouse Events (desktop)
```

## Whiteboard Component Structure

```
WhiteboardPlaceholder
├── MinimizedWhiteboardView
│   ├── TopRightButtons (with Eye Button)
│   ├── SessionStatus
│   └── WhiteboardContent
└── MaximizedWhiteboardView (Portal)
    ├── TopRightButtons (with Eye Button)
    ├── SessionStatus
    └── WhiteboardContent

WhiteboardContent
├── SyncWhiteboard (collaborative)
│   ├── WhiteboardCanvas
│   └── MovableToolbar
└── Whiteboard (standalone)
```

## Session Options Integration

```
TeacherHeader
├── Session Options Dropdown
│   ├── Session URL Management
│   │   ├── Copy URL
│   │   └── Open in New Window
│   ├── Individual Student Management
│   │   ├── Add Student Dialog
│   │   └── Remove Student Dialog
│   ├── Session Controls
│   │   ├── End Session
│   │   └── Sign Out
│   └── Session Information Display
└── Layout & View Controls
    ├── Layout Selector
    ├── Grid Orientation Toggle
    └── Split View Toggle
```

## Eye Button Integration

```
TopRightButtons
├── MaximizeButton
└── EyeButton (conditional)
    ├── useEyeButtonLogic
    ├── Activity State Management
    └── Viewport Centering
```

## Hook Dependencies and Selection Guide

### 🚨 CRITICAL: Current Sync Hook Usage

**PRIMARY HOOKS (Use These):**
```
useSharedWhiteboardState ✅ RECOMMENDED
├── useSharedOperationsCoordinator
│   ├── useSharedDrawingOperations (with activity tracking)
│   ├── useSharedImageOperations (with activity tracking)
│   ├── useHistoryState (with sync support and sendOperation)
│   └── useSyncState (if collaboration enabled)
├── useSelectionState
├── usePanZoom (with centerOnBounds for eye button)
└── useStageEventHandlers
    ├── usePointerEventHandlers
    ├── useTouchEventHandlers
    └── useWheelEventHandlers
```

**DEPRECATED HOOKS (Avoid These):**
```
useSyncWhiteboardState ❌ DEPRECATED
├── Direct state manipulation
├── Manual sync management
└── Limited collaboration features
⚠️ Only use for specific sync-only scenarios
```

### Hook Selection Criteria

**Use `useSharedWhiteboardState` when:**
- Building collaborative whiteboards (most common)
- Need full feature set (drawing, images, selection, etc.)
- Want automatic sync integration
- Building teacher/student views
- Need eye button functionality

**Use `useSyncWhiteboardState` only when:**
- Building sync-only components
- Need manual state control
- Working with receive-only scenarios
- Legacy compatibility required

### Other Session Management Hooks

```
useSessionStudents (Simplified)
├── Real-time Participant Subscription
├── Individual Student Addition
├── Individual Student Removal
└── Student Status Tracking (active/pending)

useSharedPersistenceIntegration
├── useWhiteboardPersistence (database operations)
├── useSharedHistoryReplay (pure simulation)
└── useWhiteboardStateContext (shared state updates)

useEyeButtonLogic
├── Activity Configuration
├── Button State Management
├── Center Callback Handling
└── Last Activity Updates
```

## Window System Architecture

```
Split View Mode:
├── Main Browser Window
│   ├── TeacherHeader (with all controls)
│   └── Teacher's Whiteboard Only
└── Portal-based Student Window
    ├── WindowContentHeader (layout controls only)
    └── Student Boards Grid

Normal Mode:
└── Resizable Panels
    ├── Teacher's Whiteboard (left panel)
    └── Student Boards Grid (right panel)
```

## State Flow

```
User Input
    ↓
Event Handlers (pointer/touch/mouse)
    ↓
Tool-specific Operations (draw/erase/select/undo/redo)
    ↓
Activity Metadata Generation (for eye button)
    ↓
Whiteboard State Updates
    ↓
Canvas Re-rendering + History Updates (with activity)
    ↓
Sync Operations (if collaborative)
    ↓
Performance Monitoring (automatic via wrappers)
```

## Student Management Flow

```
Teacher Action (Add/Remove Student)
    ↓
Session Options Dropdown
    ↓
Individual Student Dialog
    ↓
Database Operation (session_participants table)
    ↓
Real-time Update (Supabase subscription)
    ↓
UI State Refresh (all connected components)
    ↓
Layout Recalculation (based on new student count)
```

## Eye Button State Flow

```
User Activity (draw/erase/move/paste)
    ↓
Activity Bounds Calculation
    ↓
Activity Metadata Creation
    ↓
History Integration (addToHistory with activity)
    ↓
Eye Button State Update
    ↓
UI Button Enable/Disable
    ↓
User Click → Viewport Centering
```

## Sync Architecture Integration Points (UPDATED)

### 🚨 CRITICAL: Centralized Channel Management

**Channel Creation Pattern (NEW):**
```
SyncConnectionManager (Singleton):
- Creates one Supabase channel per whiteboard
- All connections for same whiteboard share this channel
- Centralized payload dispatch to relevant connections
- Channel cleanup when no connections remain

Channel Lifecycle:
First Connection → Create Channel → Subscribe → Store in channels map
Additional Connections → Reuse Existing Channel → Add Connection
Last Connection Gone → Grace Period → Cleanup Channel
```

**Connection Creation Pattern (UPDATED):**
```
Component A (Teacher1):
- connectionId: 'board-123-session-456-teacher1'
- originalConfig.senderId: 'teacher1' (IMMUTABLE)
- Uses shared channel: whiteboard-board-123
- Receives operations from: student1 ✓, teacher1 ✗ (filtered)

Component B (Student1):
- connectionId: 'board-123-session-456-student1'
- originalConfig.senderId: 'student1' (IMMUTABLE)
- Uses SAME shared channel: whiteboard-board-123
- Receives operations from: teacher1 ✓, student1 ✗ (filtered)
```

**Handler Registration Flow (UPDATED):**
```
First Registration → Create Connection + Channel → Store Immutable Config
Second Registration (same whiteboard) → Reuse Channel → Create New Connection → Separate Config
Component Unmount → Remove Handler → Grace Period → Cleanup Connection + Channel if unused
```

### Operation Filtering Integration (UPDATED)

**Multi-Component Scenario with Shared Channel:**
```
Shared Channel: whiteboard-board-123
    ↓
Centralized Dispatch: SyncConnectionManager.handleChannelPayload()
    ↓
Teacher Connection:
useSharedWhiteboardState(syncConfig: { senderId: 'teacher1' })
    ↓
Connection.handlePayload() → Filter: operation.sender_id !== 'teacher1'
    ↓
Receives from student1 ✓, blocks teacher1 ✗

Student Connection:
useSharedWhiteboardState(syncConfig: { senderId: 'student1' })
    ↓
Connection.handlePayload() → Filter: operation.sender_id !== 'student1'
    ↓
Receives from teacher1 ✓, blocks student1 ✗
```

### Debug Integration Points (UPDATED)

**Centralized Sync Debug Logging:**
```
SyncConnectionManager:
debugLog('Manager', `Creating and subscribing to new Supabase channel: ${channelName}`)
debugLog('Manager', 'Received payload from channel:', payload)
debugLog('Manager', `Dispatching to connections for whiteboard: ${whiteboardId}`)

Connection:
debugLog('Connection', `Created connection ${connectionId} with senderId: ${config.senderId}`)
debugLog('Dispatch', `Operation from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`)
debugLog('Dispatch', `Skipping operation from self (${operation.sender_id})`)
```

## Migration Guide

### From useSyncWhiteboardState to useSharedWhiteboardState

**Before (Deprecated):**
```typescript
const { state, sendOperation } = useSyncWhiteboardState(syncConfig);
```

**After (Recommended):**
```typescript
const whiteboard = useSharedWhiteboardState(syncConfig, whiteboardId);
const { state, handlePointerDown, handlePointerMove } = whiteboard;
```

**Key Differences:**
- `useSharedWhiteboardState` includes full drawing operations
- Automatic sync integration with centralized channel management
- Built-in activity tracking for eye button
- Better performance with normalized state
- Comprehensive event handling

### When to Use Each Hook

| Scenario | Hook | Reason |
|----------|------|--------|
| Teacher whiteboard | `useSharedWhiteboardState` | Full features + collaboration |
| Student whiteboard | `useSharedWhiteboardState` | Full features + collaboration |
| Sync-only component | `useSyncWhiteboardState` | Minimal sync functionality |
| Local-only whiteboard | `useWhiteboardState` | No sync needed |
| History replay | `useSharedHistoryReplay` | Pure simulation |

## Real-time Connection Troubleshooting (NEW)

### Centralized Architecture Benefits
The new centralized channel management helps resolve cross-browser/cross-context issues:

**Improved Reliability:**
- Consistent channel creation across all browser contexts
- Centralized error handling and retry logic
- Better WebSocket connection management
- Unified debugging and monitoring

**Cross-Context Support:**
- iPad Safari: Improved WebSocket handling
- Incognito Mode: Consistent channel behavior
- Brave Browser: Better ad-blocker compatibility
- Background Tabs: Reduced throttling impact

### Debug Steps for Real-time Issues
```
1. Check Channel Creation:
   debugLog('Manager', `Creating and subscribing to new Supabase channel: ${channelName}`)

2. Verify Channel Subscription:
   debugLog('Manager', `Channel ${channelName} subscription status: ${status}`)

3. Monitor Payload Dispatch:
   debugLog('Manager', 'Received payload from channel:', payload)

4. Confirm Connection Filtering:
   debugLog('Dispatch', `Operation from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`)
```
