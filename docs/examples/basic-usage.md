
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

## Real-time Sync Direction Handling

```tsx
import { useSyncDirectionBroadcastListener } from '@/hooks';

function StudentViewWithBroadcastSync() {
  const [overrideSyncDirection, setOverrideSyncDirection] = useState<SyncDirection | null>(null);
  
  // Listen for sync direction broadcasts from teacher
  useSyncDirectionBroadcastListener(
    sessionId,
    (participantId, newDirection, boardSuffix) => {
      if (participantId === currentParticipant.id) {
        setOverrideSyncDirection(newDirection);
        console.log('Sync direction updated via broadcast:', newDirection);
      }
    }
  );

  const effectiveSyncDirection = overrideSyncDirection || participant.sync_direction;
  const isReadOnly = effectiveSyncDirection === 'teacher_active';

  return (
    <SyncWhiteboard 
      syncConfig={syncConfig}
      isReadOnly={isReadOnly}
      // Toolbar automatically hidden when teacher is in control
    />
  );
}
```

## Database Real-time Subscriptions

```tsx
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

function StudentRealtimeUpdates() {
  const [operations, setOperations] = useState([]);

  useEffect(() => {
    // Subscribe to teacher's main board updates (anonymous access)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public', 
        table: 'whiteboard_data',
        filter: `session_id=eq.${sessionId}&board_id=eq.teacher-main`
      }, (payload) => {
        console.log('Received teacher update:', payload.new);
        const operation = convertToWhiteboardOperation(payload.new);
        handleTeacherOperation(operation);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return (
    <div>
      <h3>Receiving live updates from teacher</h3>
      {/* Your whiteboard component */}
    </div>
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

## Debug Logging for Real-time Features

```tsx
import { createDebugLogger } from '@/utils/debug/debugConfig';

function DebuggingRealtime() {
  const debugLog = createDebugLogger('sync');

  // Debug broadcast reception
  useSyncDirectionBroadcastListener(sessionId, (participantId, direction, boardSuffix) => {
    debugLog('broadcast-received', `Participant ${participantId} -> ${direction} for ${boardSuffix}`);
  });

  // Debug real-time subscription  
  useEffect(() => {
    const channel = supabase.channel('schema-db-changes');
    
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'whiteboard_data'
    }, (payload) => {
      debugLog('realtime-received', `Operation: ${payload.new.action_type} from ${payload.new.user_id}`);
    });

    debugLog('realtime-setup', `Subscribed to real-time updates for session ${sessionId}`);
    
    return () => supabase.removeChannel(channel);
  }, [sessionId]);

  return <div>Check console for real-time debug logs</div>;
}
```
