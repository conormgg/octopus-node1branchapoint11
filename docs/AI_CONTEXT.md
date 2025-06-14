
# AI Context Documentation

## Application Overview

This is **OctoPi Ink**, a collaborative whiteboard application built with React, TypeScript, and Konva. The app supports real-time collaboration between teachers and students in educational settings.

## Core Concepts

### 1. Whiteboard System
- **Canvas**: Uses Konva.js for high-performance 2D graphics
- **Tools**: Pencil, highlighter, eraser, select tool for drawing and manipulation
- **Objects**: Lines (strokes) and Images that can be drawn, selected, and transformed
- **State**: Managed through a centralized whiteboard state system

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

## Key Data Flow

1. **User Input** → Event Handlers → Tool Operations → State Updates → Canvas Rendering
2. **Collaboration** → Supabase Realtime → Operation Handler → State Sync → UI Updates
3. **Session Management** → Database Operations → Context Updates → Component Re-renders

## Critical Files for AI Understanding

1. `src/types/whiteboard.ts` - Core data structures
2. `src/hooks/useWhiteboardState.ts` - Main state management
3. `src/hooks/useStageEventHandlers.ts` - Event coordination
4. `src/components/canvas/KonvaStage.tsx` - Main canvas component
5. `src/hooks/shared/useSharedOperationsCoordinator.ts` - Collaboration logic

## Common Modification Patterns

- **Adding new tools**: Extend Tool enum, add event handlers, update UI
- **Event handling changes**: Modify handlers in `src/hooks/eventHandling/`
- **State changes**: Update whiteboard state types and management hooks
- **UI components**: Add to appropriate canvas layers or toolbar sections
