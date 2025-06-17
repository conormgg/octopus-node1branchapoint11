
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeacherHeaderCollapseToggleProps {
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
}

const TeacherHeaderCollapseToggle: React.FC<TeacherHeaderCollapseToggleProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  if (!onToggleCollapse) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggleCollapse}
      className="flex items-center space-x-1"
    >
      {isCollapsed ? (
        <>
          <ChevronDown className="w-4 h-4" />
          <span>Show Controls</span>
        </>
      ) : (
        <>
          <ChevronUp className="w-4 h-4" />
          <span>Hide Controls</span>
        </>
      )}
    </Button>
  );
};

export default TeacherHeaderCollapseToggle;
