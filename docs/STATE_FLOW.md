
# State Management and Data Flow

## Whiteboard State Structure

### Core State Objects
```typescript
WhiteboardState {
  lines: LineObject[]        // All drawn strokes
  images: ImageObject[]      // All placed images
  currentTool: Tool          // Active drawing tool
  panZoomState: PanZoomState // Canvas position/scale
  selectionState?: SelectionState // Current selection
}
```

### State Management Flow

1. **Local Operations** (drawing, selecting)
   - User interaction → Event handler → Tool operation → State update
   - Immediate UI feedback for responsiveness

2. **Collaborative Operations** (real-time sync)
   - Local operation → Sync coordinator → Supabase realtime → Remote clients
   - Remote operation → Operation handler → State merge → UI update

3. **History Management** (undo/redo)
   - State changes → History stack → Undo/redo operations → State restoration

## Event Handling Flow

### Input Priority System
1. **Palm Rejection** (if enabled and supported)
   - Pointer events with stylus detection
   - Rejects large contact areas and low pressure

2. **Touch Events** (fallback)
   - Standard touch handling for mobile devices
   - Multi-touch gesture support

3. **Mouse Events** (desktop)
   - Standard mouse interactions
   - Right-click context menus

### Tool-Specific Flows

#### Drawing Tools (Pencil/Highlighter)
```
pointerdown → startDrawing → create new line
pointermove → continueDrawing → update line points
pointerup → stopDrawing → finalize line + history
```

#### Eraser Tool
```
pointerdown → startErasing → find intersecting lines
pointermove → continueErasing → remove intersected lines
pointerup → stopErasing → finalize erasure + history
```

#### Select Tool
```
pointerdown → check for objects → select/start drag selection
pointermove → update selection bounds → highlight objects
pointerup → finalize selection → enable transformations
```

## Sync Operation Flow

### Local to Remote
1. User performs operation (draw, erase, etc.)
2. Operation serialized to sync payload
3. Sent via Supabase realtime channel
4. Other clients receive and apply operation

### Remote to Local
1. Receive operation from Supabase realtime
2. Deserialize operation payload
3. Apply to local state (bypassing local handlers)
4. Update UI to reflect changes

## Critical State Considerations

- **Race Conditions**: Operations are timestamped and ordered
- **Conflict Resolution**: Last-write-wins for simplicity
- **State Consistency**: All clients eventually converge to same state
- **Performance**: Only send incremental changes, not full state
