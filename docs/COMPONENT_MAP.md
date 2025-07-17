
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
│           ├── TeacherSessionSplitView (Split View 2 - portal mode)
│           │   ├── StudentBoardsWindow (portal-based window)
│           │   └── TeacherMainBoard
│           └── TeacherSessionResizablePanels (normal/Split View mode)
│               ├── TeacherMainBoard  
│               └── StudentBoardsGrid (resizable when Split View active)
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
├── Split View 2 (Portal Window System)
│   ├── StudentBoardsWindow (portal-based)
│   │   ├── WindowContentRenderer
│   │   │   ├── WindowContentHeader
│   │   │   │   └── StudentBoardsWindowHeader (layout controls only)
│   │   │   └── WindowContentBody
│   │   │       └── StudentBoardsGrid
│   │   └── Window State Management (useWindowContentState)
│   └── Teacher Main Board (remains in main window)
├── Split View (Original Resizable Panels)
│   ├── TeacherMainBoard (left panel)
│   └── StudentBoardsGrid (right panel - resizable)
└── Normal Mode
    ├── TeacherMainBoard
    └── StudentBoardsGrid (non-resizable)
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
    ├── Split View Toggle (resizable panels)
    └── Split View 2 Toggle (portal window)
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
Split View 2 (Portal Mode):
├── Main Browser Window
│   ├── TeacherHeader (with all controls)
│   └── Teacher's Whiteboard Only
└── Portal-based Student Window
    ├── WindowContentHeader (layout controls only)
    └── Student Boards Grid

Split View (Original):
└── Single Window with Resizable Panels
    ├── Teacher's Whiteboard (left panel)
    └── Student Boards Grid (right panel - resizable)

Normal Mode:
└── Single Window
    ├── Teacher's Whiteboard
    └── Student Boards Grid (non-resizable)
```

### Mode Selection Guidelines

**Use Split View 2 when:**
- Working with dual monitor setups
- Need maximum screen real estate for each view
- Want independent window management
- Teaching with projector + personal monitor

**Use Split View when:**
- Working on single monitor
- Need quick panel resizing
- Prefer integrated interface
- Want lower system overhead

**Use Normal Mode when:**
- Simple teaching scenarios
- Limited screen space
- No need for simultaneous viewing

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

## Sync Architecture Integration Points

### 🚨 CRITICAL: Sender ID Management

**Connection Creation Pattern:**
```
Component A (Teacher1):
- connectionId: 'board-123-session-456-teacher1'
- originalConfig.senderId: 'teacher1' (IMMUTABLE)
- Receives operations from: student1 ✓, teacher1 ✗ (filtered)

Component B (Student1):
- connectionId: 'board-123-session-456-student1'
- originalConfig.senderId: 'student1' (IMMUTABLE)
- Receives operations from: teacher1 ✓, student1 ✗ (filtered)
```

**Handler Registration Flow:**
```
First Registration → Create Connection → Store Immutable Config
Second Registration → Reuse Connection → Add Handler → Keep Original Config
Component Unmount → Remove Handler → Grace Period → Cleanup
```

### Operation Filtering Integration

**Multi-Component Scenario:**
```
Teacher Component:
useSharedWhiteboardState(syncConfig: { senderId: 'teacher1' })
    ↓
useSyncState → SyncConnectionManager → Connection (teacher1)
    ↓
Filters operations: Receives from student1 ✓, blocks teacher1 ✗

Student Component:
useSharedWhiteboardState(syncConfig: { senderId: 'student1' })
    ↓
useSyncState → SyncConnectionManager → Connection (student1)
    ↓
Filters operations: Receives from teacher1 ✓, blocks student1 ✗
```

### Debug Integration Points

**Sync Debug Logging:**
```
useSharedWhiteboardState → useSyncState → Connection
    ↓
debugLog('Connection', 'Created with senderId: teacher1')
debugLog('Dispatch', 'Operation from: student1, local: teacher1')
debugLog('Dispatch', 'Skipping operation from self (teacher1)')
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
- Automatic sync integration
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

