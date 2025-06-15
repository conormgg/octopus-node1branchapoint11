
# Performance Optimization Guide

## Performance Dashboard

### Accessing the Dashboard

In development mode, you can access the real-time performance dashboard:

```javascript
// Show the performance dashboard
window.debug.showPerformanceDashboard()

// Hide the performance dashboard
window.debug.hidePerformanceDashboard()

// Check if dashboard is visible
window.debug.isPerformanceDashboardVisible()
```

### Dashboard Features

The performance dashboard provides:

- **Overview Tab**: Real-time performance metrics and health scores
- **Metrics Tab**: Detailed performance measurements across all operations
- **Layer Optimization Tab**: Canvas layer optimization insights and recommendations
- **Opportunities Tab**: Actionable performance improvement suggestions
- **Recommendations Tab**: Priority-ordered optimization recommendations

### Key Metrics Monitored

- **Drawing Operations**: Stroke rendering performance and timing
- **Image Operations**: Image loading, rendering, and manipulation metrics
- **Sync Operations**: Real-time collaboration performance
- **Memory Usage**: JavaScript heap usage and memory optimization
- **Frame Rate**: Canvas rendering performance (FPS tracking)
- **Layer Optimization**: Cache hit rates and rendering efficiency

## Canvas Performance

### 1. Object Virtualization

For whiteboards with many objects, implement viewport-based rendering:

```typescript
// Only render objects visible in the current viewport
const visibleObjects = useMemo(() => {
  return allObjects.filter(obj => 
    isObjectInViewport(obj, viewportBounds)
  );
}, [allObjects, viewportBounds]);
```

### 2. Layer Optimization

Separate static and dynamic content into different layers:

```typescript
<Stage>
  {/* Static background layer - cached */}
  <Layer ref={backgroundLayerRef}>
    {staticImages.map(image => <ImageRenderer key={image.id} image={image} />)}
  </Layer>
  
  {/* Dynamic drawing layer - frequently updated */}
  <Layer>
    {activeLines.map(line => <LineRenderer key={line.id} line={line} />)}
  </Layer>
</Stage>
```

### 3. Performance Monitoring Integration

The system automatically monitors performance across all operations:

```typescript
// Performance monitoring is automatically enabled for:
// - Drawing operations (stroke creation, rendering)
// - Image operations (upload, resize, transformation)
// - Sync operations (real-time collaboration)
// - Memory usage (heap monitoring)
// - Canvas rendering (FPS tracking)

// Access current metrics programmatically
const metrics = window.debug.getPerformanceMetrics?.();
```

### 4. Stroke Simplification

Reduce point density for smoother performance:

```typescript
const simplifyStroke = (points: number[], tolerance: number = 2): number[] => {
  if (points.length < 4) return points;
  
  // Douglas-Peucker algorithm implementation
  return douglasPeucker(points, tolerance);
};
```

## Memory Management

### 1. Component Memoization

Prevent unnecessary re-renders:

```typescript
const LineRenderer = memo(({ line }: { line: LineObject }) => {
  return (
    <Line
      points={line.points}
      stroke={line.color}
      strokeWidth={line.strokeWidth}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison for deep equality
  return isEqual(prevProps.line, nextProps.line);
});
```

### 2. Event Handler Optimization

Use stable references for event handlers:

```typescript
const handlePointerDown = useCallback((x: number, y: number) => {
  // Event handling logic
}, [/* dependencies */]);
```

### 3. History Management

Limit history size and use efficient data structures:

```typescript
const MAX_HISTORY_SIZE = 50;

const addToHistory = useCallback((snapshot: WhiteboardSnapshot) => {
  setHistory(prev => {
    const newHistory = [...prev, snapshot];
    return newHistory.slice(-MAX_HISTORY_SIZE); // Keep only recent history
  });
}, []);
```

## Network Optimization

### 1. Operation Batching

Batch multiple operations to reduce network overhead:

```typescript
const operationBatch: Operation[] = [];
const BATCH_SIZE = 10;
const BATCH_TIMEOUT = 100; // ms

const sendOperation = (operation: Operation) => {
  operationBatch.push(operation);
  
  if (operationBatch.length >= BATCH_SIZE) {
    flushBatch();
  } else {
    // Debounce batch sending
    debouncedFlushBatch();
  }
};
```

