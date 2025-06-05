
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

  const handleMaximizeClick = () => {
    if (isMaximized && onMinimize) {
      onMinimize();
    } else if (!isMaximized && onMaximize) {
      onMaximize();
    }
  };

  const handleToolChange = (tool: 'pen' | 'eraser') => {
    setActiveTool(tool);
  };

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: '#ffffff',
    });

    // Initialize drawing mode
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.width = 2;
    canvas.freeDrawingBrush.color = '#000000';

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [canvasSize]);

  // Handle tool changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    
    if (activeTool === 'pen') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = 2;
      canvas.freeDrawingBrush.color = '#000000';
    } else if (activeTool === 'eraser') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = 10;
      canvas.freeDrawingBrush.color = '#ffffff'; // White color to "erase"
    }
  }, [activeTool]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = Math.max(300, containerRect.width - 16);
      const newHeight = Math.max(200, containerRect.height - 16);

      if (newWidth !== canvasSize.width || newHeight !== canvasSize.height) {
        setCanvasSize({ width: newWidth, height: newHeight });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [canvasSize]);

  // Update canvas size when canvasSize changes
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setDimensions({
        width: canvasSize.width,
        height: canvasSize.height,
      });
      fabricCanvasRef.current.renderAll();
    }
  }, [canvasSize]);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-full bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative"
      style={{ 
        width: initialWidth ? `${initialWidth}px` : '100%',
        height: initialHeight ? `${initialHeight}px` : '100%'
      }}
    >
      {/* Toolbar */}
      <WhiteboardToolbar 
        activeTool={activeTool}
        onToolChange={handleToolChange}
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
          className="border border-gray-300 rounded"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>
      
      {/* Debug info for development */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
        {id} ({canvasSize.width}×{canvasSize.height})
      </div>
    </div>
  );
};

export default Whiteboard;
