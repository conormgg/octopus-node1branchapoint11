import { Tool } from '@/types/whiteboard';
import { useToolMigration } from './useToolMigration';

/**
 * @hook useEventHandlerRouter
 * @description Routes events to appropriate handlers during migration period
 */
export const useEventHandlerRouter = () => {
  const { migrateToolFromLegacy, isSelectionTool } = useToolMigration();

  /**
   * Determines which selection system to use for a given tool
   */
  const getSelectionSystem = (tool: Tool): 'legacy' | 'unified' | 'none' => {
    // During migration, route all selection tools to unified system
    if (tool === 'select2') {
      return 'unified';
    }
    
    // Legacy select tool is now routed to unified system
    if (tool === 'select') {
      return 'unified';  // Migrate legacy select to unified
    }
    
    return 'none';
  };

  /**
   * Gets the effective tool for event handling
   */
  const getEffectiveTool = (tool: Tool): Tool => {
    return migrateToolFromLegacy(tool);
  };

  /**
   * Checks if events should be handled by unified selection
   */
  const shouldUseUnifiedSelection = (tool: Tool): boolean => {
    return getSelectionSystem(tool) === 'unified';
  };

  /**
   * Checks if events should be handled by legacy selection
   */
  const shouldUseLegacySelection = (tool: Tool): boolean => {
    return getSelectionSystem(tool) === 'legacy';
  };

  return {
    getSelectionSystem,
    getEffectiveTool,
    shouldUseUnifiedSelection,
    shouldUseLegacySelection,
    isSelectionTool
  };
};