
# Integration Guide

## Adding OctoPi Ink to Your Application

### Quick Start

```bash
# Install dependencies
npm install konva react-konva @supabase/supabase-js

# Add to your React app
import { Whiteboard, useWhiteboardState } from '@/components';
```

### Basic Integration

```tsx
import { Whiteboard } from '@/components';

function App() {
  return (
    <div className="w-full h-screen">
      <Whiteboard 
        width={window.innerWidth} 
        height={window.innerHeight} 
      />
    </div>
  );
}
```

### Collaborative Integration

```tsx
import { SyncWhiteboard } from '@/components';
import { SyncConfig } from '@/types';

function CollaborativeApp() {
  const syncConfig: SyncConfig = {
    whiteboardId: 'my-whiteboard-id',
    userId: 'current-user-id',
    userName: 'User Name',
    sessionId: 'session-id', // Optional: for classroom sessions
    isReceiveOnly: false // Set to true for read-only mode
  };

  return (
    <SyncWhiteboard 
      syncConfig={syncConfig}
      width={800} 
      height={600}
      palmRejectionConfig={{
        enabled: true,
        maxContactSize: 40,
        minPressure: 0.1
      }}
    />
  );
}
```

## Customization Options

### Custom Toolbar

```tsx
import { useWhiteboardState } from '@/hooks';
import { Tool } from '@/types';

function CustomToolbar() {
  const { state, setTool, setColor, setStrokeWidth } = useWhiteboardState();

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100">
      {(['pencil', 'highlighter', 'eraser', 'select'] as Tool[]).map(tool => (
        <button
          key={tool}
          onClick={() => setTool(tool)}
          className={`px-3 py-1 rounded ${
            state.currentTool === tool ? 'bg-blue-500 text-white' : 'bg-white'
          }`}
        >
          {tool}
        </button>
      ))}
      
      <input
        type="color"
        value={state.currentColor}
        onChange={(e) => setColor(e.target.value)}
        className="w-10 h-8"
      />
      
      <input
        type="range"
        min="1"
        max="20"
        value={state.currentStrokeWidth}
        onChange={(e) => setStrokeWidth(Number(e.target.value))}
        className="w-20"
      />
    </div>
  );
}
```

### Custom Event Handling

```tsx
import { useStageEventHandlers } from '@/hooks';

function CustomWhiteboard() {
  const eventHandlers = useStageEventHandlers({
    // ... configuration
    handlePointerDown: (x, y) => {
      console.log('Custom pointer down handling');
      // Your custom logic
    }
  });

  // Component implementation
}
```

## Teacher Dashboard Integration

### Session Management

```tsx
import { TeacherDashboard, useAuth } from '@/components';

function TeacherApp() {
  return (
    <div className="min-h-screen">
      <TeacherDashboard />
    </div>
  );
}
```

### Custom Session Creation

```tsx
import { useSessionManagement } from '@/hooks';

function CustomSessionCreator() {
  const { createSession } = useSessionManagement(user);

  const handleCreate = async () => {
    const session = await createSession({
      title: 'Math Class',
      description: 'Algebra practice session',
      studentNames: ['Alice', 'Bob', 'Charlie'],
      duration: 60, // minutes
      maxStudents: 30
    });

    if (session) {
      console.log(`Session URL: ${session.url}`);
    }
  };

  return (
    <button onClick={handleCreate}>
      Create Session
    </button>
  );
}
```

## Authentication Integration

### Custom Auth Provider

```tsx
import { useAuth } from '@/hooks';

function AuthenticatedApp() {
  const { user, signIn, signOut } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button 
          onClick={() => signIn('email@example.com', 'password')}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div>
      <header className="flex justify-between items-center p-4">
        <h1>Whiteboard App</h1>
        <button onClick={signOut}>Sign Out</button>
      </header>
      <main>
        <TeacherDashboard />
      </main>
    </div>
  );
}
```

## Data Persistence

### Custom Persistence Layer

```tsx
import { useWhiteboardPersistence } from '@/hooks';

function PersistentWhiteboard({ whiteboardId }: { whiteboardId: string }) {
  const { isLoading, error, lines, images } = useWhiteboardPersistence({
    whiteboardId,
    sessionId: 'optional-session-id'
  });

  if (isLoading) return <div>Loading whiteboard...</div>;
  if (error) return <div>Error loading whiteboard: {error.message}</div>;

  return (
    <Whiteboard 
      initialLines={lines}
      initialImages={images}
      width={800} 
      height={600} 
    />
  );
}
```

## Mobile Optimization

### Touch-Optimized Configuration

```tsx
import { useIsMobile } from '@/hooks';

function ResponsiveWhiteboard() {
  const { isMobile } = useIsMobile();

  const palmRejectionConfig = {
    enabled: !isMobile, // Disable on mobile to prevent issues
    maxContactSize: isMobile ? 60 : 40, // Larger touch targets on mobile
    minPressure: isMobile ? 0.05 : 0.1
  };

  return (
    <SyncWhiteboard 
      syncConfig={syncConfig}
      width={isMobile ? window.innerWidth : 800}
      height={isMobile ? window.innerHeight - 100 : 600}
      palmRejectionConfig={palmRejectionConfig}
    />
  );
}
```

## Troubleshooting

### Common Issues

1. **Palm Rejection Not Working**
   - Ensure device supports pointer events
   - Check that `palmRejectionConfig.enabled` is true
   - Verify stylus is properly detected

2. **Sync Connection Issues**
   - Check Supabase configuration
   - Verify network connectivity
   - Check browser console for errors

3. **Performance Issues**
   - Reduce canvas size for complex drawings
   - Implement object culling for large whiteboards
   - Consider using `memo` for expensive components

### Debug Mode

```tsx
// Enable debug logging
const whiteboard = useWhiteboardState({
  debug: true // This would need to be added to the hook
});

// Check event handling
console.log('Current tool:', whiteboard.state.currentTool);
console.log('Lines count:', whiteboard.state.lines.length);
```
