# Original Select Tool Dependencies Analysis - Phase 1

## Overview
This document maps all dependencies and usage of the original select tool in the codebase, as part of Phase 1 of the safe removal plan.

## Core Components

### 1. Selection State Management
- **File**: `src/hooks/useSelectionState.ts`
- **Purpose**: Main state management for original selection system
- **Key Features**: 
  - Manages `selectedObjects`, `selectionBounds`, `isSelecting`, `transformationData`
  - Object pooling for performance
  - Selection bounds calculation
  - Transformation data tracking
- **Dependencies**: Used by 4 files (useWhiteboardState.ts, useSharedWhiteboardCore.ts, etc.)

### 2. Visual Selection Components
- **File**: `src/components/canvas/SelectionGroup.tsx`
- **Purpose**: Renders grouped selected objects with transformers
- **Key Features**:
  - Shows selection for `currentTool === 'select'` (different behavior from select2)
  - Only shows for multiple objects (>1) when using original select
  - Provides dragging capability via `isDraggable = currentTool === 'select'`
  - Renders transformers for original select tool
- **Used in**: KonvaStage.tsx, LinesLayer.tsx

- **File**: `src/components/canvas/SelectionRect.tsx`
- **Purpose**: Drag-to-select rectangle visualization
- **Shared Usage**: Used by BOTH original select and select2 tools
- **Used in**: LinesLayer.tsx, Select2Renderer.tsx

- **File**: `src/components/canvas/GroupTransformer.tsx`
- **Purpose**: Provides transformation handles for selected groups
- **Usage**: Only referenced in SelectionGroup.tsx

### 3. Selection Background Component
- **File**: `src/components/canvas/SelectionGroupBackground.tsx`
- **Purpose**: Background rect for selection groups
- **Usage**: Only used by SelectionGroup.tsx

## Integration Points

### 1. Main Whiteboard State
- **File**: `src/hooks/useWhiteboardState.ts`
- **Integration**: `const selection = useSelectionState();`
- **Impact**: Core whiteboard state depends on original selection state

### 2. Shared Whiteboard Core
- **File**: `src/hooks/shared/useSharedWhiteboardCore.ts`
- **Integration**: `const selection = useSelectionState();`
- **Impact**: Shared/sync system uses original selection state

### 3. Stage Event Handlers
- **File**: `src/hooks/useStageEventHandlers.ts`
- **Integration**: Routes tool events to appropriate handlers
- **Tool Routing**: Uses `currentTool === 'select'` checks
- **Touch Action**: Sets `touchAction = 'manipulation'` for select tool

### 4. Canvas Rendering
- **File**: `src/components/canvas/KonvaStageCanvas.tsx`
- **Integration**: Renders selection components based on tool
- **Usage**: Uses `useStageCursor` with selection state

- **File**: `src/components/canvas/layers/LinesLayer.tsx`
- **Integration**: Renders SelectionGroup and SelectionRect
- **Conditional**: Shows SelectionGroup when selection state has objects

### 5. Konva Stage
- **File**: `src/components/canvas/KonvaStage.tsx`
- **Integration**: Manages both select and select2 tools
- **Conditional Logic**: Different rendering paths for each tool

## Object Renderers Integration

### 1. Line Renderer
- **File**: `src/components/canvas/LineRenderer.tsx`
- **Integration**: 
  - `isSelected && (currentTool === 'select' || currentTool === 'select2')`
  - `draggable={(currentTool === 'select' || currentTool === 'select2') && isSelected}`
  - `listening={currentTool === 'select'}` (different from select2)

### 2. Image Renderer  
- **File**: `src/components/canvas/ImageRenderer.tsx`
- **Integration**:
  - Same pattern as LineRenderer
  - `listening={currentTool === 'select'}` (different from select2)

### 3. Lines List
- **File**: `src/components/canvas/layers/LinesList.tsx` 
- **Integration**: `onSelect={currentTool === 'select' ? ... : undefined}`

## Event Handling Integration

### 1. Main Pointer Handlers
- **File**: `src/hooks/useWhiteboardPointerHandlers.ts`
- **Integration**: `stableCurrentTool === 'select'` routing
- **Dependency**: Uses `panZoom.isGestureActive()` check
- **Selection Logic**: Handles selection bounds, object selection, drag-to-select

