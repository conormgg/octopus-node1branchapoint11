
import React from 'react';
import { User, BookOpen } from 'lucide-react';

const StudentHeader: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-green-500" />
            <h1 className="text-xl font-semibold text-gray-900">Student Workspace</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>Student View</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StudentHeader;
