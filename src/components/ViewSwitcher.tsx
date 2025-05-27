
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, User } from 'lucide-react';
import TeacherView from './TeacherView';
import StudentView from './StudentView';

const ViewSwitcher: React.FC = () => {
  const [currentView, setCurrentView] = useState<'teacher' | 'student'>('teacher');

  return (
    <div className="min-h-screen">
      {/* View Toggle Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={currentView === 'teacher' ? 'default' : 'outline'}
            onClick={() => setCurrentView('teacher')}
            className="flex items-center space-x-2"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Teacher View</span>
          </Button>
          <Button
            variant={currentView === 'student' ? 'default' : 'outline'}
            onClick={() => setCurrentView('student')}
            className="flex items-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Student View</span>
          </Button>
        </div>
      </div>

      {/* Current View */}
      {currentView === 'teacher' ? <TeacherView /> : <StudentView />}
    </div>
  );
};

export default ViewSwitcher;
