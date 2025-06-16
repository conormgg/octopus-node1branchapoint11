
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
│   └── useSyncState (if collaboration enabled)
├── useSelectionState
├── usePanZoom (with centerOnBounds for eye button)
├── useHistoryState (with lastActivity support)
└── useStageEventHandlers
    ├── usePointerEventHandlers
    ├── useTouchEventHandlers
    └── useWheelEventHandlers

useEyeButtonLogic
├── Activity Configuration
├── Button State Management
├── Center Callback Handling
└── Last Activity Updates
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
Tool-specific Operations (draw/erase/select)
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
