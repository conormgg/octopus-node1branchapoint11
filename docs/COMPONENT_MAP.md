
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

## Hook Dependencies

```
useWhiteboardState
├── useSharedOperationsCoordinator
│   ├── useSharedDrawingOperations
│   ├── useSharedImageOperations
│   └── useSyncState (if collaboration enabled)
├── useSelectionState
├── usePanZoom
└── useStageEventHandlers
    ├── usePointerEventHandlers
    ├── useTouchEventHandlers
    └── useWheelEventHandlers
```

## State Flow

```
User Input
    ↓
Event Handlers (pointer/touch/mouse)
    ↓
Tool-specific Operations (draw/erase/select)
    ↓
Whiteboard State Updates
    ↓
Canvas Re-rendering + History Updates
    ↓
Sync Operations (if collaborative)
```
