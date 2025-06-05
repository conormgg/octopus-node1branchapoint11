
import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { Maximize2, Minimize2 } from 'lucide-react';
import WhiteboardToolbar from './WhiteboardToolbar';

interface WhiteboardProps {
  id: string;
  initialWidth?: number;
  initialHeight?: number;
  isMaximized?: boolean;
  onMaximize?: () => void;
  onMinimize?: () => void;
}

const Whiteboard: React.FC<WhiteboardProps> = ({
  id,
  initialWidth,
  initialHeight,
  isMaximized = false,
  onMaximize,
  onMinimize,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeColor, setStrokeColor] = useState('#000000');

  const handleMaximizeClick = () => {
    if (isMaximized && onMinimize) {
      onMinimize();
    } else if (!isMaximized && onMaximize) {
      onMaximize();
    }
  };

  const handleToolChange = (tool: 'pen' | 'eraser') => {
    console.log('Tool changed to:', tool);
    setActiveTool(tool);
  };

  const handleStrokeWidthChange = (width: number) => {
    console.log('Stroke width changed to:', width);
    setStrokeWidth(width);
  };

  const handleColorChange = (color: string) => {
    console.log('Color changed to:', color);
    setStrokeColor(color);
  };

  const handleClear = () => {
    if (!fabricCanvasRef.current) return;
    
    console.log('Clearing canvas');
    fabricCanvasRef.current.clear();
    fabricCanvasRef.current.backgroundColor = '#ffffff';
    fabricCanvasRef.current.renderAll();
    
    // Reapply drawing settings after clearing
    applyDrawingSettings(fabricCanvasRef.current, activeTool);
  };

  const applyDrawingSettings = (canvas: FabricCanvas, tool: 'pen' | 'eraser') => {
    console.log('Applying drawing settings - Tool:', tool, 'Width:', strokeWidth, 'Color:', strokeColor);
    
    // Enable drawing mode
    canvas.isDrawingMode = true;
    
    // Configure the brush
    if (canvas.freeDrawingBrush) {
      if (tool === 'pen') {
        canvas.freeDrawingBrush.width = strokeWidth;
        canvas.freeDrawingBrush.color = strokeColor;
      } else if (tool === 'eraser') {
        canvas.freeDrawingBrush.width = strokeWidth * 2;
        canvas.freeDrawingBrush.color = '#ffffff';
      }
      console.log('Brush configured - Width:', canvas.freeDrawingBrush.width, 'Color:', canvas.freeDrawingBrush.color);
    } else {
      console.error('freeDrawingBrush is not available');
    }
  };

  // Initialize canvas ONLY ONCE
  useEffect(() => {
    console.log('Initializing canvas for:', id);
    
    if (!canvasRef.current) {
      console.error('Canvas ref not available');
      return;
    }

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
    });

    console.log('Canvas created, enabling drawing mode');
    
    // Apply initial drawing settings
    applyDrawingSettings(canvas, activeTool);

    fabricCanvasRef.current = canvas;

    // Add event listeners for debugging
    canvas.on('path:created', () => {
      console.log('Path created successfully');
    });

    canvas.on('mouse:down', () => {
      console.log('Mouse down on canvas');
    });

    canvas.on('mouse:move', () => {
      console.log('Mouse move on canvas');
    });

    return () => {
      console.log('Disposing canvas');
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [id]); // Only recreate when ID changes

  // Handle tool and settings changes
  useEffect(() => {
    console.log('Settings changed - Tool:', activeTool, 'Width:', strokeWidth, 'Color:', strokeColor);
    if (!fabricCanvasRef.current) return;
    applyDrawingSettings(fabricCanvasRef.current, activeTool);
  }, [activeTool, strokeWidth, strokeColor]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(300, containerRect.width - 16);
      const newHeight = Math.max(200, containerRect.height - 16);

      console.log('Container resized to:', newWidth, 'x', newHeight);

      setCanvasSize(prev => {
        if (newWidth === prev.width && newHeight === prev.height) {
          return prev;
        }
        return { width: newWidth, height: newHeight };
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update canvas dimensions when size changes (WITHOUT recreating canvas)
  useEffect(() => {
    if (fabricCanvasRef.current) {
      console.log('Updating canvas dimensions to:', canvasSize.width, 'x', canvasSize.height);
      
      fabricCanvasRef.current.setDimensions({
        width: canvasSize.width,
        height: canvasSize.height,
      });
      
      // IMPORTANT: Re-enable drawing mode after dimension change
      applyDrawingSettings(fabricCanvasRef.current, activeTool);
      
      fabricCanvasRef.current.renderAll();
    }
  }, [canvasSize.width, canvasSize.height, activeTool]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative"
      style={{ 
        width: initialWidth ? `${initialWidth}px` : '100%',
        height: initialHeight ? `${initialHeight}px` : '100%'
      }}
    >
      {/* Enhanced Toolbar */}
      <WhiteboardToolbar 
        activeTool={activeTool}
        strokeWidth={strokeWidth}
        strokeColor={strokeColor}
        onToolChange={handleToolChange}
        onStrokeWidthChange={handleStrokeWidthChange}
        onColorChange={handleColorChange}
        onClear={handleClear}
      />

      {/* Maximize/Minimize Button */}
      <button
        onClick={handleMaximizeClick}
        className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-white/80 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150"
        title={isMaximized ? "Minimize" : "Maximize"}
      >
        {isMaximized ? (
          <Minimize2 size={16} className="text-gray-600" />
        ) : (
          <Maximize2 size={16} className="text-gray-600" />
        )}
      </button>
      
      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        <canvas 
          ref={canvasRef}
          className="border border-gray-300 rounded cursor-crosshair"
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%',
            touchAction: 'none'
          }}
        />
      </div>
      
      {/* Debug info for development */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
        {id} ({canvasSize.width}×{canvasSize.height}) - Tool: {activeTool}
      </div>
    </div>
  );
};

export default Whiteboard;
