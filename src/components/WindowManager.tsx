
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import StudentBoardsGrid from './StudentBoardsGrid';
import { calculateLayoutOptions, generateStudentBoards, getStudentBoardsForPage } from '@/utils/layoutCalculator';
import type { LayoutOption } from '@/utils/layoutCalculator';
import type { GridOrientation } from './TeacherView';

interface WindowManagerProps {
  studentCount: number;
}

export const useWindowManager = ({ onWindowReady, onClose }: {
  onWindowReady: (container: HTMLDivElement) => void;
  onClose: () => void;
}) => {
  const windowRef = React.useRef<Window | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

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

        // Set up container after styles are loaded
        setupContainer();
      };
      
      const setupContainer = () => {
        // Ensure html and body take full height and are ready for flex children
        newWindow.document.documentElement.style.height = '100%';
        newWindow.document.documentElement.style.margin = '0';
        newWindow.document.documentElement.style.padding = '0';

        newWindow.document.body.style.height = '100%';
        newWindow.document.body.style.margin = '0';
        newWindow.document.body.style.padding = '0';
        newWindow.document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        newWindow.document.body.style.backgroundColor = '#f3f4f6'; // gray-100
        newWindow.document.body.style.display = 'flex';
        newWindow.document.body.style.flexDirection = 'column';
        
        // Create container div with proper flex setup
        const container = newWindow.document.createElement('div');
        container.id = 'student-boards-container';
        container.style.flex = '1'; // Make the container grow to fill the body
        container.style.display = 'flex'; // Make it a flex container for its own children
        container.style.flexDirection = 'column'; // Stack its children vertically
        container.style.width = '100%';
        container.style.minHeight = '0'; // Important for nested flex containers
        newWindow.document.body.appendChild(container);
        containerRef.current = container;
        
        console.log('Container created and added to new window with flex styles');
        
        // Small delay to ensure DOM is ready, then notify parent
        setTimeout(() => {
          console.log('Setting ready state to true');
          if (containerRef.current) {
            onWindowReady(containerRef.current);
          }
        }, 100);
      };
      
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
  }, []); // Empty dependency array - only run once when component mounts

  // Handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
      }
    };
  }, []);

  return { windowRef, containerRef };
};

export const WindowManager: React.FC<WindowManagerProps> = ({ studentCount }) => {
  const [isWindowReady, setIsWindowReady] = useState(false);
  const [windowContainer, setWindowContainer] = useState<HTMLDivElement | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState('2x2');
  const [gridOrientation, setGridOrientation] = useState<GridOrientation>('columns-first');
  const [currentPage, setCurrentPage] = useState(0);

  const availableLayouts: LayoutOption[] = calculateLayoutOptions(studentCount);
  const currentLayout = availableLayouts.find(layout => layout.id === selectedLayoutId) || availableLayouts[0];
  
  const studentBoards = generateStudentBoards(studentCount);
  const totalPages = currentLayout ? currentLayout.totalPages : 1;
  const currentStudentBoards = currentLayout ? getStudentBoardsForPage(studentBoards, currentPage, currentLayout.studentsPerPage) : [];

  const { windowRef } = useWindowManager({
    onWindowReady: (container) => {
      console.log('Window ready callback triggered');
      setWindowContainer(container);
      setIsWindowReady(true);
    },
    onClose: () => {
      console.log('Window close callback triggered');
      setIsWindowReady(false);
      setWindowContainer(null);
    }
  });

  const handleMaximize = (boardId: string) => {
    console.log('Maximize board:', boardId);
    // TODO: Implement maximize functionality
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (!isWindowReady || !windowContainer) {
    return null;
  }

  return createPortal(
    <StudentBoardsGrid
      studentCount={studentCount}
      currentLayout={currentLayout}
      currentStudentBoards={currentStudentBoards}
      currentPage={currentPage}
      totalPages={totalPages}
      gridOrientation={gridOrientation}
      onMaximize={handleMaximize}
      onPreviousPage={handlePreviousPage}
      onNextPage={handleNextPage}
      isHeaderCollapsed={false}
    />,
    windowContainer
  );
};
