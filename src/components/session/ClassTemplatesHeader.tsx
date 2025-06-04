
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface ClassTemplatesHeaderProps {
  onBack: () => void;
}

const ClassTemplatesHeader: React.FC<ClassTemplatesHeaderProps> = ({ onBack }) => {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Class Templates
          </h1>
          <p className="text-gray-600">Manage your saved class templates</p>
        </div>
      </div>
    </div>
  );
};

export default ClassTemplatesHeader;
