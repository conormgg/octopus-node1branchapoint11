# Touch Selection Implementation

This document describes the implementation of touch-based selection rectangles for tablets, specifically addressing the issue where single-finger touches couldn't create selection rectangles when using the select tool.

## Problem

Previously, selection rectangles didn't work with single-finger touches on tablets because:

1. **Event Routing Conflict**: Single-finger touches were intercepted by the pan/zoom system instead of being routed to selection logic
2. **Duplicate Events**: Both pointer and touch events were being processed, causing conflicts and console spam
3. **Tool Awareness**: The event system wasn't contextually aware of which tool was active

## Solution Overview

The implementation follows a 5-phase approach:

### Phase 1: Fix Touch Event Routing ✅
- Modified `useTouchHandlers.ts` to prevent single-finger pan when 'select' tool is active
- Updated touch event handlers to be tool-aware
- Enhanced CSS `touch-action` management based on active tool

### Phase 2: Implement Touch-to-Selection Bridge ✅
- Created `useTouchToSelectionBridge.ts` to convert touch events to selection coordinates
- Routes single-finger touches to selection logic when 'select' tool is active
- Maintains existing pointer event logic for consistency

### Phase 3: Fix Event Deduplication ✅
- Created `useEventDeduplication.ts` to prevent duplicate event processing
- Implements event source prioritization (pointer > touch > mouse)
- Reduces console log spam from duplicate events

### Phase 4: Add Tool-Aware Event Routing ✅
- Enhanced event handlers to route gestures based on active tool:
  - **Pan gestures**: Available for all tools except 'select' (unless multi-touch)
  - **Selection gestures**: Only available when tool is 'select'
  - **Drawing gestures**: Only available when tool is drawing tools

### Phase 5: Testing & Verification 🧪
- Verify selection rectangles work on tablets with finger touch
- Ensure pan still works with multi-touch
- Test drawing tools still work correctly
- Verify no duplicate event processing

## Key Files Modified

1. **`src/hooks/panZoom/useTouchHandlers.ts`** - Tool-aware touch routing
2. **`src/hooks/eventHandling/useTouchEventHandlers.ts`** - Enhanced touch event handling
3. **`src/hooks/useStageEventHandlers.ts`** - Tool tracking and CSS management
4. **`src/hooks/usePanZoom.ts`** - Updated to pass tool information

## New Files Created

1. **`src/hooks/eventHandling/useTouchToSelectionBridge.ts`** - Touch-to-selection conversion
2. **`src/hooks/eventHandling/useEventDeduplication.ts`** - Event deduplication logic

## Technical Details

### Touch-to-Selection Bridge

The bridge works by:
1. Detecting single-finger touches when 'select' tool is active
2. Converting touch coordinates to stage coordinates
3. Routing to existing pointer handlers (`handlePointerDown`, `handlePointerMove`, `handlePointerUp`)
4. Preventing pan/zoom from processing the same touch events

### Event Deduplication

The deduplication system:
1. Tracks recent events with timestamps and sources
2. Applies source prioritization to prevent lower-priority duplicates
3. Maintains a sliding window of recent events for comparison
4. Reduces console spam while preserving debugging capabilities

### Tool-Aware Routing

The routing logic determines event handling based on:
- **Current tool**: Different tools enable different gesture types
- **Touch count**: Single vs multi-touch for different behaviors
- **Event source**: Pointer events take priority over touch events

## Testing Guidelines

To test the implementation:

1. **Selection Rectangles**: 
   - Switch to select tool
   - Use single finger on tablet to drag and create selection rectangle
   - Verify objects within rectangle get selected

2. **Multi-touch Pan/Zoom**:
   - Use two fingers to pan and zoom
   - Should work regardless of active tool

3. **Drawing Tools**:
   - Switch to pencil/highlighter/eraser
   - Single finger should draw, not pan
   - Multi-touch should still pan/zoom

4. **Console Logs**:
   - Check for reduced duplicate event warnings
   - Events should be properly prioritized

## Future Improvements

- Add haptic feedback for selection rectangle completion
- Implement pressure sensitivity for selection threshold
- Add gesture recognition for multi-select operations
- Consider voice commands for accessibility