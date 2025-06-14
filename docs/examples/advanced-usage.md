
# Advanced Usage Examples

## Custom Event Handling

```tsx
import { useStageEventHandlers, usePalmRejection, usePanZoom } from '@/hooks';
import { WhiteboardState } from '@/types';

function CustomWhiteboardWithAdvancedEvents() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [state, setState] = useState<WhiteboardState>(/* initial state */);

  // Configure palm rejection for stylus input
  const palmRejection = usePalmRejection({
    enabled: true,
    maxContactSize: 40,        // Reject touches larger than 40px
    minPressure: 0.1,          // Require minimum pressure for stylus
    palmTimeoutMs: 500         // Timeout for palm detection
  });

  // Set up pan/zoom with custom bounds
  const panZoom = usePanZoom(state.panZoomState, (newState) => {
    setState(prev => ({ ...prev, panZoomState: newState }));
  });

  // Configure event handlers with all options
  useStageEventHandlers({
    containerRef,
    stageRef,
    panZoomState: state.panZoomState,
    palmRejection,
    palmRejectionConfig: { enabled: true },
    panZoom,
    handlePointerDown: (x, y) => {
      console.log(`Drawing started at ${x}, ${y}`);
      // Your drawing logic here
    },
    handlePointerMove: (x, y) => {
      // Your drawing continuation logic
    },
    handlePointerUp: () => {
      console.log('Drawing finished');
      // Finalize drawing
    },
    isReadOnly: false
  });

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage ref={stageRef} width={800} height={600}>
        {/* Your Konva layers */}
      </Stage>
    </div>
  );
}
```

## Session Management Patterns

```tsx
import { useSessionManagement, useAuth } from '@/hooks';
import { Session } from '@/types';

function TeacherSessionManager() {
  const { user } = useAuth();
  const {
    activeSession,
    recentSessions,
    createSession,
    endSession,
    resumeSession
  } = useSessionManagement(user);

  // Create a new session with custom configuration
  const handleCreateSession = async (sessionData: {
    title: string;
    studentNames: string[];
    description?: string;
  }) => {
    const session = await createSession({
      title: sessionData.title,
      description: sessionData.description,
      studentNames: sessionData.studentNames,
      // Optional: Add custom whiteboard templates
      templateId: 'custom-template-id'
    });

    if (session) {
      console.log(`Session created: ${session.url}`);
      // Session is now active and students can join
    }
  };

  // Handle session lifecycle
  const handleEndSession = async () => {
    if (activeSession) {
      await endSession(activeSession.id);
      console.log('Session ended, students disconnected');
    }
  };

  return (
    <div>
      {activeSession ? (
        <ActiveSessionView 
          session={activeSession}
          onEndSession={handleEndSession}
        />
      ) : (
        <SessionCreationForm onCreateSession={handleCreateSession} />
      )}
    </div>
  );
}
```

## State Synchronization

```tsx
import { useSharedWhiteboardState } from '@/hooks';
import { SyncConfig } from '@/types';

function CollaborativeWhiteboard({ sessionId, userId, userName }: {
  sessionId: string;
  userId: string;
  userName: string;
}) {
  const syncConfig: SyncConfig = {
    whiteboardId: `session-${sessionId}`,
    userId,
    userName,
    sessionId,
    isReceiveOnly: false, // Set to true for read-only participants
  };

  const {
    state,
    syncState,
    setTool,
    setColor,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    undo,
    redo,
    canUndo,
    canRedo,
    selection,
    deleteSelectedObjects
  } = useSharedWhiteboardState(syncConfig);

  // Handle real-time sync status
  useEffect(() => {
    if (syncState?.connectionState === 'connected') {
      console.log('Connected to real-time sync');
    } else if (syncState?.connectionState === 'disconnected') {
      console.log('Disconnected from sync, changes will be local only');
    }
  }, [syncState?.connectionState]);

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b">
        <button 
          onClick={() => setTool('pencil')}
          className={state.currentTool === 'pencil' ? 'bg-blue-500 text-white' : ''}
        >
          Pencil
        </button>
        <button 
          onClick={() => setTool('eraser')}
          className={state.currentTool === 'eraser' ? 'bg-blue-500 text-white' : ''}
        >
          Eraser
        </button>
        <input
          type="color"
          value={state.currentColor}
          onChange={(e) => setColor(e.target.value)}
        />
        <button onClick={undo} disabled={!canUndo}>Undo</button>
        <button onClick={redo} disabled={!canRedo}>Redo</button>
        <button 
          onClick={deleteSelectedObjects}
          disabled={selection.selectionState.selectedObjects.length === 0}
        >
          Delete Selected
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <SyncWhiteboard 
          syncConfig={syncConfig}
          width={800}
          height={600}
        />
      </div>

      {/* Status */}
      <div className="p-2 bg-gray-100 text-sm">
        Status: {syncState?.connectionState || 'local'}
        {syncState?.lastSyncTime && (
          <span className="ml-4">
            Last sync: {new Date(syncState.lastSyncTime).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
```

