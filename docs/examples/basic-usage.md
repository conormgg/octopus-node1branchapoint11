
# Basic Usage Examples

## Simple Whiteboard

```tsx
import { Whiteboard } from '@/components';

function SimpleApp() {
  return (
    <div className="w-full h-screen">
      <Whiteboard width={800} height={600} />
    </div>
  );
}
```

## Collaborative Whiteboard

```tsx
import { SyncWhiteboard } from '@/components';
import { SyncConfig } from '@/types';

function CollaborativeApp() {
  const syncConfig: SyncConfig = {
    whiteboardId: 'classroom-session-1',
    userId: 'user-123',
    userName: 'John Doe',
    isReceiveOnly: false, // Set to true for read-only participants
  };

  return (
    <div className="w-full h-screen">
      <SyncWhiteboard 
        syncConfig={syncConfig}
        width={800} 
        height={600} 
        palmRejectionConfig={{
          enabled: true,
          maxContactSize: 40,
          minPressure: 0.1,
          palmTimeoutMs: 500
        }}
      />
    </div>
  );
}
```

## Custom Hook Usage

```tsx
import { useWhiteboardState } from '@/hooks';

function CustomWhiteboard() {
  const {
    state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    undo,
    redo,
    canUndo,
    canRedo
  } = useWhiteboardState();

  return (
    <div>
      <div className="toolbar">
        <button onClick={undo} disabled={!canUndo}>Undo</button>
        <button onClick={redo} disabled={!canRedo}>Redo</button>
        <span>Current tool: {state.currentTool}</span>
      </div>
      
      <div 
        className="canvas-container"
        onPointerDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onPointerUp={handlePointerUp}
      >
        {/* Your custom canvas implementation */}
      </div>
    </div>
  );
}
```

## Teacher Session Setup

```tsx
import { TeacherView } from '@/components';
import { useSessionManagement } from '@/hooks';

function TeacherApp() {
  const { 
    activeSession, 
    handleEndSession 
  } = useSessionManagement();

  if (!activeSession) {
    return <div>No active session</div>;
  }

  return (
    <TeacherView 
      activeSession={activeSession}
      onEndSession={handleEndSession}
      onSignOut={() => console.log('Sign out')}
    />
  );
}
```

## Event Handling Customization

```tsx
import { useStageEventHandlers } from '@/hooks';

function CustomEventHandling() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  useStageEventHandlers({
    containerRef,
    stageRef,
    panZoomState: { x: 0, y: 0, scale: 1 },
    palmRejection: usePalmRejection({
      enabled: true,
      maxContactSize: 40
    }),
    palmRejectionConfig: { enabled: true },
    panZoom: usePanZoom(),
    handlePointerDown: (x, y) => console.log('Pointer down', x, y),
    handlePointerMove: (x, y) => console.log('Pointer move', x, y),
    handlePointerUp: () => console.log('Pointer up'),
    isReadOnly: false
  });

  return (
    <div ref={containerRef}>
      {/* Your canvas content */}
    </div>
  );
}
```
