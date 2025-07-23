import { Tool } from '@/types/whiteboard';
import { useToolMigration } from './useToolMigration';
import { useEventHandlerRouter } from './useEventHandlerRouter';

/**
 * @hook useUnifiedSelection
 * @description Provides unified selection behavior during migration period
 */
export const useUnifiedSelection = () => {
  const { isSelectionTool, getPrimarySelectionTool } = useToolMigration();
  const { shouldUseUnifiedSelection, getEffectiveTool } = useEventHandlerRouter();

  /**
   * Determines if unified selection should be active for the current tool
   */
  const isUnifiedSelectionActive = (tool: Tool): boolean => {
    return shouldUseUnifiedSelection(tool);
  };

  /**
   * Gets the effective selection tool (always returns select2 for selection operations)
   */
  const getUnifiedSelectionTool = (tool: Tool): Tool => {
    if (isSelectionTool(tool)) {
      return getPrimarySelectionTool();
    }
    return tool;
  };

  /**
   * Checks if a tool should use legacy selection rendering (during transition period)
   */
  const shouldRenderLegacySelection = (tool: Tool): boolean => {
    // During migration, no tools should use legacy selection rendering
    return false;
  };

  /**
   * Checks if a tool should use unified selection rendering
   */
  const shouldRenderUnifiedSelection = (tool: Tool): boolean => {
    return isSelectionTool(tool);
  };

  return {
    isUnifiedSelectionActive,
    getUnifiedSelectionTool,
    shouldRenderLegacySelection,
    shouldRenderUnifiedSelection,
    isSelectionTool
  };
};