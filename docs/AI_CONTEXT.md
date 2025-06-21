
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

### 5. Sync Architecture (CRITICAL - DO NOT MODIFY WITHOUT UNDERSTANDING)

**⚠️ DANGER ZONE: This section describes critical architecture that has caused multiple production issues when modified incorrectly.**

#### 5.1 Centralized Channel Management (NEW ARCHITECTURE)
The sync system now uses **centralized channel management** where:

- **SyncConnectionManager** creates and manages one Supabase channel per whiteboard
- **All connections for the same whiteboard share the same channel**
- **Centralized dispatch** routes incoming payloads to relevant connections
- **Connection objects accept a shared channel** rather than creating their own

**Critical Implementation Details:**
```typescript
// SyncConnectionManager creates channels centrally
const channelName = `whiteboard-${config.whiteboardId}`;
let channel = this.channels.get(channelName);

if (!channel) {
  // Create and subscribe to new Supabase channel
  channel = supabase.channel(channelName)
    .on('postgres_changes', {...}, (payload) => 
      this.handleChannelPayload(payload, config.whiteboardId)
    )
    .subscribe();
  this.channels.set(channelName, channel);
}

// Connection accepts shared channel
connection = new Connection(config, handler, channel); // Shared channel passed in
```

#### 5.2 Sender ID Filtering with Shared Channels
The filtering logic remains the same but now works with shared channels:

- **Each connection maintains an IMMUTABLE sender ID** that NEVER changes after creation
- **Multiple connections with different sender IDs** share the same Supabase channel
- **Centralized dispatch** sends the same payload to all connections for a whiteboard
- **Individual filtering** prevents echo-back by comparing sender IDs
- **Config overwrites are FORBIDDEN** - they break the filtering logic

**Critical Implementation Details:**
```typescript
// Centralized dispatch to all connections for a whiteboard
private handleChannelPayload(payload: any, whiteboardId: string): void {
  this.connections.forEach((connection, connectionId) => {
    if (connectionId.startsWith(whiteboardId)) {
      connection.handlePayload(payload); // All connections get same payload
    }
  });
}

// Individual connection filtering (unchanged)
public handlePayload(payload: any): void {
  const operation = PayloadConverter.toOperation(payload);
  this.info.handlers.forEach(handler => {
    if (operation.sender_id !== this.originalConfig.senderId) {
      handler(operation); // Only forward if NOT from self
    }
  });
}
```

#### 5.3 Connection Lifecycle with Centralized Management
1. **First Registration**: Creates new connection and potentially new shared channel
2. **Subsequent Registrations**: Reuses existing connection and shared channel
3. **Config Isolation**: Each connection keeps its original sender ID regardless of shared channel
4. **Grace Period Cleanup**: 30-second delay before closing unused connections and channels

#### 5.4 Common Pitfalls and Debugging (Updated)
**NEVER DO THESE:**
- ❌ Create channels in Connection constructor (bypasses centralized management)
- ❌ Update connection config after creation (`updateConfig` method was removed for this reason)
- ❌ Modify sender ID during connection lifecycle
- ❌ Share config objects between different components
- ❌ Assume all handlers on a connection have the same sender ID

**New Debug Patterns for Centralized Architecture:**
```typescript
// Check centralized channel creation
debugLog('Manager', `Creating and subscribing to new Supabase channel: ${channelName}`);

// Track centralized payload dispatch
debugLog('Manager', 'Received payload from channel:', payload);
debugLog('Manager', `Dispatching to connections for whiteboard: ${whiteboardId}`);

// Monitor channel subscription status
debugLog('Manager', `Channel ${channelName} subscription status: ${status}`);
```

### 6. Eye Button System
- **Activity Tracking**: Monitors drawing, highlighting, erasing, object movement, and image pasting
- **Viewport Centering**: Centers view on last activity location
- **Persistence**: Maintains activity across browser refresh and window state changes
- **Scope**: Currently implemented for teacher1-student1 pair only
- **Integration**: Built into existing sync and history systems

### 7. Collaborative Undo/Redo System (Phase 2)
- **Synchronized Operations**: Teacher1 undo/redo actions sync to Student1
- **History Replay**: Pure simulation system for accurate state reconstruction
- **Cross-View Consistency**: Undo/redo works in both minimized and maximized views
- **Session Persistence**: Undo/redo capability maintained across browser refresh
- **Operation Ordering**: All operations (including undo/redo) are timestamped and ordered

