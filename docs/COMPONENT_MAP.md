
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
    │       ├── TeacherHeader
    │       ├── TeacherMainBoard
    │       └── StudentBoardsGrid
    └── StudentView (for students)
        └── StudentSessionView
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

## Collaborative Undo/Redo Hook Structure (Phase 2)

```
useHistoryState (Enhanced)
├── Local History Management
├── Sync Operation Integration (sendOperation parameter)
├── Activity Metadata Support
└── Remote Operation Compatibility

useSharedHistoryReplay (Pure Simulator)
├── Operation Processing Pipeline
├── History Stack Simulation
├── Undo/Redo State Transitions
└── Activity Metadata Reconstruction

useRemoteOperationHandler (Extended)
├── Draw/Erase Operations
├── Undo/Redo Operations (new)
├── Image Operations
└── State Synchronization
```

## Performance Monitoring Hook Structure

```
usePerformanceMonitor
└── usePerformanceCoordinator
    ├── usePerformanceMetrics
    ├── usePerformanceTimers
    ├── useMemoryMonitor
    ├── usePerformanceReporting
    └── useFpsTracker

useMonitoringIntegration
└── useIntegrationCore
    ├── usePerformanceCoordinator (shared)
    ├── useOperationWrappers
    ├── useMonitoringTypes
    └── useMonitoringCore

useOptimizationTracker
├── useDrawingAnalysis
├── useSyncAnalysis
├── useRenderAnalysis
├── useMemoryAnalysis
└── usePerformanceScoring
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

## Collaborative Undo/Redo Flow (Phase 2)

```
Teacher Action (Undo/Redo)
    ↓
History Operation (useHistoryState)
    ↓
Sync Operation (sendOperation)
    ↓
Supabase Realtime Transmission
    ↓
Student Reception (useRemoteOperationHandler)
    ↓
Local Undo/Redo Application
    ↓
State Synchronization
```

## History Replay Flow (Phase 2)

```
Component Mount/Remount
    ↓
Database Operations Fetch (useWhiteboardPersistence)
    ↓
Pure History Simulation (useSharedHistoryReplay)
    ↓
State Reconstruction (replayOperations)
    ↓
Final State Application (useSharedPersistenceIntegration)
    ↓
UI Update and History Stack Initialization
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

## Performance Monitoring Flow

```
Operation Execution
    ↓
Operation Wrappers (automatic instrumentation)
    ↓
Timer Management + Metrics Collection
    ↓
Performance Coordinator (aggregation)
    ↓
Analysis Modules (optimization tracking)
    ↓
Reporting + Recommendations
```

## Undo/Redo Patterns (Phase 2)

```
// Synchronized Undo Pattern
const { undo, canUndo } = useHistoryState(state, setState, undefined, sendOperation);

// Pure History Replay Pattern
const { replayOperations } = useSharedHistoryReplay();
const { finalState, historyStack, finalHistoryIndex } = replayOperations(operations, initialState);

// Remote Undo/Redo Handling Pattern
const { handleRemoteOperation } = useRemoteOperationHandler(setState, undo, redo);
```
