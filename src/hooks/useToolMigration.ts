import { Tool } from '@/types/whiteboard';

/**
 * @hook useToolMigration  
 * @description Handles migration from legacy select tool to unified select2 system
 */
export const useToolMigration = () => {
  /**
   * Maps legacy select tool to new select2 tool
   */
  const migrateToolFromLegacy = (tool: Tool): Tool => {
    if (tool === 'select') {
      return 'select2';
    }
    return tool;
  };

  /**
   * Maps new tools back to legacy for components that haven't been migrated yet
   */
  const getCompatibilityTool = (tool: Tool): Tool => {
    // For now, keep both tools available during migration
    return tool;
  };

  /**
   * Checks if a tool is a selection tool (either legacy or new)
   */
  const isSelectionTool = (tool: Tool): boolean => {
    return tool === 'select' || tool === 'select2';
  };

  /**
   * Gets the primary selection tool (select2)
   */
  const getPrimarySelectionTool = (): Tool => {
    return 'select2';
  };

  return {
    migrateToolFromLegacy,
    getCompatibilityTool,
    isSelectionTool,
    getPrimarySelectionTool
  };
};
