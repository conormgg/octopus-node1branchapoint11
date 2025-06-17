
# AI Context Documentation

## Application Overview

This is **OctoPi Ink**, a collaborative whiteboard application built with React, TypeScript, and Konva. The app supports real-time collaboration between teachers and students in educational settings.

## Core Concepts

### 1. Whiteboard System
- **Canvas**: Uses Konva.js for high-performance 2D graphics
- **Tools**: Pencil, highlighter, eraser, select tool for drawing and manipulation
- **Objects**: Lines (strokes) and Images that can be drawn, selected, and transformed
- **State**: Managed through a centralized whiteboard state system
- **Eye Button**: Activity tracking and viewport centering for teacher-student pairs

### 2. Event Handling Strategy
- **Dual System**: Uses both pointer events (for palm rejection) and touch/mouse events (fallback)
- **Palm Rejection**: Advanced stylus detection to prevent accidental palm touches
- **Pan/Zoom**: Gesture-based navigation with right-click panning support

### 3. Session Management
- **Teacher Dashboard**: Create and manage sessions with unique URLs
- **Student Join**: Students join via session URLs with assigned board suffixes
- **Real-time Sync**: Live collaboration using Supabase realtime subscriptions

### 4. State Architecture
- **Local State**: Individual whiteboard state (lines, images, selection)
- **Sync State**: Real-time collaboration state management
- **History State**: Undo/redo functionality with operation tracking
- **Activity State**: Last activity tracking for eye button functionality

### 5. Eye Button System
- **Activity Tracking**: Monitors drawing, highlighting, erasing, object movement, and image pasting
- **Viewport Centering**: Centers view on last activity location
- **Persistence**: Maintains activity across browser refresh and window state changes
- **Scope**: Currently implemented for teacher1-student1 pair only
- **Integration**: Built into existing sync and history systems

### 6. Collaborative Undo/Redo System (Phase 2)
- **Synchronized Operations**: Teacher1 undo/redo actions sync to Student1
- **History Replay**: Pure simulation system for accurate state reconstruction
- **Cross-View Consistency**: Undo/redo works in both minimized and maximized views
- **Session Persistence**: Undo/redo capability maintained across browser refresh
- **Operation Ordering**: All operations (including undo/redo) are timestamped and ordered

### 7. Performance Monitoring System
- **Modular Architecture**: New separated concerns with focused modules
- **Core Coordinator**: `usePerformanceCoordinator` manages all performance modules
- **Integration Layer**: `useIntegrationCore` handles automatic operation instrumentation
- **Main Interfaces**: `usePerformanceMonitor` and `useMonitoringIntegration` provide simplified access
- **Specialized Modules**: Individual hooks for metrics, timers, memory, reporting, and FPS tracking
- **Operation Wrappers**: Automatic performance monitoring for drawing, sync, and render operations
- **Optimization Tracking**: `useOptimizationTracker` provides performance analysis and recommendations

## Key Data Flow

1. **User Input** → Event Handlers → Tool Operations → State Updates → Canvas Rendering
2. **Collaboration** → Supabase Realtime → Operation Handler → State Sync → UI Updates
3. **Session Management** → Database Operations → Context Updates → Component Re-renders
4. **Performance Monitoring** → Operation Wrappers → Metrics Collection → Analysis → Reporting
5. **Activity Tracking** → Eye Button Logic → Activity Metadata → Persistence → Viewport Centering
6. **Undo/Redo Sync** → Operation Serialization → Realtime Transmission → Remote Application → State Consistency

## Critical Files for AI Understanding

1. `src/types/whiteboard.ts` - Core data structures including ActivityMetadata
2. `src/hooks/useWhiteboardState.ts` - Main state management
3. `src/hooks/useStageEventHandlers.ts` - Event coordination
4. `src/components/canvas/KonvaStage.tsx` - Main canvas component
5. `src/hooks/shared/useSharedOperationsCoordinator.ts` - Collaboration logic
6. `src/hooks/performance/monitoring/usePerformanceCoordinator.ts` - Performance coordination
7. `src/hooks/performance/monitoring/useIntegrationCore.ts` - Performance integration
8. `src/hooks/whiteboard/useEyeButtonLogic.ts` - Eye button functionality
9. `src/components/whiteboard/WhiteboardContent.tsx` - Whiteboard content management
10. `src/hooks/shared/useSharedPersistenceIntegration.ts` - Activity persistence
11. `src/hooks/shared/useSharedHistoryReplay.ts` - Pure history simulation system
12. `src/hooks/useHistoryState.ts` - History management with sync support

## Eye Button Architecture

The eye button system uses a modular architecture with clear separation of concerns:

- **Logic Layer**: `useEyeButtonLogic` manages button state and configuration
- **Integration Layer**: Activity tracking integrated into drawing, erasing, and image operations
- **Persistence Layer**: Activity metadata stored in history snapshots and database
- **UI Layer**: Eye button component integrated into top-right button group
- **Centering Logic**: Viewport management through pan/zoom system

## Collaborative History Architecture (Phase 2)

The undo/redo system uses a sophisticated architecture for synchronized collaboration:

- **Pure Simulation Layer**: `useSharedHistoryReplay` provides deterministic state reconstruction
- **Sync Integration**: Undo/redo operations transmitted via Supabase realtime
- **State Consistency**: All clients maintain identical history through operation replay
- **Cross-View Support**: State persists across minimized/maximized view changes
- **Refresh Resilience**: History reconstructed from database operations on page load

## Performance Monitoring Architecture

The performance monitoring system uses a modular architecture with clear separation of concerns:

- **Coordination Layer**: `usePerformanceCoordinator` manages all performance modules
- **Integration Layer**: `useIntegrationCore` provides automatic operation instrumentation
- **Public Interfaces**: `usePerformanceMonitor` and `useMonitoringIntegration` for external use
- **Specialized Modules**: Individual hooks for specific performance aspects
- **Operation Wrappers**: Automatic timing and monitoring for all operations
- **Analysis & Optimization**: Performance scoring and recommendation system

## Common Modification Patterns

- **Adding new tools**: Extend Tool enum, add event handlers, update UI
- **Event handling changes**: Modify handlers in `src/hooks/eventHandling/`
- **State changes**: Update whiteboard state types and management hooks
- **UI components**: Add to appropriate canvas layers or toolbar sections
- **Performance monitoring**: Add new metrics or analysis modules to the modular system
- **Activity tracking**: Extend ActivityMetadata interface and update tracking logic
- **Eye button features**: Modify useEyeButtonLogic and related integration points
- **Undo/redo enhancements**: Extend operation types and replay simulation logic
- **Sync operations**: Add new operation types to serialization and handling systems
