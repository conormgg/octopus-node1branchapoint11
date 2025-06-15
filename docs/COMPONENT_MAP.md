
# Component Hierarchy Map

## Application Structure

```
App
├── PerformanceDashboardProvider (wraps entire app in development)
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

## Performance Monitoring System

```
PerformanceDashboardProvider
├── PerformanceDashboard (modal overlay)
│   ├── PerformanceOverviewTab
│   │   ├── PerformanceQuickStats
│   │   └── Performance summary cards
│   ├── PerformanceMetricsTab
│   │   ├── Detailed metrics tables
│   │   └── Real-time charts
│   ├── LayerOptimizationTab
│   │   ├── Cache metrics
│   │   ├── Optimization recommendations
│   │   └── Performance trends
│   ├── PerformanceOpportunitiesTab
│   │   ├── Actionable suggestions
│   │   └── Impact assessments
│   └── PerformanceRecommendationsTab
│       ├── Priority recommendations
│       └── Implementation guidance
└── Performance Hooks Integration
    ├── usePerformanceMonitor (main coordinator)
    ├── useMonitoringIntegration (auto-instrumentation)
    ├── useOptimizationTracker (analysis & recommendations)
    ├── useLayerOptimizationMetrics (canvas optimization)
    └── Performance monitoring modules
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
├── LayerOptimizationHandler (performance monitoring)
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
├── useStageEventHandlers
│   ├── usePointerEventHandlers
│   ├── useTouchEventHandlers
│   └── useWheelEventHandlers
└── Performance Monitoring Integration
    ├── useMonitoringIntegration (auto-wraps operations)
    ├── usePerformanceMonitor (tracks all metrics)
    └── useOptimizationTracker (analyzes performance)
```

## Performance Monitoring Architecture

```
Debug System (globalDebugExports.ts)
├── Performance Dashboard Controls
│   ├── showPerformanceDashboard()
│   ├── hidePerformanceDashboard()
│   └── dashboard state management
├── Debug Configuration (debugConfig.ts)
│   ├── Performance subsystem toggles
│   ├── Layer optimization debugging
│   └── Runtime configuration
└── Global Debug Interface
    ├── window.debug.* functions
    ├── Subsystem enable/disable
    └── Configuration access
```

## State Flow

```
User Input
    ↓
Event Handlers (pointer/touch/mouse)
    ↓ (monitored by performance system)
Tool-specific Operations (draw/erase/select)
    ↓ (instrumented for metrics)
Whiteboard State Updates
    ↓ (tracked for performance)
Canvas Re-rendering + History Updates
    ↓ (layer optimization applied)
Sync Operations (if collaborative)
    ↓ (sync performance monitored)
Performance Dashboard Updates (real-time)
```

## Performance Integration Points

```
Core Operations → Performance Monitoring
├── Drawing Operations
│   ├── Stroke creation timing
│   ├── Point simplification metrics
│   └── Rendering performance
├── Image Operations  
│   ├── Upload/load timing
│   ├── Resize/transform metrics
│   └── Memory usage tracking
├── Sync Operations
│   ├── Network operation timing
│   ├── State synchronization metrics
│   └── Collaboration performance
└── Canvas Rendering
    ├── FPS tracking
    ├── Layer optimization metrics
    └── Memory usage monitoring
```

## Debug System Integration

```
Development Environment
├── Automatic Performance Monitoring
│   ├── All operations instrumented
│   ├── Real-time metric collection
│   └── Dashboard state management
├── Console Debug Access
│   ├── window.debug.showPerformanceDashboard()
│   ├── window.debug.enableDebug(subsystem)
│   └── window.debug.getDebugConfig()
└── Performance Dashboard
    ├── Accessible via debug commands
    ├── Real-time updates every 5 seconds
    └── Development-only activation
```
