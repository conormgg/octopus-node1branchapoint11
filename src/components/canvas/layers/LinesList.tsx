import React from 'react';
import { Tool, LineObject, SelectedObject } from '@/types/whiteboard';
import LineRenderer from '../LineRenderer';

interface LinesListProps {
  lines: LineObject[];
  currentTool: Tool;
  selection?: any;
  select2State?: {
    selectedObjects: SelectedObject[];
    hoveredObjectId: string | null;
    // ... other select2 state properties
  };
  onUpdateLine?: (lineId: string, updates: any) => void;
}

const LinesList: React.FC<LinesListProps> = ({
  lines,
  currentTool,
  selection,
  select2State,
  onUpdateLine
}) => {
  return (
    <>
      {lines.map((line) => {
        if (!line) return null; // Safety check for filtered items
        
        // Check selection state for both select and select2 tools
        const isSelectedInSelect = selection?.isObjectSelected?.(line.id) || false;
        const isSelectedInSelect2 = select2State?.selectedObjects?.some(obj => obj.id === line.id) || false;
        const isSelected = (currentTool === 'select' && isSelectedInSelect) || 
                          (currentTool === 'select2' && isSelectedInSelect2);
        
        const isInGroup = selection?.selectionState?.selectedObjects?.length > 1 && isSelectedInSelect;
        
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
