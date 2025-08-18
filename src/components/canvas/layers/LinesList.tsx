
import React from 'react';
import { Tool, LineObject } from '@/types/whiteboard';
import LineRenderer from '../LineRenderer';

interface LinesListProps {
  lines: LineObject[];
  currentTool: Tool;
  selection?: any;
  onUpdateLine?: (lineId: string, updates: any) => void;
}

const LinesList: React.FC<LinesListProps> = ({
  lines,
  currentTool,
  selection,
  onUpdateLine
}) => {
  return (
    <>
      {lines.map((line) => {
        if (!line) return null; // Safety check for filtered items
        
        // NOTE: Original isObjectSelected function removed - using fallback  
        const selectionWithIsSelected = selection as any;
        const isSelected = selectionWithIsSelected?.isObjectSelected?.(line.id) || false;
        const isInGroup = selection?.selectionState?.selectedObjects?.length > 1 && isSelected;
        
        return (
          <LineRenderer 
            key={line.id} 
            line={line}
            isSelected={isSelected && !isInGroup} // Hide individual selection when in group
            isHovered={selection?.hoveredObjectId === line.id}
            currentTool={currentTool}
            onSelect={currentTool === 'select' ? () => {
              if (selection) {
                selection.selectObjects([{ id: line.id, type: 'line' }]);
              }
            } : undefined}
            onMouseEnter={currentTool === 'select' ? () => {
              if (selection?.setHoveredObjectId) {
                selection.setHoveredObjectId(line.id);
              }
            } : undefined}
            onMouseLeave={currentTool === 'select' ? () => {
              if (selection?.setHoveredObjectId) {
                selection.setHoveredObjectId(null);
              }
            } : undefined}
            onDragEnd={(newPosition) => {
              if (onUpdateLine) {
                onUpdateLine(line.id, newPosition);
              }
            }}
          />
        );
      })}
    </>
  );
};

export default LinesList;
