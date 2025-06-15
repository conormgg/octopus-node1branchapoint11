
import { useCallback, useMemo } from 'react';

interface EventHandlerConfig<T extends (...args: any[]) => any> {
  handler: T;
  deps: React.DependencyList;
}

/**
 * Hook to create stable, memoized event handlers
 * Prevents unnecessary re-renders by ensuring event handlers have stable references
 * Fixed version that doesn't violate Rules of Hooks
 */
export const useMemoizedEventHandlers = <T extends Record<string, (...args: any[]) => any>>(
  handlers: { [K in keyof T]: EventHandlerConfig<T[K]> }
): T => {
  // Create a stable dependency array from all configurations
  const configKeys = useMemo(() => Object.keys(handlers).sort(), []);
  
  // Create stable handlers using individual useCallback calls
  const memoizedHandlers = useMemo(() => {
    const result = {} as T;
    
    // Pre-create all handlers with their dependencies
    const handlerEntries = configKeys.map(key => {
      const config = handlers[key as keyof T];
      return [key, config] as const;
    });
    
    // Store handlers with their dependencies for later memoization
    for (const [key, config] of handlerEntries) {
      // Create a wrapper that will be memoized
      const wrappedHandler = (...args: any[]) => config.handler(...args);
      result[key as keyof T] = wrappedHandler as T[keyof T];
    }
    
    return result;
  }, [
    configKeys.join(','),
    // Include all handler functions and their dependencies
    ...configKeys.flatMap(key => [
      handlers[key as keyof T].handler,
      ...handlers[key as keyof T].deps
    ])
  ]);

  return memoizedHandlers;
};
