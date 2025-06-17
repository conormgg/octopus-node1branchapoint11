
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { ArrowLeftRight, ArrowRight, ArrowLeft } from 'lucide-react';
import { SessionParticipant } from '@/hooks/useSessionParticipants';

interface SyncDirectionToggleProps {
  participant: SessionParticipant;
  onToggle: (participantId: number, direction: 'teacher_to_student' | 'student_to_teacher') => Promise<void>;
  disabled?: boolean;
}

const SyncDirectionToggle: React.FC<SyncDirectionToggleProps> = ({
  participant,
  onToggle,
  disabled = false
}) => {
  const isStudentActive = participant.sync_direction === 'student_to_teacher';
  
  const handleToggle = async (checked: boolean) => {
    const newDirection = checked ? 'student_to_teacher' : 'teacher_to_student';
    await onToggle(participant.id, newDirection);
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2 min-w-0 flex-1">
        <div className="font-medium text-sm truncate">
          {participant.student_name}
        </div>
        {participant.student_email && (
          <div className="text-xs text-gray-500 truncate">
            {participant.student_email}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 text-xs">
          {isStudentActive ? (
            <>
              <ArrowLeft className="w-3 h-3 text-blue-600" />
              <span className="text-blue-600 font-medium">Student Active</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-3 h-3 text-green-600" />
              <span className="text-green-600 font-medium">Teacher Active</span>
            </>
          )}
        </div>
        
        <Switch
          checked={isStudentActive}
          onCheckedChange={handleToggle}
          disabled={disabled}
          className="data-[state=checked]:bg-blue-600"
        />
      </div>
    </div>
  );
};

export default SyncDirectionToggle;
