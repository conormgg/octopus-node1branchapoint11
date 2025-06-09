# Debug Console Logging Instructions

The console log flooding has been cleaned up to make debugging easier. Here's how to enable targeted debugging when needed:

## Line Movement Debugging

To see detailed logs for line selection and movement:

1. Open `src/hooks/shared/useSharedDrawingOperations.ts`
2. Change line 8 from:
   ```typescript
   const DEBUG_LINE_MOVEMENT = false;
   ```
   to:
   ```typescript
   const DEBUG_LINE_MOVEMENT = true;
   ```
3. Save the file

This will show logs like:
- `[Line Movement] Updating line line_123: { x: 100, y: 200 }`
- `[Line Movement] Sending operation to database: { operation_type: 'update_line', ... }`

## Other Debug Options

If you need to debug other areas, you can temporarily add console logs to:

- **SyncConnectionManager** (`src/utils/SyncConnectionManager.ts`) - for sync operations
- **operationSerializer** (`src/utils/operationSerializer.ts`) - for operation processing
- **Selection events** - in the selection-related hooks

## Clean Console Output

With the cleanup, you should now see:
- ✅ Error messages (important)
- ✅ Connection status changes
- ✅ Palm rejection logs (if enabled)
- ❌ No flooding from every operation
- ❌ No repetitive sync messages
- ❌ No excessive line update logs

## Quick Debug Toggle

For quick debugging, you can also add temporary logs like:
```typescript
if (true) console.log('Debug:', yourVariable);
```

Then change `true` to `false` when done.