### 8. Performance Monitoring System
- **Modular Architecture**: New separated concerns with focused modules
- **Core Coordinator**: `usePerformanceCoordinator` manages all performance modules
- **Integration Layer**: `useIntegrationCore` handles automatic operation instrumentation
- **Main Interfaces**: `usePerformanceMonitor` and `useMonitoringIntegration` provide simplified access
- **Specialized Modules**: Individual hooks for metrics, timers, memory, reporting, and FPS tracking
- **Operation Wrappers**: Automatic performance monitoring for drawing, sync, and render operations
- **Optimization Tracking**: `useOptimizationTracker` provides performance analysis and recommendations

### 9. Tablet Support System (NEW)

**⚠️ TABLET-FRIENDLY: Comprehensive tablet and stylus support for optimal iPad with Apple Pencil experience**

#### 9.1 Tablet Architecture Overview
The tablet support system provides a multi-layered approach to handle stylus devices, palm rejection, and touch optimization:

- **Central Coordinator**: `useTabletEventHandling` manages all tablet-related functionality
- **Palm Rejection**: Advanced algorithm to distinguish stylus from accidental palm touches
- **Text Selection Prevention**: Multi-layer prevention across CSS and JavaScript
- **Safari Optimizations**: iPad-specific performance and behavior optimizations
- **Debug Utilities**: Comprehensive logging and capability detection
- **Centralized Configuration**: Single source of truth for all tablet settings

#### 9.2 Event Handling Strategy for Tablets
The tablet system uses a sophisticated event handling strategy:

```typescript
/**
 * Event system selection logic:
 * - Use pointer events when palm rejection is enabled AND the device supports them
 * - Fall back to touch events when palm rejection is disabled OR pointer events aren't supported
 * - This prevents duplicate event handling while ensuring all devices work
 */
const usePointerEvents = supportsPointerEvents && palmRejectionConfig.enabled;
const useTouchEvents = !usePointerEvents;
```

**Critical Decision Points:**
- **Pointer Events**: Used for palm rejection when supported and enabled
- **Touch Events**: Fallback for compatibility or when palm rejection is disabled
- **Dual Prevention**: Never run both event systems simultaneously to avoid conflicts
- **Stylus Priority**: Pen/stylus input ALWAYS takes priority over touch input

#### 9.3 Palm Rejection Algorithm
The palm rejection system uses multiple detection methods:

```typescript
// ALWAYS allow pen/stylus input - this is critical for iPad stylus support
if (pointer.pointerType === 'pen') {
  return true;
}

// Multi-factor palm detection:
// 1. Contact size analysis (large areas = palm)
// 2. Pressure analysis (light touches may be accidental)
// 3. Cluster detection (multiple simultaneous touches = palm + fingers)
// 4. Temporal analysis (palm timeout after detection)
```

**Palm Rejection Configuration:**
- **maxContactSize**: Maximum contact area for valid touch (default: 40px)
- **minPressure**: Minimum pressure threshold (default: 0.1)
- **palmTimeoutMs**: Ignore duration after palm detection (default: 500ms)
- **clusterDistance**: Distance threshold for clustered touches (default: 100px)
- **preferStylus**: Always prioritize stylus input (default: true)

#### 9.4 Text Selection Prevention Layers
Multi-layer text selection prevention for drawing interfaces:

1. **CSS Layer**: Comprehensive user-select prevention with vendor prefixes
2. **Event Layer**: preventDefault on selectstart and dragstart events
3. **Touch Action**: Strategic touch-action CSS properties
4. **Callout Prevention**: Disable iOS/Safari context menus and callouts

```typescript
// Comprehensive CSS prevention
WebkitUserSelect: 'none',
WebkitTouchCallout: 'none',
WebkitTapHighlightColor: 'transparent',
touchAction: palmRejectionEnabled ? 'none' : 'manipulation',
userSelect: 'none',
MozUserSelect: 'none',
msUserSelect: 'none'
```

#### 9.5 Safari/iPad Optimizations
iPad-specific optimizations for optimal performance:

- **Hardware Acceleration**: Force GPU acceleration for smooth drawing
- **Viewport Optimizations**: Prevent iOS zooming and scaling behaviors
- **Font Smoothing**: Enhanced text rendering on high-DPI displays
- **Overflow Scrolling**: Optimize for webkit-overflow-scrolling
- **Context Menu Prevention**: Disable long-press context menus during drawing

#### 9.6 Tablet Configuration System
Centralized configuration with multiple presets:

```typescript
// Available configuration presets
TABLET_CONFIG_PRESETS = {
  ipad: DEFAULT_TABLET_CONFIG,      // Optimized for iPad with Apple Pencil
  development: DEVELOPMENT_CONFIG,   // Debug-friendly settings
  minimal: MINIMAL_CONFIG,          // Testing without optimizations
  performance: PERFORMANCE_CONFIG   // High-performance drawing
}
```

