
import React from 'react';
import { GraduationCap } from 'lucide-react';

interface TeacherHeaderLogoProps {
  isCollapsed: boolean;
}

const TeacherHeaderLogo: React.FC<TeacherHeaderLogoProps> = ({ isCollapsed }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
        <GraduationCap className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Teacher Dashboard</h1>
        {!isCollapsed && (
          <p className="text-sm text-gray-500">Collaborative Whiteboard Session</p>
        )}
      </div>
    </div>
  );
};

export default TeacherHeaderLogo;
