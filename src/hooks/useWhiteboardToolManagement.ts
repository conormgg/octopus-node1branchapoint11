
import { useState, useCallback } from 'react';
import { Tool, ToolSettings } from '@/types/whiteboard';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @function debugLog
 * @description Debug logging for tool management operations
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[ToolManagement:${context}] ${action}`, data || '');
  }
};

/**
 * @hook useWhiteboardToolManagement
 * @description Manages tool selection, color changes, and tool-specific settings
 */
export const useWhiteboardToolManagement = () => {
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(5);
  const [pencilSettings, setPencilSettings] = useState<ToolSettings>({
    color: '#000000',
    strokeWidth: 5
  });
  const [highlighterSettings, setHighlighterSettings] = useState<ToolSettings>({
    color: '#FFFF00',
    strokeWidth: 12
  });

  // Tool change with settings sync
  const setTool = useCallback((tool: Tool) => {
    debugLog('Tool', 'Tool change requested', { from: currentTool, to: tool });
    
    let newColor = currentColor;
    let newStrokeWidth = currentStrokeWidth;
    
    // Apply tool-specific settings when switching tools
    if (tool === 'pencil') {
      newColor = pencilSettings.color;
      newStrokeWidth = pencilSettings.strokeWidth;
    } else if (tool === 'highlighter') {
      newColor = highlighterSettings.color;
      newStrokeWidth = highlighterSettings.strokeWidth;
    }
    
    debugLog('Tool', 'Tool changed', { 
      tool, 
      color: newColor, 
      strokeWidth: newStrokeWidth 
    });
    
    setCurrentTool(tool);
    setCurrentColor(newColor);
    setCurrentStrokeWidth(newStrokeWidth);
  }, [currentTool, currentColor, currentStrokeWidth, pencilSettings, highlighterSettings]);

  // Color change with tool-specific storage and auto-switching
  const setColor = useCallback((color: string) => {
    debugLog('Color', 'Color change requested', { from: currentColor, to: color });
    
    setCurrentColor(color);
    
    // Update the appropriate tool settings and switch to that tool
    if (currentTool === 'pencil' || currentTool === 'highlighter') {
      // Update current tool's settings
      if (currentTool === 'pencil') {
        setPencilSettings(prev => ({ ...prev, color }));
      } else {
        setHighlighterSettings(prev => ({ ...prev, color }));
      }
    } else {
      // If not on a drawing tool, determine which tool this color belongs to
      const pencilColors = ['#000000', '#FF0000', '#0080FF', '#00C851'];
      const highlighterColors = ['#FFFF00', '#FFA500', '#00BFFF', '#32CD32'];
      
      if (pencilColors.includes(color)) {
        setCurrentTool('pencil');
        setPencilSettings(prev => ({ ...prev, color }));
        setCurrentStrokeWidth(pencilSettings.strokeWidth);
      } else if (highlighterColors.includes(color)) {
        setCurrentTool('highlighter');
        setHighlighterSettings(prev => ({ ...prev, color }));
        setCurrentStrokeWidth(highlighterSettings.strokeWidth);
      }
    }
    
    debugLog('Color', 'Color changed', { color });
  }, [currentColor, currentTool, pencilSettings, highlighterSettings]);

  // Pencil-specific color change with auto-switching
  const setPencilColor = useCallback((color: string) => {
    debugLog('Color', 'Pencil color change requested', { from: pencilSettings.color, to: color });
    setCurrentTool('pencil');
    setCurrentColor(color);
    setCurrentStrokeWidth(pencilSettings.strokeWidth);
    setPencilSettings(prev => ({ ...prev, color }));
  }, [pencilSettings]);

  // Highlighter-specific color change with auto-switching
  const setHighlighterColor = useCallback((color: string) => {
    debugLog('Color', 'Highlighter color change requested', { from: highlighterSettings.color, to: color });
    setCurrentTool('highlighter');
    setCurrentColor(color);
    setCurrentStrokeWidth(highlighterSettings.strokeWidth);
    setHighlighterSettings(prev => ({ ...prev, color }));
  }, [highlighterSettings]);

  // Stroke width change with tool-specific storage
  const setStrokeWidth = useCallback((width: number) => {
    debugLog('StrokeWidth', 'Stroke width change requested', { from: currentStrokeWidth, to: width });
    
    setCurrentStrokeWidth(width);
    
    // Update the appropriate tool settings
    if (currentTool === 'pencil') {
      setPencilSettings(prev => ({ ...prev, strokeWidth: width }));
    } else if (currentTool === 'highlighter') {
      setHighlighterSettings(prev => ({ ...prev, strokeWidth: width }));
    }
    
    debugLog('StrokeWidth', 'Stroke width changed', { width });
  }, [currentTool, currentStrokeWidth]);

  return {
    currentTool,
    currentColor,
    currentStrokeWidth,
    pencilSettings,
    highlighterSettings,
    setTool,
    setColor,
    setPencilColor,
    setHighlighterColor,
    setStrokeWidth
  };
};