**Configuration Categories:**
- **Events**: Palm rejection and pointer handling settings
- **CSS**: Text selection and touch action configurations
- **Safari**: iPad-specific browser optimizations
- **Performance**: Hardware acceleration and rendering optimizations

#### 9.7 Debugging and Diagnostics
Comprehensive debugging utilities for tablet troubleshooting:

```typescript
// Global debug access (development mode)
window.tabletDebugger.generateReport()
window.tabletConfig.validate(config)
window.enableDebug('tablet')
```

**Debug Capabilities:**
- **Event Logging**: Track all pointer/touch events with rejection reasons
- **Capability Detection**: Analyze device support for various input methods
- **Configuration Validation**: Verify tablet settings are correct
- **Performance Analysis**: Monitor palm rejection performance impact
- **Status Reporting**: Real-time palm rejection status and statistics

#### 9.8 Common Tablet Troubleshooting Patterns

**Palm Rejection Issues:**
```typescript
// Check if palm rejection is working
const status = palmRejection.getStatus();
console.log('Palm rejection active:', status.enabled);
console.log('Rejected pointers:', status.rejectedPointers);

// Debug specific pointer events
window.enableDebug('palmRejection');
// Events will be logged with rejection reasons
```

**Text Selection Problems:**
```typescript
// Verify text selection prevention is active
const container = containerRef.current;
console.log('User select:', getComputedStyle(container).userSelect);
console.log('Touch action:', getComputedStyle(container).touchAction);
```

**iPad/Safari Performance Issues:**
```typescript
// Check Safari optimization status
console.log('Safari optimizations:', config.safari.enabled);
console.log('Hardware acceleration:', config.safari.forceHardwareAcceleration);
```

**Event System Conflicts:**
```typescript
// Verify only one event system is active
const strategy = tabletEventHandling.eventStrategy;
console.log('Using pointer events:', strategy.usePointerEvents);
console.log('Using touch events:', strategy.useTouchEvents);
// Only one should be true
```

#### 9.9 Critical Files for Tablet Support
- `src/hooks/tablet/useTabletEventHandling.ts` - Central coordinator
- `src/hooks/tablet/usePalmRejection.ts` - Palm rejection algorithm
- `src/hooks/tablet/useTextSelectionPrevention.ts` - Text selection prevention
- `src/hooks/tablet/useTabletOptimizations.ts` - Safari/iPad optimizations
- `src/utils/tablet/tabletDebugger.ts` - Debugging utilities
- `src/config/tabletConfig.ts` - Centralized configuration
- `src/hooks/tablet/index.ts` - Public API exports

#### 9.10 Tablet Integration Points
The tablet system integrates with existing components:

- **Whiteboard.tsx**: Main tablet configuration and settings UI
- **WhiteboardCanvas.tsx**: Canvas-level text selection prevention
- **KonvaStage.tsx**: Event handling integration with Konva
- **useStageEventHandlers.ts**: Event system coordination
- **PalmRejectionSettings.tsx**: User configuration interface

## Key Data Flow

1. **User Input** → Event Handlers → Tool Operations → State Updates → Canvas Rendering
2. **Collaboration** → Supabase Realtime → Centralized Dispatch → Connection Filtering → State Sync → UI Updates
3. **Session Management** → Database Operations → Context Updates → Component Re-renders
4. **Performance Monitoring** → Operation Wrappers → Metrics Collection → Analysis → Reporting
5. **Activity Tracking** → Eye Button Logic → Activity Metadata → Persistence → Viewport Centering
6. **Undo/Redo Sync** → Operation Serialization → Realtime Transmission → Remote Application → State Consistency
7. **Tablet Input** → Capability Detection → Event System Selection → Palm Rejection → Tool Operations → Canvas Updates

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
13. **`src/utils/sync/SyncConnectionManager.ts`** - CRITICAL: Centralized channel management and payload dispatch
14. **`src/utils/sync/Connection.ts`** - CRITICAL: Shared channel handling and sender ID filtering
15. **`src/hooks/tablet/useTabletEventHandling.ts`** - CRITICAL: Central tablet coordinator
16. **`src/config/tabletConfig.ts`** - CRITICAL: Centralized tablet configuration

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

## Tablet Support Architecture

The tablet support system uses a comprehensive, multi-layered architecture:

