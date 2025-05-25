
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
    console.log('Opening student boards window...');
    
    // Open new window
    const newWindow = window.open(
      '',
      'studentBoards',
      'width=1200,height=800,scrollbars=yes,resizable=yes'
    );

    if (newWindow) {
      console.log('New window opened successfully');
      windowRef.current = newWindow;
      
      // Set up the new window
      newWindow.document.title = 'Student Boards - Collaborative Whiteboard';
      
      // Clear any existing content
      newWindow.document.head.innerHTML = '';
      newWindow.document.body.innerHTML = '';
      
      // Add meta viewport
      const viewport = newWindow.document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1';
      newWindow.document.head.appendChild(viewport);
      
      // Add Tailwind CSS first
      const tailwindLink = newWindow.document.createElement('link');
      tailwindLink.rel = 'stylesheet';
      tailwindLink.href = 'https://cdn.tailwindcss.com';
      newWindow.document.head.appendChild(tailwindLink);
      
      // Wait for Tailwind to load, then copy other styles
      tailwindLink.onload = () => {
        console.log('Tailwind CSS loaded in new window');
        
        // Copy all stylesheets from parent window
        const parentStylesheets = document.querySelectorAll('link[rel="stylesheet"], style');
        console.log(`Found ${parentStylesheets.length} stylesheets to copy`);
        
        parentStylesheets.forEach((style, index) => {
          if (style.tagName === 'LINK') {
            const link = style as HTMLLinkElement;
            // Skip if it's already Tailwind
            if (!link.href.includes('tailwindcss.com')) {
              const newLink = newWindow.document.createElement('link');
              newLink.rel = 'stylesheet';
              newLink.type = 'text/css';
              newLink.href = link.href;
              newWindow.document.head.appendChild(newLink);
              console.log(`Copied stylesheet ${index + 1}: ${link.href}`);
            }
          } else if (style.tagName === 'STYLE') {
            const newStyle = newWindow.document.createElement('style');
            newStyle.type = 'text/css';
            newStyle.textContent = style.textContent;
            newWindow.document.head.appendChild(newStyle);
            console.log(`Copied inline style ${index + 1}`);
          }
        });
      };
      
      // Set body styles
      newWindow.document.body.style.margin = '0';
      newWindow.document.body.style.padding = '0';
      newWindow.document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      newWindow.document.body.style.backgroundColor = '#f3f4f6'; // gray-100
      
      // Create container div
      const container = newWindow.document.createElement('div');
      container.id = 'student-boards-container';
      container.style.minHeight = '100vh';
      container.style.width = '100%';
      newWindow.document.body.appendChild(container);
      containerRef.current = container;
      
      console.log('Container created and added to new window');
      
      // Handle window close
      const handleBeforeUnload = () => {
        console.log('New window is closing');
        onClose();
      };
      
      newWindow.addEventListener('beforeunload', handleBeforeUnload);
      
      // Cleanup function
      return () => {
        newWindow.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } else {
      console.error('Failed to open new window - popup might be blocked');
    }

    return () => {
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
      }
    };
  }, [onClose]);

  if (!containerRef.current) {
    console.log('Container not ready yet');
    return null;
  }

  console.log('Rendering portal content', { studentCount, currentLayout, currentStudentBoards });

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
