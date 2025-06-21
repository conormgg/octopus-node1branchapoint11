
# Tablet Support Architecture

This document outlines the tablet-friendly features implemented in the whiteboard application, focusing on iPad and stylus support.

## Overview

The whiteboard application implements comprehensive tablet support through multiple layers:
- **Palm Rejection System** - Distinguishes between stylus and palm/finger touches
- **Event Handling Strategy** - Coordinates pointer, touch, and mouse events
- **Text Selection Prevention** - Prevents unwanted text selection during drawing
- **iPad/Safari Optimizations** - Specific fixes for Safari browser quirks

## Palm Rejection Architecture

### Core Components

**Location: `src/hooks/usePalmRejection.ts`**
- Main palm rejection algorithm
- Analyzes pointer size, pressure, clustering, and timing
- Always prioritizes stylus/pen input over finger touches

**Location: `src/components/PalmRejectionSettings.tsx`**
- User interface for configuring palm rejection parameters
- Real-time adjustment of sensitivity settings

### Configuration Parameters

```typescript
interface PalmRejectionConfig {
  maxContactSize: number;     // Max contact area for valid touch (default: 40px)
  minPressure: number;        // Min pressure for valid input (default: 0.1)
  palmTimeoutMs: number;      // Ignore period after palm detection (default: 500ms)
  clusterDistance: number;    // Distance to detect clustered touches (default: 100px)
  preferStylus: boolean;      // Always prefer stylus over touch (default: true)
  enabled: boolean;           // Enable/disable palm rejection (default: true)
}
```

### Palm Detection Algorithm

1. **Stylus Priority**: Always allows pen/stylus input regardless of other settings
2. **Contact Size Analysis**: Rejects touches larger than `maxContactSize`
3. **Cluster Detection**: Identifies multiple close touches (palm + fingers)
4. **Temporal Filtering**: Ignores touches for `palmTimeoutMs` after palm detection
5. **Pressure Validation**: Checks minimum pressure thresholds (when available)

## Event Handling Strategy

### Event System Selection

The application uses different event systems based on device capabilities and settings:

**Pointer Events** (Primary - when palm rejection enabled)
- Location: `src/hooks/eventHandling/usePointerEventHandlers.ts`
- Most precise for stylus/touch discrimination
- Provides pressure, contact size, and pointer type information
- Used when: `palmRejectionConfig.enabled && supportsPointerEvents`

**Touch Events** (Fallback)
- Location: `src/hooks/eventHandling/useTouchEventHandlers.ts`
- Compatibility layer for older devices
- Handles pinch-to-zoom and basic touch interactions
- Used when: `!supportsPointerEvents`

**Mouse Events** (Always active)
- Location: `src/components/canvas/hooks/useMouseEventHandlers.ts`
- Handles traditional mouse interactions
- Right-click panning, cursor changes
- Runs alongside pointer/touch events

### Event Coordination

**Location: `src/hooks/useStageEventHandlers.ts`**

The main coordinator prevents duplicate event handling:
```typescript
// Event system selection logic
const usePointerEvents = supportsPointerEvents && palmRejectionConfig.enabled;
const useTouchEvents = !usePointerEvents;
```

### Multi-touch Gesture Handling

**Pinch-to-Zoom**: Detected when 2+ pointers are active
**Pan Gestures**: Single touch or right-click drag
**Drawing Prevention**: Blocks drawing during multi-touch gestures

## Text Selection Prevention

### Multiple Prevention Layers

1. **CSS Properties** (Applied to all drawing containers):
```css
{
  WebkitUserSelect: 'none',
  WebkitTouchCallout: 'none',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'none', /* when palm rejection enabled */
  userSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none'
}
```

2. **Document-level Event Listeners**:
```typescript
// Prevents text selection at document level
document.addEventListener('selectstart', preventDefault);
document.addEventListener('dragstart', preventDefault);
```

3. **Event Prevention on Interaction**:
```typescript
// All pointer/mouse events call preventDefault()
onPointerDown={(e) => e.preventDefault()}
onMouseDown={(e) => e.preventDefault()}
```

### Implementation Locations

- **Whiteboard Container**: `src/components/Whiteboard.tsx`
- **Canvas Container**: `src/components/WhiteboardCanvas.tsx`
- **Konva Stage**: `src/components/canvas/KonvaStage.tsx`
- **Event Handlers**: All pointer event handlers call `preventDefault()`

## iPad/Safari-Specific Optimizations

### Touch Action Configuration

```typescript
// Dynamic touch-action based on palm rejection
const getTouchAction = () => {
  if (palmRejectionConfig.enabled) {
    return 'none'; // Better stylus support
  }
  return 'manipulation'; // Compatibility fallback
};
```

### Safari-Specific CSS

```css
{
  WebkitTextSizeAdjust: 'none',     /* Prevent text scaling */
  WebkitFontSmoothing: 'antialiased' /* Better text rendering */
}
```

### Pointer Event Polyfill Detection

**Location: `src/hooks/eventHandling/usePointerEventDetection.ts`**
- Detects native pointer event support
- Falls back to touch events when not available
- Handles Safari's partial pointer event support

## Common Issues & Debugging

### Issue: Drawing not working with stylus

