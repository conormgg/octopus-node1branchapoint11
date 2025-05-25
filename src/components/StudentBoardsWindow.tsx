import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Users, Plus, Minus, UserPlus, ChevronUp, ChevronDown } from 'lucide-react';
import StudentBoardsGrid from './StudentBoardsGrid';
import LayoutSelector from './LayoutSelector';
import { LayoutOption } from '@/utils/layoutCalculator';

interface StudentBoardsWindowProps {
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  currentStudentBoards: string[];
  currentPage: number;
  totalPages: number;
  onMaximize: (boardId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLayoutChange: (layoutId: string) => void;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onClose: () => void;
}

const StudentBoardsWindow: React.FC<StudentBoardsWindowProps> = ({
  studentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  currentStudentBoards,
  currentPage,
  totalPages,
  onMaximize,
  onPreviousPage,
  onNextPage,
  onLayoutChange,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onClose,
}) => {
  const windowRef = useRef<Window | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showOptionsBar, setShowOptionsBar] = useState(true);

  // Create and setup window only once - this should never re-run unless component unmounts
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
        
        // Small delay to ensure DOM is ready, then set ready state
        setTimeout(() => {
          console.log('Setting ready state to true');
          setIsReady(true);
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
      setIsReady(false);
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

  // Log prop changes for debugging
  useEffect(() => {
    console.log('Props changed in StudentBoardsWindow:', {
      studentCount,
      currentLayout: currentLayout?.name,
      currentStudentBoards,
      currentPage,
      totalPages,
      isReady,
      hasContainer: !!containerRef.current
    });
  }, [studentCount, currentLayout, currentStudentBoards, currentPage, totalPages, isReady]);

  // Don't render portal until container is ready
  if (!containerRef.current || !isReady) {
    console.log('Container or window not ready yet', { container: !!containerRef.current, isReady });
    return null;
  }

  console.log('Rendering portal content', { studentCount, currentLayout, currentStudentBoards });

  return createPortal(
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Toggle Button - Always visible */}
      <div className="p-2 bg-white border-b border-gray-200 flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowOptionsBar(!showOptionsBar)}
          className="flex items-center space-x-2"
        >
          {showOptionsBar ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>{showOptionsBar ? 'Hide Controls' : 'Show Controls'}</span>
        </Button>
      </div>

      {/* Options Bar */}
      {showOptionsBar && (
        <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Student Boards Monitor</h1>
              <p className="text-sm text-gray-500">
                Viewing {studentCount} student{studentCount !== 1 ? 's' : ''} - 
                {currentLayout ? ` ${currentLayout.name} layout` : ''} - 
                Page {currentPage + 1} of {totalPages}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex items-center space-x-2"
            >
              <span>Close Split View</span>
            </Button>
          </div>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Layout Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Layout:</span>
              <LayoutSelector
                availableLayouts={availableLayouts}
                selectedLayoutId={selectedLayoutId}
                onLayoutChange={onLayoutChange}
              />
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Add Student Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onIncreaseStudentCount}
                disabled={studentCount >= 8}
                className="flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Student</span>
              </Button>
              
              {/* Student Count Controls */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {studentCount} Student{studentCount !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDecreaseStudentCount}
                    disabled={studentCount <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onIncreaseStudentCount}
                    disabled={studentCount >= 8}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 p-4 ${showOptionsBar ? 'h-[calc(100vh-12rem)]' : 'h-[calc(100vh-4rem)]'}`}>
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
