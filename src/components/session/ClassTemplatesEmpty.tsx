
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface ClassTemplatesEmptyProps {
  onBack: () => void;
}

const ClassTemplatesEmpty: React.FC<ClassTemplatesEmptyProps> = ({ onBack }) => {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Yet</h3>
        <p className="text-gray-500 mb-4">
          Create your first class template when setting up a new session.
        </p>
        <Button onClick={onBack}>
          Create New Session
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClassTemplatesEmpty;
