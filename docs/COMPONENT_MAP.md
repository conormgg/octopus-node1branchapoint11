
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

## Hook Dependencies

```
useSharedWhiteboardState
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
