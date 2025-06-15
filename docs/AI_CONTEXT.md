
# AI Context Documentation

## Application Overview

This is **OctoPi Ink**, a collaborative whiteboard application built with React, TypeScript, and Konva. The app supports real-time collaboration between teachers and students in educational settings with comprehensive performance monitoring.

## Core Concepts

### 1. Whiteboard System
- **Canvas**: Uses Konva.js for high-performance 2D graphics
- **Tools**: Pencil, highlighter, eraser, select tool for drawing and manipulation
- **Objects**: Lines (strokes) and Images that can be drawn, selected, and transformed
- **State**: Managed through a centralized whiteboard state system
- **Performance**: Real-time monitoring with optimization recommendations

### 2. Event Handling Strategy
- **Dual System**: Uses both pointer events (for palm rejection) and touch/mouse events (fallback)
- **Palm Rejection**: Advanced stylus detection to prevent accidental palm touches
- **Pan/Zoom**: Gesture-based navigation with right-click panning support
- **Performance Tracking**: All event handling operations are monitored for performance

### 3. Session Management
- **Teacher Dashboard**: Create and manage sessions with unique URLs
- **Student Join**: Students join via session URLs with assigned board suffixes
- **Real-time Sync**: Live collaboration using Supabase realtime subscriptions
- **Sync Performance**: Monitoring of collaboration operation timing and efficiency

### 4. State Architecture
- **Local State**: Individual whiteboard state (lines, images, selection)
- **Sync State**: Real-time collaboration state management
- **History State**: Undo/redo functionality with operation tracking
- **Performance State**: Real-time metrics and optimization tracking

### 5. Performance Monitoring System
- **Real-time Dashboard**: Development-accessible performance monitoring interface
- **Comprehensive Metrics**: Drawing, image, sync, memory, and rendering performance
- **Layer Optimization**: Automatic canvas layer caching and optimization
- **Debug Integration**: Console-accessible debug controls and configuration

## Key Data Flow

1. **User Input** → Event Handlers → Tool Operations → State Updates → Canvas Rendering
2. **Collaboration** → Supabase Realtime → Operation Handler → State Sync → UI Updates
3. **Session Management** → Database Operations → Context Updates → Component Re-renders
4. **Performance Monitoring** → Operation Instrumentation → Metrics Collection → Dashboard Updates

## Performance Architecture

### Monitoring Integration
- **Automatic Instrumentation**: All operations automatically tracked for performance
- **Real-time Collection**: Metrics updated continuously during application use
- **Dashboard Access**: Development console access via `window.debug.showPerformanceDashboard()`
- **Debug Controls**: Granular subsystem debugging via `window.debug.enableDebug(subsystem)`

### Key Performance Areas
- **Drawing Operations**: Stroke rendering, point simplification, tool responsiveness
- **Image Operations**: Upload, resize, transform, memory management
- **Sync Operations**: Real-time collaboration efficiency and network performance
- **Canvas Rendering**: FPS tracking, layer optimization, memory usage
- **Layer Optimization**: Cache hit rates, adaptive thresholds, quality metrics

### Debug System
- **Global Access**: `window.debug.*` functions available in development
- **Subsystem Control**: Enable/disable debugging for specific areas
- **Configuration**: Runtime debug configuration and performance tuning
- **Dashboard Control**: Show/hide performance dashboard via console commands

## Critical Files for AI Understanding

### Core Application
1. `src/types/whiteboard.ts` - Core data structures
2. `src/hooks/useWhiteboardState.ts` - Main state management
3. `src/hooks/useStageEventHandlers.ts` - Event coordination
4. `src/components/canvas/KonvaStage.tsx` - Main canvas component
5. `src/hooks/shared/useSharedOperationsCoordinator.ts` - Collaboration logic

### Performance Monitoring
6. `src/hooks/performance/index.ts` - Performance monitoring exports
7. `src/hooks/performance/usePerformanceMonitor.ts` - Main performance coordination
8. `src/hooks/performance/useMonitoringIntegration.ts` - Automatic operation instrumentation
9. `src/components/performance/PerformanceDashboard.tsx` - Dashboard UI
10. `src/utils/debug/globalDebugExports.ts` - Debug system controls

### Debug and Configuration
11. `src/utils/debug/debugConfig.ts` - Debug configuration system
12. `src/components/performance/PerformanceDashboardProvider.tsx` - Dashboard context provider

## Performance Monitoring Usage

### Development Access
```javascript
// Show performance dashboard
window.debug.showPerformanceDashboard()

// Enable specific debugging
window.debug.enableDebug('layerOptimization')
window.debug.enableDebug('performanceMetrics')

// Get debug configuration
window.debug.getDebugConfig()
```

### Available Debug Subsystems
- `performance`, `performanceMetrics`, `performanceTimers`
- `memoryMonitor`, `fpsTracker`, `performanceDashboard`
- `canvas`, `layerOptimization`, `viewportCulling`, `renderOperations`
- `events`, `pointerEvents`, `touchEvents`, `wheelEvents`, `palmRejection`
- `state`, `selection`, `history`, `panZoom`
- `sync`, `operations`, `connection`
- `windows`, `images`, `drawing`, `session`

## Common Modification Patterns

### Core Features
- **Adding new tools**: Extend Tool enum, add event handlers, update UI
- **Event handling changes**: Modify handlers in `src/hooks/eventHandling/`
- **State changes**: Update whiteboard state types and management hooks
- **UI components**: Add to appropriate canvas layers or toolbar sections

### Performance Integration
- **New operation monitoring**: Add instrumentation via `useMonitoringIntegration`
- **Custom metrics**: Extend performance hooks with new measurement types
- **Dashboard components**: Add new tabs or metrics displays to dashboard
- **Debug controls**: Extend debug system with new subsystems or controls

### Performance Best Practices
- **Always instrument new operations**: Use monitoring integration for any new user operations
- **Monitor memory impact**: Track memory usage for any new large-scale operations
- **Test with dashboard**: Use performance dashboard to validate optimization efforts
- **Debug systematically**: Use debug subsystems to isolate performance issues

## Integration Points

### Automatic Performance Tracking
- All drawing operations are automatically instrumented
- Image operations include upload, resize, and transform timing
- Sync operations track network and state synchronization performance
- Canvas rendering includes FPS and layer optimization metrics

### Manual Performance Integration
- Use `useMonitoringIntegration` hook for custom operation tracking
- Extend `useOptimizationTracker` for new optimization recommendations
- Add custom metrics to `usePerformanceMetrics` for specialized monitoring
- Integrate with debug system for new subsystem debugging

## Development Workflow

1. **Performance Awareness**: Always consider performance impact of new features
2. **Dashboard Usage**: Use `window.debug.showPerformanceDashboard()` during development
3. **Debug Integration**: Add debug logging for new subsystems via `createDebugLogger`
4. **Optimization Tracking**: Monitor performance impact and add optimization recommendations
5. **Documentation**: Update performance guide and component map for new features
