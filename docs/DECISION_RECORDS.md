
# Architecture Decision Records

## ADR-001: Event Handling Strategy

### Status
Accepted

### Context
The whiteboard needs to handle various input types (mouse, touch, stylus) while providing palm rejection for stylus users. Different browsers and devices have varying support for pointer events.

### Decision
Implement a dual event system:
1. **Pointer Events** (primary): Used when palm rejection is enabled and supported
2. **Touch/Mouse Events** (fallback): Used when pointer events aren't available or palm rejection is disabled

### Rationale
- Pointer events provide the most precise control for stylus input
- Touch events ensure compatibility with all devices
- Prevents duplicate event handling through feature detection
- Allows graceful degradation on older browsers

### Implementation
```typescript
// Feature detection determines which system to use
const usePointerEvents = supportsPointerEvents && palmRejectionConfig.enabled;
const useTouchEvents = !usePointerEvents;
```

### Consequences
- **Positive**: Universal device compatibility, optimal stylus experience
- **Negative**: Increased complexity in event handling logic
- **Maintenance**: Must test on various devices and browsers

---

## ADR-002: State Management Architecture

### Status
Accepted

### Context
The application needs to handle local whiteboard state, real-time collaboration, and undo/redo functionality across multiple components.

### Decision
Implement a layered state management approach:
1. **Local State**: Individual whiteboard instances
2. **Shared State**: Collaborative whiteboard state with sync
3. **History State**: Undo/redo functionality
4. **Context State**: Global session and user state

### Rationale
- Separation of concerns allows for better testing and maintenance
- Local state ensures responsive drawing even during network issues
- Shared state enables real-time collaboration
- History state provides user-expected undo/redo functionality

### Implementation
```typescript
// Hook composition for different use cases
useWhiteboardState() // Local only
useSharedWhiteboardState() // With collaboration
useSyncWhiteboardState() // Session-based collaboration
```

### Consequences
- **Positive**: Flexible state management, good performance
- **Negative**: Complex hook relationships, potential for state inconsistencies
- **Maintenance**: Requires careful synchronization between state layers

---

## ADR-003: Real-time Synchronization Protocol

### Status
Accepted

### Context
Multiple users need to collaborate on the same whiteboard with minimal latency and conflict resolution.

### Decision
Use operation-based synchronization with Supabase Realtime:
1. Operations are serialized and sent through realtime channels
2. Last-write-wins conflict resolution for simplicity
3. Optimistic updates for local responsiveness

### Rationale
- Operation-based sync is more efficient than full state sync
- Supabase Realtime provides reliable WebSocket infrastructure
- Last-write-wins is simple and sufficient for drawing operations
- Optimistic updates provide immediate feedback

### Implementation
```typescript
// Operations are sent as structured payloads
{
  type: 'draw_line',
  payload: { lineData },
  timestamp: Date.now(),
  userId: 'user-123'
}
```

### Consequences
- **Positive**: Real-time collaboration, good performance
- **Negative**: Potential for operation conflicts, requires careful ordering
- **Maintenance**: Need to handle connection issues and recovery

---

## ADR-004: Canvas Rendering Technology

### Status
Accepted

### Context
The whiteboard needs high-performance rendering for smooth drawing with support for complex shapes, images, and transformations.

### Decision
Use Konva.js with React-Konva wrapper:
- 2D Canvas with hardware acceleration
- Built-in support for shapes, images, and transformations
- Event system for object interaction

### Rationale
- Konva.js provides excellent performance for 2D graphics
- React-Konva integrates well with React component model
- Built-in features reduce custom implementation complexity
- Active community and good documentation

### Implementation
```typescript
// Layer-based rendering architecture
<Stage>
  <Layer name="images">
    {images.map(image => <ImageRenderer key={image.id} />)}
  </Layer>
  <Layer name="lines">
    {lines.map(line => <LineRenderer key={line.id} />)}
  </Layer>
</Stage>
```

### Consequences
- **Positive**: High performance, rich feature set, good React integration
- **Negative**: Additional bundle size, learning curve for Konva concepts
- **Maintenance**: Dependency on external library updates

---

## ADR-005: Authentication and Session Management

### Status
Accepted

### Context
The application needs user authentication, session creation, and student management for classroom scenarios.

### Decision
Use Supabase Auth with custom session management:
1. Email/password authentication through Supabase
2. Custom session management for classroom scenarios
3. URL-based student joining system

### Rationale
- Supabase Auth provides secure, scalable authentication
- Custom session management allows for classroom-specific features
- URL-based joining is simple for students to understand

### Implementation
```typescript
// Session structure
{
  id: 'session-uuid',
  title: 'Math Class',
  teacher_id: 'teacher-uuid',
  students: ['alice', 'bob', 'charlie'],
  url: 'app.com/join/session-uuid',
  status: 'active'
}
```

### Consequences
- **Positive**: Secure authentication, flexible session management
- **Negative**: Custom session logic complexity, URL management
- **Maintenance**: Need to handle session lifecycle and cleanup

---

## ADR-006: Palm Rejection Implementation

### Status
Accepted

### Context
Users with touch devices and styluses need palm rejection to prevent accidental touches while drawing.

### Decision
Implement heuristic-based palm rejection using pointer event properties:
1. Contact size detection (large contacts = palm)
2. Pressure detection (low pressure = palm)
3. Timing-based rejection (rapid successive touches)

### Rationale
- Pointer events provide contact size and pressure data
- Heuristic approach works across different devices
- No need for machine learning or complex algorithms
- Can be tuned for different use cases

### Implementation
```typescript
const isPalmTouch = (event: PointerEvent) => {
  return event.width > maxContactSize || 
         event.pressure < minPressure ||
         isRapidSuccessiveTouch(event);
};
```

### Consequences
- **Positive**: Improved drawing experience, works on most devices
- **Negative**: May have false positives/negatives, device-dependent
- **Maintenance**: May need tuning for different devices and use cases

---

## ADR-007: TypeScript Integration Strategy

### Status
Accepted

### Context
The application needs strong typing for maintainability, but must balance type safety with development speed.

### Decision
Use strict TypeScript with comprehensive type definitions:
1. Strict mode enabled for all files
2. Complete type coverage for all APIs
3. Generic types for reusable components
4. Utility types for complex transformations

### Rationale
- Strict TypeScript catches errors at compile time
- Complete type coverage improves IDE experience
- Generic types provide reusability without sacrificing safety
- Better refactoring support and documentation

### Implementation
```typescript
// Comprehensive type definitions
interface WhiteboardState {
  lines: LineObject[];
  images: ImageObject[];
  currentTool: Tool;
  // ... all properties typed
}

// Generic hooks for reusability
function useStateManager<T>(initialState: T): StateManager<T>
```

### Consequences
- **Positive**: Better code quality, improved developer experience
- **Negative**: Additional upfront development time, learning curve
- **Maintenance**: Type definitions must be kept in sync with implementation
