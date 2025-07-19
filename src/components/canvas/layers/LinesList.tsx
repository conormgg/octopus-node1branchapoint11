
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
        
        const isSelected = selection?.isObjectSelected?.(line.id) || false;
        const isInGroup = selection?.selectionState?.selectedObjects?.length > 1 && isSelected;
        
        return (
          <LineRenderer 
            key={line.id} 
            line={line}
            isSelected={isSelected && !isInGroup} // Hide individual selection when in group
            isHovered={selection?.hoveredObjectId === line.id}
            currentTool={currentTool}
            onSelect={(currentTool === 'select' || currentTool === 'select2') ? () => {
              if (selection) {
                selection.selectObjects([{ id: line.id, type: 'line' }]);
              }
            } : undefined}
            onMouseEnter={(currentTool === 'select' || currentTool === 'select2') ? () => {
              if (selection?.setHoveredObjectId) {
                selection.setHoveredObjectId(line.id);
              }
            } : undefined}
            onMouseLeave={(currentTool === 'select' || currentTool === 'select2') ? () => {
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
