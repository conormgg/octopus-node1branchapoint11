
import React from 'react';
import { LineObject } from '@/types/whiteboard';
import LineRenderer from '../LineRenderer';

interface LinesListProps {
  lines: LineObject[];
  currentTool: string;
  selection?: any;
  onUpdateLine?: (lineId: string, updates: any) => void;
}

const LinesList: React.FC<LinesListProps> = ({
  lines,
  currentTool,
  selection,
  onUpdateLine
}) => {
  const selectedObjects = selection?.selectionState?.selectedObjects || [];
  
  return (
    <>
      {lines.map((line) => {
        const isSelected = selectedObjects.some((obj: any) => obj.id === line.id && obj.type === 'line');
        
        return (
          <LineRenderer
            key={line.id}
            line={line}
            isSelected={isSelected}
            currentTool={currentTool}
            onSelect={() => {
              if (currentTool === 'select' && selection?.toggleObjectSelection) {
                selection.toggleObjectSelection({ id: line.id, type: 'line' });
              }
            }}
            onDragEnd={(updates) => {
              if (onUpdateLine) {
                onUpdateLine(line.id, updates);
              }
            }}
          />
        );
      })}
    </>
  );
};

export default LinesList;
