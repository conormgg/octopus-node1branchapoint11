
import React, { useRef, useEffect } from 'react';
import { Line } from 'react-konva';
import { LineObject } from '@/types/whiteboard';
import Konva from 'konva';

interface LineRendererProps {
  line: LineObject;
  isSelected?: boolean;
  isHovered?: boolean;
  onSelect?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onDragEnd?: (updates: { x: number; y: number; scaleX?: number; scaleY?: number; rotation?: number }) => void;
  currentTool?: string;
}

const LineRenderer: React.FC<LineRendererProps> = React.memo(({ 
  line, 
  isSelected = false, 
  isHovered = false,
  onSelect,
  onMouseEnter,
  onMouseLeave,
  onDragEnd,
  currentTool = 'pencil'
}) => {
  const lineRef = useRef<Konva.Line>(null);
  


  // Don't render eraser strokes - they are used for stroke deletion, not visual feedback
  if (line.tool === 'eraser') return null;

  return (
    <>
      {/* Hover highlight - render behind everything */}
      {isHovered && !isSelected && (
        <Line
          points={line.points}
          stroke="rgba(0, 123, 255, 0.2)"
          strokeWidth={line.strokeWidth + 6}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation="source-over"
          x={line.x}
          y={line.y}
          scaleX={line.scaleX}
          scaleY={line.scaleY}
          rotation={line.rotation}
          perfectDrawEnabled={false}
          listening={false}
        />
      )}
      
      {/* Selection highlight - render behind the line */}
      {isSelected && (
        <Line
          points={line.points}
          stroke="rgba(0, 123, 255, 0.5)"
          strokeWidth={line.strokeWidth + 4}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation="source-over"
          x={line.x}
          y={line.y}
          scaleX={line.scaleX}
          scaleY={line.scaleY}
          rotation={line.rotation}
          perfectDrawEnabled={false}
          listening={false}
          shadowForStrokeEnabled={false}
          hitStrokeWidth={0}
        />
      )}
      
      {/* Main line */}
      <Line
        ref={lineRef}
        id={line.id}
        points={line.points}
        stroke={line.color}
        strokeWidth={line.strokeWidth}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={line.tool === 'highlighter' ? 'multiply' : 'source-over'}
        opacity={line.tool === 'highlighter' ? 0.5 : 1}
        x={line.x}
        y={line.y}
        scaleX={line.scaleX}
        scaleY={line.scaleY}
        rotation={line.rotation}
        perfectDrawEnabled={false}
        listening={onSelect || onMouseEnter || onMouseLeave || ((currentTool === 'select' || currentTool === 'select2') && isSelected) ? true : false}
        draggable={(currentTool === 'select' || currentTool === 'select2') && isSelected}
        onClick={onSelect}
        onTap={onSelect}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onDragEnd={(e) => {
          if (onDragEnd) {
            const node = e.target;
            onDragEnd({
              x: node.x(),
              y: node.y()
            });
          }
        }}
        shadowForStrokeEnabled={false}
        hitStrokeWidth={line.strokeWidth + 10}
      />
      
    </>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.line.id === nextProps.line.id &&
    prevProps.line.points === nextProps.line.points &&
    prevProps.line.color === nextProps.line.color &&
    prevProps.line.strokeWidth === nextProps.line.strokeWidth &&
    prevProps.line.x === nextProps.line.x &&
    prevProps.line.y === nextProps.line.y &&
    prevProps.line.scaleX === nextProps.line.scaleX &&
    prevProps.line.scaleY === nextProps.line.scaleY &&
    prevProps.line.rotation === nextProps.line.rotation &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.currentTool === nextProps.currentTool
  );
});

export default LineRenderer;
