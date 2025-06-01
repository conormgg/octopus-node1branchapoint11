
import React from 'react';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';

interface SessionFormFieldsProps {
  title: string;
  duration: number | '';
  onTitleChange: (title: string) => void;
  onDurationChange: (duration: number | '') => void;
}

const SessionFormFields: React.FC<SessionFormFieldsProps> = ({
  title,
  duration,
  onTitleChange,
  onDurationChange,
}) => {
  return (
    <>
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Session Title
        </label>
        <Input
          id="title"
          type="text"
          placeholder="Enter session title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="duration" className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Duration (minutes, optional)
        </label>
        <Input
          id="duration"
          type="number"
          placeholder="e.g., 60"
          value={duration}
          onChange={(e) => onDurationChange(e.target.value ? parseInt(e.target.value) : '')}
          min="1"
          max="300"
        />
      </div>
    </>
  );
};

export default SessionFormFields;
