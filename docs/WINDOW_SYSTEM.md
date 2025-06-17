
# Window System Documentation

## Overview

The window system provides a split-view interface where teachers can monitor student boards in a separate window while maintaining their main whiteboard in the original browser window.

## Architecture

### Split View Components

**StudentBoardsWindow**
- Creates a portal-based separate window
- Manages window lifecycle (creation/cleanup)
- Renders student boards grid in isolated container

**WindowContentRenderer**
- Portal implementation using React's `createPortal`
- Renders content into dynamically created DOM container
- Handles window-specific event management

**WindowContentHeader**
- Simplified header for window controls
- Layout selector and grid orientation
- Window collapse/expand functionality

**WindowContentBody**
- Contains the student boards grid
- Pagination controls
- Maximization/minimization handling

### Window State Management

**useWindowContentState**
```typescript
{
  isHeaderCollapsed: boolean;
  maximizedBoard: string | null;
  toggleHeaderCollapse: () => void;
  handleMaximize: (boardId: string, callback: Function) => void;
  handleMinimize: () => void;
}
```

## Implementation Details

### Portal Creation

```typescript
// StudentBoardsWindow.tsx
useEffect(() => {
  const container = document.createElement('div');
  container.id = 'student-boards-window';
  document.body.appendChild(container);
  setWindowContainer(container);

  return () => {
    document.body.removeChild(container);
  };
}, []);
```

### Content Rendering

```typescript
// WindowContentRenderer.tsx
return createPortal(
  <div className="flex-1 bg-gray-100 flex flex-col">
    <WindowContentHeader {...headerProps} />
    <WindowContentBody {...bodyProps} />
  </div>,
  container
);
```

## User Interface

### Window Controls

**Header Controls**:
- Layout selector dropdown
- Grid orientation toggle (columns/rows first)
- Collapse/expand header button
- Close split view button

**Navigation**:
- Page navigation (when multiple pages)
- Student count display
- Layout information

**Responsive Behavior**:
- Header auto-hide on hover when collapsed
- Smooth transitions for all state changes
- Hover zones for collapsed header access

### Visual Design

**Styling Approach**:
- Consistent with main application theme
- Tailwind CSS for responsive design
- Smooth animations for state transitions

**Layout Structure**:
```
┌─────────────────────────────────┐
│ Window Header (collapsible)     │
├─────────────────────────────────┤
│                                 │
│    Student Boards Grid          │
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│  │  A  │ │  B  │ │  C  │ │  D  │ │
│  └─────┘ └─────┘ └─────┘ └─────┘ │
│                                 │
│  [Navigation Controls]          │
└─────────────────────────────────┘
```

## State Synchronization

### Props Flow

**From TeacherSessionView**:
- Student data and status
- Layout configuration
- Page state and navigation
- Maximization state

**To Window Components**:
- Real-time student board updates
- Layout changes propagated instantly
- Synchronized pagination state

### Event Handling

**Window-Specific Events**:
- Header collapse/expand
- Board maximization within window
- Layout and orientation changes
- Page navigation

**Cross-Window Communication**:
- Maximization state shared between windows
- Student board updates synchronized
- Session state consistency maintained

## Performance Considerations

### Efficient Rendering

**Portal Optimization**:
- Single DOM container per window
- Minimal re-renders through careful prop passing
- Efficient cleanup on window close

**State Management**:
- Isolated window state prevents conflicts
- Shared state only for necessary synchronization
- Optimized re-render cycles

### Memory Management

**Container Lifecycle**:
```typescript
// Proper cleanup prevents memory leaks
useEffect(() => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  return () => {
    document.body.removeChild(container);
  };
}, []);
```

## Integration Points

### TeacherSessionView Integration

**Split View Toggle**:
- Seamless transition between modes
- State preservation during switches
- Consistent data flow patterns

**Layout Calculations**:
- Same layout engine for both modes
- Consistent student board arrangement
- Synchronized pagination logic

### Whiteboard Integration

**Student Board Rendering**:
- Individual WhiteboardPlaceholder components
- Collaborative state management
- Real-time updates from students

**Event Propagation**:
- Click events for maximization
- Touch/pointer events for interaction
- Keyboard navigation support

## Error Handling

### Common Issues

**Portal Creation Failures**:
- Fallback to inline rendering
- Error boundary protection
- User notification of issues

**State Synchronization Problems**:
- Retry mechanisms for failed updates
- Fallback state recovery
- Graceful degradation

### Recovery Strategies

**Window System Failures**:
- Automatic fallback to normal mode
- State preservation during recovery
- User notification and guidance

## Future Enhancements

### Potential Improvements

**Multi-Window Support**:
- Multiple student board windows
- Flexible window arrangements
- Cross-window drag and drop

**Enhanced Controls**:
- Window resizing capabilities
- Picture-in-picture mode
- Customizable layouts

**Performance Optimizations**:
- Virtual scrolling for large student counts
- Lazy loading of inactive boards
- Optimized rendering pipelines
