# Debug Console Logging Instructions

The console logging has been completely reorganized with a centralized debug configuration system to eliminate spam while maintaining targeted debugging capabilities.

## New Centralized Debug System

All debug logging is now controlled by `src/utils/debug/debugConfig.ts` which provides:

- **Conditional debugging** - Most logs are disabled by default
- **Subsystem-specific controls** - Enable only what you need
- **Runtime control** - Change debug settings without recompiling

## Current Debug Settings (Default)

Most debugging is **disabled by default** to keep console clean:

```typescript
// ❌ Disabled by default (no console spam)
performance: false        // Performance monitoring
events: false            // Event handling
layerOptimization: false // Canvas layer optimization
viewportCulling: false   // Viewport culling
sync: false              // Sync operations
drawing: false           // Drawing operations

// ✅ Enabled by default (essential info)
palmRejection: true      // Palm rejection feedback
connection: true         // Connection status (dev only)
```

## How to Enable Targeted Debugging

### Method 1: Temporary Runtime Enabling (Recommended)

Open browser console and run:

```javascript
// Enable specific subsystem debugging
window.enableDebug?.('performance')     // Performance monitoring
window.enableDebug?.('events')          // Event handling
window.enableDebug?.('layerOptimization') // Layer optimization
window.enableDebug?.('viewportCulling') // Viewport culling
window.enableDebug?.('sync')            // Sync operations
window.enableDebug?.('drawing')         // Drawing operations

// Disable when done
window.disableDebug?.('performance')
```

### Method 2: Edit Configuration File

1. Open `src/utils/debug/debugConfig.ts`
2. Change desired setting from `false` to `true`
3. Save the file

Example for line movement debugging:
```typescript
const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  drawing: true,  // Changed from false
  // ... rest unchanged
};
```

## Available Debug Subsystems

| Subsystem | What it logs |
|-----------|-------------|
| `performance` | Performance monitoring coordination |
| `performanceMetrics` | Drawing/sync/render metrics |
| `performanceTimers` | High-resolution timing |
| `memoryMonitor` | Memory usage tracking |
| `fpsTracker` | FPS calculations |
| `canvas` | Canvas operations |
| `layerOptimization` | Layer caching decisions |
| `viewportCulling` | Viewport culling logic |
| `events` | Event handling (pointer/touch/wheel) |
| `palmRejection` | Palm rejection (always enabled) |
| `state` | State management |
| `selection` | Selection operations |
| `sync` | Synchronization operations |
| `connection` | Connection management |
| `drawing` | Drawing operations |
| `images` | Image operations |

## Testing Viewport Culling

To test viewport culling specifically:

```javascript
// Enable viewport culling debug logs
window.enableDebug?.('viewportCulling')

// Also enable canvas for broader context
window.enableDebug?.('canvas')
```

You'll see logs like:
- `[viewportCulling:Culling] Applied culling: visible 45/100 lines`
- `[viewportCulling:Buffer] Buffer zone: 200px`

## Error Handling

Important: **Errors and warnings are ALWAYS logged** regardless of debug settings:
- `console.error()` - Critical errors
- `console.warn()` - Important warnings
- Connection status changes
- Palm rejection feedback

## Clean Console Benefits

With the new system:
- ✅ **Dramatically reduced noise** (from 100+ logs to essential only)
- ✅ **Targeted debugging** when needed
- ✅ **Better performance** (fewer string operations)
- ✅ **Essential errors always visible**
- ✅ **Runtime control** without recompiling

## Quick Debug Commands

Add to browser bookmarks for quick access:

```javascript
// Debug viewport culling
javascript:window.enableDebug?.('viewportCulling');window.enableDebug?.('canvas');

// Debug performance
javascript:window.enableDebug?.('performance');window.enableDebug?.('performanceMetrics');

// Disable all debugging
javascript:['performance','events','layerOptimization','viewportCulling','sync','drawing'].forEach(s=>window.disableDebug?.(s));
```