**Symptoms**: Stylus touches are ignored or treated as pan gestures
**Diagnosis**:
1. Check if palm rejection is enabled
2. Verify pointer events are supported
3. Ensure stylus is detected as `pointerType: 'pen'`

**Debug Steps**:
```javascript
// Enable debug logging
localStorage.setItem('debug', 'events,palmRejection');

// Check pointer event support
console.log('Supports pointer events:', 'PointerEvent' in window);

// Monitor pointer events
container.addEventListener('pointerdown', (e) => {
  console.log('Pointer:', e.pointerType, 'Pressure:', e.pressure);
});
```

### Issue: Text selection still occurring

**Symptoms**: Text gets selected during drawing operations
**Diagnosis**:
1. Check CSS prevention properties are applied
2. Verify event preventDefault() calls
3. Ensure document-level listeners are active

**Debug Steps**:
```javascript
// Check computed styles
const element = document.querySelector('[data-whiteboard-id]');
console.log(getComputedStyle(element).userSelect); // Should be 'none'

// Monitor selection events
document.addEventListener('selectstart', (e) => {
  console.log('Selection attempted:', e.target);
});
```

### Issue: Palm rejection too sensitive/not sensitive enough

**Symptoms**: Valid touches rejected or palm touches accepted
**Diagnosis**:
1. Check palm rejection configuration values
2. Monitor contact size and pressure values
3. Verify cluster detection parameters

**Debug Steps**:
```javascript
// Monitor palm rejection decisions
// Enable debug logging for palmRejection category
localStorage.setItem('debug', 'palmRejection');

// Check contact sizes
container.addEventListener('pointerdown', (e) => {
  console.log('Contact size:', Math.max(e.width, e.height));
  console.log('Pressure:', e.pressure);
});
```

### Issue: Performance problems on tablets

**Symptoms**: Lag, frame drops, or sluggish response
**Diagnosis**:
1. Check if multiple event systems are running simultaneously
2. Verify proper event cleanup on component unmount
3. Monitor for excessive re-renders

**Debug Steps**:
```javascript
// Enable performance monitoring
localStorage.setItem('debug', 'performance');

// Check active event listeners
console.log('Active listeners:', getEventListeners(container));
```

## Configuration Best Practices

### Recommended Settings for Different Use Cases

**Art/Drawing Applications** (High precision required):
```typescript
{
  maxContactSize: 30,      // Stricter palm detection
  minPressure: 0.2,        // Require deliberate pressure
  palmTimeoutMs: 750,      // Longer timeout for complex drawings
  clusterDistance: 80,     // Tighter cluster detection
  preferStylus: true,
  enabled: true
}
```

**Note-taking Applications** (Balance precision and usability):
```typescript
{
  maxContactSize: 40,      // Default balanced settings
  minPressure: 0.1,
  palmTimeoutMs: 500,
  clusterDistance: 100,
  preferStylus: true,
  enabled: true
}
```

**General Touch Applications** (Maximum compatibility):
```typescript
{
  maxContactSize: 60,      // More lenient for finger use
  minPressure: 0.05,
  palmTimeoutMs: 300,
  clusterDistance: 120,
  preferStylus: false,     // Allow finger drawing
  enabled: false           // Disable for finger-first apps
}
```

## Testing Checklist

### Device Testing

- [ ] iPad with Apple Pencil (1st and 2nd generation)
- [ ] iPad with 3rd party stylus
- [ ] Android tablet with active stylus
- [ ] Windows tablet with pen support
- [ ] Desktop with touch screen
- [ ] Desktop with mouse only

### Functionality Testing

- [ ] Stylus drawing works without palm interference
- [ ] Finger touches are handled appropriately
- [ ] Right-click panning works
- [ ] Pinch-to-zoom responds correctly
- [ ] Text selection is completely prevented
- [ ] Settings can be adjusted in real-time
- [ ] Performance is smooth during complex drawings

### Browser Testing

- [ ] Safari on iPad (primary target)
- [ ] Chrome on iPad
- [ ] Chrome on Android
- [ ] Edge on Windows tablet
- [ ] Firefox on desktop with touch

## Troubleshooting Commands

```javascript
// Enable comprehensive debugging
localStorage.setItem('debug', 'events,palmRejection,performance');

// Reset palm rejection state
// (Access through browser console)
window.resetPalmRejection?.();

// Check current configuration
console.log('Palm rejection config:', window.getPalmRejectionConfig?.());

// Force palm rejection on/off
window.setPalmRejection?.(true/false);
```

## Architecture Decision Records

### Why Pointer Events Over Touch Events?

**Decision**: Use pointer events as primary input method when palm rejection is enabled
**Reasoning**:
- Provides `pointerType` to distinguish stylus from finger
- Includes pressure and contact size information
- Better suited for palm rejection algorithms
- Single event model for all input types

### Why Multiple Prevention Layers for Text Selection?

**Decision**: Implement CSS, document, and event-level prevention
**Reasoning**:
- Different browsers handle text selection differently
- CSS alone insufficient for complex interactions
- Event-level prevention catches edge cases
- Document-level provides global fallback

### Why Dynamic Touch Action?

**Decision**: Set `touch-action: none` only when palm rejection enabled
**Reasoning**:
- `touch-action: none` can break accessibility
- Some apps need native touch behaviors
- Palm rejection requires full control over touch events
- Provides escape hatch for compatibility issues
