
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, UserCheck, UserX } from 'lucide-react';
import { SyncDirection } from '@/types/student';

interface SyncDirectionToggleProps {
  participantId: number;
  currentDirection: SyncDirection;
  isUpdating: boolean;
  onToggle: (participantId: number) => Promise<boolean>;
  studentName: string;
}

const SyncDirectionToggle: React.FC<SyncDirectionToggleProps> = ({
  participantId,
  currentDirection,
  isUpdating,
  onToggle,
  studentName
}) => {
  const isTeacherActive = currentDirection === 'teacher_active';

  const handleToggle = async () => {
    if (isUpdating) return;
    await onToggle(participantId);
  };

  return (
    <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
      <div className="flex items-center space-x-2">
        {isTeacherActive ? (
          <UserCheck className="w-4 h-4 text-blue-600" />
        ) : (
          <UserX className="w-4 h-4 text-green-600" />
        )}
        
        <span className="text-sm font-medium text-gray-700">
          {isTeacherActive ? 'Teacher Control' : 'Student Control'}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {isUpdating ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        ) : (
          <Switch
            checked={isTeacherActive}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-green-600"
          />
        )}
      </div>
    </div>
  );
};

export default SyncDirectionToggle;
