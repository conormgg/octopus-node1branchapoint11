
import React, { useState, useEffect } from 'react';
import WhiteboardCanvas from './WhiteboardCanvas';
import MovableToolbar from './MovableToolbar';
import { PalmRejectionSettings } from './PalmRejectionSettings';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { Settings, RotateCcw, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface WhiteboardProps {
  isReadOnly?: boolean;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ isReadOnly = false }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const whiteboardState = useWhiteboardState(dimensions.width, dimensions.height);

  // Palm rejection configuration
  const [palmRejectionConfig, setPalmRejectionConfig] = useState({
    maxContactSize: 40,
    minPressure: 0.1,
    palmTimeoutMs: 500,
    clusterDistance: 100,
    preferStylus: true,
    enabled: true
  });

  const updateDimensions = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const handleStrokeWidthChange = (width: number) => {
    whiteboardState.setStrokeWidth(width);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Control Panel */}
      {!isReadOnly && (
        <div className="absolute top-2 left-2 z-20 flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur-sm">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <PalmRejectionSettings
                config={palmRejectionConfig}
                onChange={setPalmRejectionConfig}
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-white/80 backdrop-blur-sm"
            onClick={whiteboardState.panZoom.resetView}
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="bg-white/80 backdrop-blur-sm"
            onClick={whiteboardState.panZoom.fitToScreen}
            title="Fit to Screen"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Zoom Indicator */}
      <div className="absolute bottom-2 left-2 z-20 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-sm text-gray-600">
        {Math.round(whiteboardState.state.panZoomState.scale * 100)}%
      </div>

      <WhiteboardCanvas
        width={dimensions.width}
        height={dimensions.height}
        whiteboardState={whiteboardState}
        isReadOnly={isReadOnly}
        palmRejectionConfig={palmRejectionConfig}
      />
      <MovableToolbar
        currentTool={whiteboardState.state.currentTool}
        currentStrokeWidth={whiteboardState.state.currentStrokeWidth}
        canUndo={whiteboardState.canUndo}
        canRedo={whiteboardState.canRedo}
        onToolChange={whiteboardState.setTool}
        onStrokeWidthChange={handleStrokeWidthChange}
        onUndo={whiteboardState.undo}
        onRedo={whiteboardState.redo}
        isReadOnly={isReadOnly}
      />
    </div>
  );
};

export default Whiteboard;