## Custom Tool Implementation

```tsx
import { useWhiteboardState } from '@/hooks';
import { Tool, LineObject } from '@/types';

function CustomToolWhiteboard() {
  const {
    state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    setTool
  } = useWhiteboardState();

  // Implement a custom "shape" tool
  const handleShapeToolPointerDown = (x: number, y: number) => {
    if (state.currentTool === 'shape') {
      // Create a rectangle shape
      const newShape: LineObject = {
        id: `shape-${Date.now()}`,
        tool: 'pencil', // Use pencil tool as base
        points: [x, y, x + 50, y, x + 50, y + 50, x, y + 50, x, y], // Rectangle
        color: state.currentColor,
        strokeWidth: state.currentStrokeWidth,
        isComplete: true
      };

      // Add shape to state (you'd need to extend the state management)
      console.log('Adding custom shape:', newShape);
    } else {
      // Use default pointer handling for other tools
      handlePointerDown(x, y);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <button onClick={() => setTool('pencil')}>Pencil</button>
        <button onClick={() => setTool('eraser')}>Eraser</button>
        <button onClick={() => setTool('shape' as Tool)}>Shape</button>
      </div>
      
      <div 
        className="canvas-area"
        onPointerDown={(e) => handleShapeToolPointerDown(e.clientX, e.clientY)}
        onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
        onPointerUp={handlePointerUp}
      >
        {/* Your canvas implementation */}
      </div>
    </div>
  );
}
```

## Error Handling and Recovery

```tsx
import { useSharedWhiteboardState } from '@/hooks';
import { useToast } from '@/hooks/use-toast';

function ResilientWhiteboard({ syncConfig }: { syncConfig: SyncConfig }) {
  const { toast } = useToast();
  const whiteboard = useSharedWhiteboardState(syncConfig);

  // Handle sync errors
  useEffect(() => {
    if (whiteboard.syncState?.error) {
      toast({
        title: "Sync Error",
        description: "Connection lost. Changes will be saved locally.",
        variant: "destructive",
      });
    }
  }, [whiteboard.syncState?.error]);

  // Auto-recovery for connection issues
  useEffect(() => {
    const checkConnection = () => {
      if (whiteboard.syncState?.connectionState === 'disconnected') {
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          // Reconnection logic would be handled by the sync system
        }, 5000);
      }
    };

    checkConnection();
  }, [whiteboard.syncState?.connectionState]);

  return (
    <div>
      {whiteboard.syncState?.connectionState === 'disconnected' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Connection lost. Working in offline mode.
        </div>
      )}
      
      <SyncWhiteboard syncConfig={syncConfig} width={800} height={600} />
    </div>
  );
}
```

## Performance Optimization

```tsx
import { memo, useMemo } from 'react';
import { LineObject, ImageObject } from '@/types';

// Memoize expensive canvas operations
const OptimizedLineRenderer = memo(({ line }: { line: LineObject }) => {
  // Only recalculate path when line data changes
  const pathData = useMemo(() => {
    return line.points.reduce((path, point, index) => {
      if (index === 0) return `M ${point}`;
      if (index % 2 === 0) return `${path} L ${point}`;
      return `${path} ${point}`;
    }, '');
  }, [line.points]);

  return (
    <path
      d={pathData}
      stroke={line.color}
      strokeWidth={line.strokeWidth}
      fill="none"
    />
  );
});

// Virtualize large lists of objects for performance
function VirtualizedCanvas({ lines, images }: {
  lines: LineObject[];
  images: ImageObject[];
}) {
  // Only render visible items based on viewport
  const visibleLines = useMemo(() => {
    // Implement viewport culling here
    return lines.filter(line => {
      // Check if line intersects with visible area
      return true; // Simplified for example
    });
  }, [lines]);

  return (
    <svg>
      {visibleLines.map(line => (
        <OptimizedLineRenderer key={line.id} line={line} />
      ))}
    </svg>
  );
}
```