### 2. Shared Pointer Handlers
- **File**: `src/hooks/shared/useSharedPointerHandlers.ts`
- **Integration**: Similar logic to main pointer handlers
- **Usage**: Used in shared/sync contexts

### 3. Touch-to-Selection Bridge
- **File**: `src/hooks/eventHandling/useTouchToSelectionBridge.ts`
- **Integration**: `effectiveTool === 'select'` checks
- **Purpose**: Bridges touch events to selection for original select tool

### 4. Mouse Event Handlers
- **File**: `src/components/canvas/hooks/useMouseEventHandlers.ts`
- **Integration**: `stableCurrentTool === 'select'` routing

### 5. Pointer Event Core
- **File**: `src/hooks/eventHandling/pointerEvents/usePointerEventCore.ts`
- **Integration**: Multiple `currentTool === 'select'` checks

## Keyboard Handlers

### 1. Konva Keyboard Handlers
- **File**: `src/hooks/canvas/useKonvaKeyboardHandlers.ts`
- **Integration**: 
  - `state.currentTool === 'select'` for Ctrl+A (select all)
  - Different delete logic for select vs select2
  - Uses `originalSelectDeleteFunction` vs `select2DeleteFunction`

## UI/Toolbar Integration

### 1. Movable Toolbar
- **File**: `src/components/MovableToolbar.tsx`
- **Integration**: 
  - `<ToolButton>` with `isActive={currentTool === 'select'}`
  - Separate button from select2: `isActive={currentTool === 'select2'}`

### 2. Tool Button Component
- **File**: `src/components/toolbar/ToolButton.tsx`
- **Usage**: Used by MovableToolbar for tool selection

### 3. Stage Cursor
- **File**: `src/components/canvas/hooks/useStageCursor.ts`
- **Integration**: `currentTool === 'select' && selection?.hoveredObjectId`

## Performance and Optimization

### 1. Selection Object Pooling
- **File**: `src/hooks/performance/useSelectionObjectPooling.ts`
- **Purpose**: Performance optimization for selection operations
- **Usage**: Used by useSelectionState.ts

### 2. Layer Optimization
- **File**: `src/components/canvas/layers/LayerOptimizationHandler.tsx`
- **Integration**: Considers `isSelecting` state for optimization

## Pan/Zoom Integration

### 1. Touch Handlers
- **File**: `src/hooks/panZoom/useTouchHandlers.ts`
- **Integration**: `shouldBeSelection: currentTool === 'select'`

## Context Menu Integration

### 1. Image Context Menu
- **File**: `src/components/canvas/KonvaImageOperationsHandler.tsx`
- **Integration**: `state.currentTool === 'select'` checks for interaction

## Export/Import Integration

### 1. Component Index
- **File**: `src/components/index.ts`
- **Exports**: SelectionGroup, SelectionRect, GroupTransformer

### 2. Hooks Index  
- **File**: `src/hooks/index.ts`
- **Exports**: useSelectionState, useGroupTransform

## Summary of Dependencies

### Critical Dependencies (Must be addressed before removal):
1. **useSelectionState.ts** - Used by core whiteboard state
2. **SelectionGroup.tsx** - Visual selection rendering  
3. **Toolbar integration** - Select tool button
4. **Event routing** - All pointer/touch/mouse handlers
5. **Object renderers** - Line/Image selection logic

### Shared Components (Used by both tools):
1. **SelectionRect.tsx** - Can remain, used by select2
2. **Coordinate transformation** - Shared utilities

### Tool-Specific Logic:
1. **Selection behavior differences** between select and select2
2. **Dragging logic** - Different between tools
3. **Transformer visibility** - Only select shows for >1 objects

## Next Steps for Phase 2
1. Identify exact behavioral differences between select and select2
2. Plan migration of unique select features to select2
3. Create feature flag for gradual transition
4. Map testing requirements for each integration point

## Risk Assessment
- **HIGH**: Core state management (useSelectionState)
- **HIGH**: Event routing system
- **MEDIUM**: Visual components (can be gradually replaced)
- **LOW**: Toolbar buttons (easy to update)