- **Event Coordination**: `useTabletEventHandling` manages all tablet functionality
- **Palm Rejection**: Advanced algorithm with multiple detection methods
- **Text Prevention**: Multi-layer text selection blocking across CSS and JavaScript
- **Safari Optimization**: iPad-specific performance and behavior enhancements
- **Debugging System**: Comprehensive logging and diagnostic utilities
- **Configuration Management**: Centralized settings with multiple presets

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
- **Tablet support**: Extend configuration presets or add new optimization modules

## CRITICAL WARNINGS FOR AI MODIFICATIONS

### ⚠️ DO NOT MODIFY SYNC ARCHITECTURE WITHOUT EXTREME CAUTION
The sync architecture has been updated to use centralized channel management, which adds complexity. This system has caused multiple production outages when modified incorrectly. Before making ANY changes to sync-related files:

1. **Understand the centralized channel management pattern** - SyncConnectionManager creates and manages channels
2. **Understand the shared channel dispatch pattern** - All connections for a whiteboard share one channel
3. **Respect sender ID isolation** - Different components must maintain separate sender IDs despite shared channels
4. **Never bypass centralized management** - Don't create channels in Connection constructor
5. **Never add updateConfig functionality** - This breaks the filtering logic
6. **Test with multiple components** - Ensure Teacher1 and Student1 can coexist with shared channels
7. **Check operation filtering** - Verify operations don't echo back to their senders with centralized dispatch
8. **Verify channel lifecycle** - Ensure channels are properly cleaned up when no longer needed

### ⚠️ DO NOT MODIFY TABLET ARCHITECTURE WITHOUT UNDERSTANDING EVENT SYSTEM CONFLICTS
The tablet support system has been carefully designed to prevent event system conflicts and ensure optimal stylus support. Before making ANY changes to tablet-related files:

1. **Understand the event system selection logic** - Only one event system should be active
2. **Respect stylus priority** - Pen input must ALWAYS take precedence over touch
3. **Never bypass palm rejection** - Stylus devices require palm rejection for usability
4. **Test on actual tablet devices** - Desktop testing cannot replicate tablet behavior
5. **Verify text selection prevention** - Multiple layers must work together
6. **Check Safari optimizations** - iPad-specific fixes are critical for performance
7. **Use debugging utilities** - Tablet issues are complex and require proper debugging
8. **Validate configuration changes** - Use built-in validation before deploying changes

### Files That Require Expert-Level Understanding (Updated for Centralized Architecture):
- **`src/utils/sync/SyncConnectionManager.ts`** - CRITICAL: Centralized channel management and payload dispatch
- **`src/utils/sync/Connection.ts`** - CRITICAL: Shared channel handling and filtering
- **`src/hooks/tablet/useTabletEventHandling.ts`** - CRITICAL: Central tablet coordinator and event system selection
- **`src/hooks/tablet/usePalmRejection.ts`** - CRITICAL: Palm rejection algorithm and stylus prioritization
- `src/hooks/useSyncState.ts`
- `src/hooks/useRemoteOperationHandler.ts`
- `src/hooks/shared/useSharedOperationsCoordinator.ts`
- `src/hooks/useStageEventHandlers.ts`

**If you must modify these files, document exactly why the change is necessary and how it preserves both the sender ID filtering logic AND the centralized channel management pattern AND the tablet event system integrity.**

### Real-time Connection Debugging (Updated)
The centralized architecture helps resolve many cross-browser/cross-context real-time issues by:

- **Consistent Channel Management**: All contexts use the same channel creation logic
- **Centralized Debugging**: All payload dispatch happens in one place
- **Better Error Handling**: Channel subscription errors are handled centrally

**Common debugging steps for real-time issues:**
```typescript
// Check if channel is properly created and subscribed
const channel = this.channels.get(channelName);
console.log('Channel state:', channel?.state); // Should be 'joined'

// Verify centralized dispatch is working
debugLog('Manager', 'Received payload from channel:', payload);

// Check connection filtering after dispatch
debugLog('Dispatch', `Operation from: ${operation.sender_id}, local: ${this.originalConfig.senderId}`);
```

### Tablet-Specific Debugging Patterns
**Common debugging steps for tablet issues:**
```typescript
// Check tablet capability detection
window.tabletDebugger.detectCapabilities();

// Verify event system selection
const strategy = tabletEventHandling.eventStrategy;
console.log('Event strategy:', strategy);

// Monitor palm rejection in real-time
window.enableDebug('palmRejection');
const status = palmRejection.getStatus();
console.log('Palm rejection status:', status);

// Validate tablet configuration
const validation = window.tabletConfig.validate(currentConfig);
console.log('Config validation:', validation);
```
