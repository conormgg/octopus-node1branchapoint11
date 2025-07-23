/**
 * @file Migration Utilities
 * @description Helper functions for safe code migration and cleanup
 */

import { Tool } from '@/types/whiteboard';

/**
 * Checks if a file or component is safe to remove
 */
export const isSafeToRemove = (componentName: string): boolean => {
  const safeToRemoveComponents = [
    // Legacy selection components that are no longer used
    'SelectionRect',        // Replaced by unified selection
    'SelectionGroup',       // Replaced by unified selection  
    'GroupTransformer',     // Replaced by unified selection
    'SelectionGroupBackground' // Replaced by unified selection
  ];
  
  return safeToRemoveComponents.includes(componentName);
};

/**
 * Gets deprecated component replacement information
 */
export const getComponentReplacement = (componentName: string): string | null => {
  const replacements: Record<string, string> = {
    'SelectionRect': 'Select2Renderer (unified selection)',
    'SelectionGroup': 'Select2Renderer (unified selection)',
    'GroupTransformer': 'Built into Select2Renderer',
    'SelectionGroupBackground': 'Built into Select2Renderer'
  };
  
  return replacements[componentName] || null;
};

/**
 * Lists components that are safe to remove
 */
export const getRemovableComponents = (): string[] => {
  return [
    'src/components/canvas/SelectionRect.tsx',
    'src/components/canvas/SelectionGroup.tsx', 
    'src/components/canvas/GroupTransformer.tsx',
    'src/components/canvas/SelectionGroupBackground.tsx'
  ];
};

/**
 * Lists legacy selection event handlers that can be removed
 */
export const getRemovableLegacyHandlers = (): string[] => {
  return [
    // Event handlers that check for 'select' tool specifically
    'useMouseEventHandlers legacy select paths',
    'useStageCursor legacy select logic',
    'useKonvaKeyboardHandlers legacy select logic'
  ];
};

/**
 * Migration status checker
 */
export const getMigrationStatus = (): {
  componentsToRemove: string[];
  handlersToUpdate: string[];
  migrationComplete: boolean;
} => {
  const componentsToRemove = getRemovableComponents();
  const handlersToUpdate = getRemovableLegacyHandlers();
  
  return {
    componentsToRemove,
    handlersToUpdate,
    migrationComplete: false // Will be true when all legacy code is removed
  };
};