### 2. Delta Compression

Send only changes instead of full state:

```typescript
const createDeltaOperation = (
  oldState: WhiteboardState, 
  newState: WhiteboardState
): Operation => {
  const addedLines = newState.lines.filter(line => 
    !oldState.lines.find(oldLine => oldLine.id === line.id)
  );
  
  const removedLineIds = oldState.lines
    .filter(line => !newState.lines.find(newLine => newLine.id === line.id))
    .map(line => line.id);
    
  return {
    type: 'delta_update',
    payload: { addedLines, removedLineIds }
  };
};
```

### 3. Adaptive Quality

Adjust rendering quality based on performance:

```typescript
const useAdaptiveQuality = () => {
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  
  useEffect(() => {
    const monitor = new PerformanceMonitor({
      onFpsChange: (fps: number) => {
        if (fps < 30) setQuality('low');
        else if (fps < 45) setQuality('medium');
        else setQuality('high');
      }
    });
    
    return () => monitor.disconnect();
  }, []);
  
  return quality;
};
```

## Mobile Optimization

### 1. Touch Response

Optimize touch event handling for mobile devices:

```typescript
const useMobileOptimization = () => {
  const { isMobile } = useIsMobile();
  
  return {
    strokeWidth: isMobile ? Math.max(strokeWidth, 3) : strokeWidth, // Minimum stroke width
    hitArea: isMobile ? 20 : 10, // Larger hit areas for touch
    debounceMs: isMobile ? 16 : 8, // Different debounce for touch vs mouse
  };
};
```

### 2. Canvas Scaling

Handle high-DPI displays efficiently:

```typescript
const useCanvasScaling = (canvasRef: RefObject<HTMLCanvasElement>) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size in CSS pixels
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Set canvas buffer size accounting for pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the drawing context
    const ctx = canvas.getContext('2d');
    ctx?.scale(dpr, dpr);
  }, []);
};
```

## Debugging Performance Issues

### 1. Real-time Performance Dashboard

Use the integrated performance dashboard for live monitoring:

```typescript
// Open dashboard in development
window.debug.showPerformanceDashboard()

// Enable specific debugging subsystems
window.debug.enableDebug('layerOptimization')
window.debug.enableDebug('performanceMetrics')
```

### 2. Performance Monitoring Hooks

```typescript
const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    renderTime: 0,
    objectCount: 0
  });
  
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'render') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration
          }));
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    return () => observer.disconnect();
  }, []);
  
  return metrics;
};
```

### 3. Memory Leak Detection

```typescript
const useMemoryMonitoring = () => {
  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
        });
      }
    };
    
    const interval = setInterval(checkMemory, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);
};
```

### 4. Render Profiling

```typescript
const useRenderProfiling = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    console.log(`${componentName} render #${renderCount.current}, time since last: ${timeSinceLastRender}ms`);
    lastRenderTime.current = now;
  });
};
```

## Best Practices Summary

1. **Use the Performance Dashboard**: Monitor real-time metrics in development
2. **Minimize Re-renders**: Use `memo`, `useMemo`, and `useCallback` appropriately
3. **Efficient Data Structures**: Use Maps and Sets for lookups instead of arrays
4. **Lazy Loading**: Load images and resources only when needed
5. **Event Debouncing**: Batch rapid events to reduce processing overhead
6. **Progressive Enhancement**: Start with basic functionality, add advanced features progressively
7. **Monitor Performance**: Use browser dev tools and the integrated dashboard
8. **Test on Real Devices**: Performance varies significantly across devices and browsers
9. **Layer Optimization**: Leverage the automatic layer caching system
10. **Debug Systematically**: Use the debug system to isolate performance issues

## Troubleshooting Common Issues

### High Memory Usage
1. Open performance dashboard
2. Check memory metrics tab
3. Look for memory leak patterns
4. Use `window.debug.enableDebug('memoryMonitor')` for detailed logging

### Low Frame Rate
1. Monitor FPS in dashboard overview
2. Check layer optimization recommendations
3. Enable `layerOptimization` debugging
4. Consider reducing object complexity

### Slow Drawing Operations
1. Check drawing operations metrics
2. Review stroke simplification settings
3. Monitor cache hit rates
4. Consider adaptive quality adjustments
