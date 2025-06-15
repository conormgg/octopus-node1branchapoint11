
import { useCallback, useMemo } from 'react';

interface EventHandlerConfig<T extends (...args: any[]) => any> {
  handler: T;
  deps: React.DependencyList;
}

/**
 * Hook to create stable, memoized event handlers
 * Prevents unnecessary re-renders by ensuring event handlers have stable references
 */
export const useMemoizedEventHandlers = <T extends Record<string, (...args: any[]) => any>>(
  handlers: { [K in keyof T]: EventHandlerConfig<T[K]> }
): T => {
  // Create stable handlers using useCallback with specified dependencies
  const memoizedHandlers = useMemo(() => {
    const result = {} as T;
    
    for (const [key, config] of Object.entries(handlers)) {
      // Use a closure to capture the handler and deps for each key
      result[key as keyof T] = useCallback(config.handler, config.deps) as T[keyof T];
    }
    
    return result;
  }, [
    // Create a stable dependency array from all handler configs
    JSON.stringify(Object.keys(handlers)),
    ...Object.values(handlers).flatMap(config => config.deps)
  ]);

  return memoizedHandlers;
};
