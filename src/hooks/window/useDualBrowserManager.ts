import { useEffect, useRef } from 'react';

interface DualBrowserManagerProps {
  onStudentWindowReady: (container: HTMLDivElement) => void;
  onClose: () => void;
}

export const useDualBrowserManager = ({ onStudentWindowReady, onClose }: DualBrowserManagerProps) => {
  const studentWindowRef = useRef<Window | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log('[DualBrowserManager] Opening student boards window...');
    
    // Open new window for student boards only
    const newWindow = window.open(
      '',
      'studentBoardsOnly',
      'width=1400,height=900,scrollbars=yes,resizable=yes'
    );

    if (newWindow) {
      console.log('[DualBrowserManager] Student boards window opened successfully');
      studentWindowRef.current = newWindow;
      
      // Set up the new window
      newWindow.document.title = 'Student Boards Monitor - Collaborative Whiteboard';
      
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
        console.log('[DualBrowserManager] Tailwind CSS loaded in student window');
        
        // Copy all stylesheets from parent window
        const parentStylesheets = document.querySelectorAll('link[rel="stylesheet"], style');
        console.log(`[DualBrowserManager] Found ${parentStylesheets.length} stylesheets to copy`);
        
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
              console.log(`[DualBrowserManager] Copied stylesheet ${index + 1}: ${link.href}`);
            }
          } else if (style.tagName === 'STYLE') {
            const newStyle = newWindow.document.createElement('style');
            newStyle.type = 'text/css';
            newStyle.textContent = style.textContent;
            newWindow.document.head.appendChild(newStyle);
            console.log(`[DualBrowserManager] Copied inline style ${index + 1}`);
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
        container.id = 'student-boards-only-container';
        container.style.flex = '1';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.width = '100%';
        container.style.minHeight = '0';
        newWindow.document.body.appendChild(container);
        containerRef.current = container;
        
        console.log('[DualBrowserManager] Student container created and added to new window');
        
        // Small delay to ensure DOM is ready, then notify parent
        setTimeout(() => {
          console.log('[DualBrowserManager] Student window ready');
          if (containerRef.current) {
            onStudentWindowReady(containerRef.current);
          }
        }, 100);
      };
      
      // Handle window close and focus events
      const handleBeforeUnload = () => {
        console.log('[DualBrowserManager] Student window is closing');
        onClose();
      };
      
      const handleFocus = () => {
        console.log('[DualBrowserManager] Student window gained focus');
      };

      const handleBlur = () => {
        console.log('[DualBrowserManager] Student window lost focus');
      };

      // Add popup blocker detection
      const checkWindow = () => {
        if (newWindow.closed) {
          console.log('[DualBrowserManager] Window was closed or blocked');
          onClose();
        }
      };

      // Check if window was blocked (popup blocker)
      setTimeout(() => {
        if (newWindow.closed || !newWindow.window) {
          console.error('[DualBrowserManager] Popup blocked or window failed to open');
          onClose();
        }
      }, 100);
      
      newWindow.addEventListener('beforeunload', handleBeforeUnload);
      newWindow.addEventListener('focus', handleFocus);
      newWindow.addEventListener('blur', handleBlur);
      
      // Cleanup function
      return () => {
        newWindow.removeEventListener('beforeunload', handleBeforeUnload);
        newWindow.removeEventListener('focus', handleFocus);
        newWindow.removeEventListener('blur', handleBlur);
      };
    } else {
      console.error('[DualBrowserManager] Failed to open student window - popup might be blocked');
      // Show user-friendly error message
      alert('Unable to open student boards window. Please check if popup blocker is enabled and allow popups for this site.');
      onClose();
    }

    return () => {
      if (studentWindowRef.current && !studentWindowRef.current.closed) {
        console.log('[DualBrowserManager] Closing student window on cleanup');
        studentWindowRef.current.close();
      }
    };
  }, []);

  // Handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (studentWindowRef.current && !studentWindowRef.current.closed) {
        console.log('[DualBrowserManager] Closing student window on component unmount');
        studentWindowRef.current.close();
      }
    };
  }, []);

  return { studentWindowRef, containerRef };
};