
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import StudentBoardsGrid from './StudentBoardsGrid';
import { LayoutOption } from '@/utils/layoutCalculator';

interface StudentBoardsWindowProps {
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  currentStudentBoards: string[];
  currentPage: number;
  totalPages: number;
  onMaximize: (boardId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onClose: () => void;
}

const StudentBoardsWindow: React.FC<StudentBoardsWindowProps> = ({
  studentCount,
  currentLayout,
  currentStudentBoards,
  currentPage,
  totalPages,
  onMaximize,
  onPreviousPage,
  onNextPage,
  onClose,
}) => {
  const windowRef = useRef<Window | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Open new window
    const newWindow = window.open(
      '',
      'studentBoards',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );

    if (newWindow) {
      windowRef.current = newWindow;
      
      // Set up the new window
      newWindow.document.title = 'Student Boards - Collaborative Whiteboard';
      
      // Copy all stylesheets from parent window
      const parentStylesheets = document.querySelectorAll('link[rel="stylesheet"], style');
      parentStylesheets.forEach(style => {
        if (style.tagName === 'LINK') {
          const link = style as HTMLLinkElement;
          const newLink = newWindow.document.createElement('link');
          newLink.rel = 'stylesheet';
          newLink.type = 'text/css';
          newLink.href = link.href;
          newWindow.document.head.appendChild(newLink);
        } else if (style.tagName === 'STYLE') {
          const newStyle = newWindow.document.createElement('style');
          newStyle.type = 'text/css';
          newStyle.textContent = style.textContent;
          newWindow.document.head.appendChild(newStyle);
        }
      });

      // Add Tailwind CSS if not already included
      const tailwindLink = newWindow.document.createElement('link');
      tailwindLink.rel = 'stylesheet';
      tailwindLink.href = 'https://cdn.tailwindcss.com';
      newWindow.document.head.appendChild(tailwindLink);
      
      // Reset body styles
      newWindow.document.body.style.margin = '0';
      newWindow.document.body.style.padding = '0';
      newWindow.document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      
      // Create container div
      const container = newWindow.document.createElement('div');
      container.id = 'student-boards-container';
      newWindow.document.body.appendChild(container);
      containerRef.current = container;
      
      // Handle window close
      const handleBeforeUnload = () => {
        onClose();
      };
      
      newWindow.addEventListener('beforeunload', handleBeforeUnload);
      
      // Cleanup function
      return () => {
        newWindow.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }

    return () => {
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
      }
    };
  }, [onClose]);

  if (!containerRef.current) {
    return null;
  }

  return createPortal(
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mb-4">
        <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Student Boards Monitor</h1>
          <p className="text-sm text-gray-500">
            Viewing {studentCount} student{studentCount !== 1 ? 's' : ''} - 
            {currentLayout ? ` ${currentLayout.name} layout` : ''} - 
            Page {currentPage + 1} of {totalPages}
          </p>
        </div>
      </div>
      <div className="h-[calc(100vh-8rem)]">
        <StudentBoardsGrid
          studentCount={studentCount}
          currentLayout={currentLayout}
          currentStudentBoards={currentStudentBoards}
          currentPage={currentPage}
          totalPages={totalPages}
          onMaximize={onMaximize}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
      </div>
    </div>,
    containerRef.current
  );
};

export default StudentBoardsWindow;
