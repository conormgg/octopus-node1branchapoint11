
import React from 'react';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptySlotProps {
  onAddStudent?: () => void;
  isAddingAllowed?: boolean;
}

const EmptySlot: React.FC<EmptySlotProps> = ({ 
  onAddStudent, 
  isAddingAllowed = true 
}) => {
  return (
    <div className="h-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center p-4 transition-colors hover:border-gray-400 hover:bg-gray-100">
      <div className="text-center">
        <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500 mb-3">Empty Slot</p>
        {isAddingAllowed && onAddStudent && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddStudent}
            className="text-xs"
          >
            <UserPlus className="w-3 h-3 mr-1" />
            Add Student
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptySlot;
