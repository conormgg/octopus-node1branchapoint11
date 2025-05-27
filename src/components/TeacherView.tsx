import React, { useState } from 'react';
import TeacherHeader from './TeacherHeader';
import TeacherMainBoard from './TeacherMainBoard';
import StudentBoardsGrid from './StudentBoardsGrid';
import { WindowManager } from './WindowManager';
import { calculateLayoutOptions, generateStudentBoards, getStudentBoardsForPage } from '@/utils/layoutCalculator';
import type { LayoutOption } from '@/utils/layoutCalculator';
import { useToast } from '@/hooks/use-toast';
import { Settings, Copy, Check, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export type GridOrientation = 'columns-first' | 'rows-first';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
}

interface TeacherViewProps {
  activeSession: Session;
  onEndSession: () => void;
  onSignOut: () => void;
}

const TeacherView: React.FC<TeacherViewProps> = ({ activeSession, onEndSession, onSignOut }) => {
  const [studentCount, setStudentCount] = useState(4);
  const [selectedLayoutId, setSelectedLayoutId] = useState('2x2');
  const [gridOrientation, setGridOrientation] = useState<GridOrientation>('columns-first');
  const [isSplitViewActive, setIsSplitViewActive] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const { toast } = useToast();

  const availableLayouts: LayoutOption[] = calculateLayoutOptions(studentCount);
  const currentLayout = availableLayouts.find(layout => layout.id === selectedLayoutId) || availableLayouts[0];
  
  const studentBoards = generateStudentBoards(studentCount);
  const totalPages = currentLayout ? currentLayout.totalPages : 1;
  const currentStudentBoards = currentLayout ? getStudentBoardsForPage(studentBoards, currentPage, currentLayout.studentsPerPage) : [];

  const handleIncreaseStudentCount = () => {
    if (studentCount < 8) {
      setStudentCount(prev => prev + 1);
    }
  };

  const handleDecreaseStudentCount = () => {
    if (studentCount > 1) {
      setStudentCount(prev => prev - 1);
    }
  };

  const handleLayoutChange = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
  };

  const handleOrientationChange = (orientation: GridOrientation) => {
    setGridOrientation(orientation);
  };

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

  const copySessionUrl = async () => {
    const sessionUrl = `${window.location.origin}/session/${activeSession.unique_url_slug}`;
    
    try {
      await navigator.clipboard.writeText(sessionUrl);
      setCopied(true);
      toast({
        title: "URL Copied!",
        description: "Session URL has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  const openSessionInNewWindow = () => {
    const sessionUrl = `${window.location.origin}/session/${activeSession.unique_url_slug}`;
    window.open(sessionUrl, '_blank');
  };

  // Session Options Dropdown Component
  const SessionOptionsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Session Options
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Student Access URL</DropdownMenuLabel>
        <div className="px-2 py-1.5">
          <p className="text-sm text-gray-600 mb-2">
            Share this URL with your students to join the session
          </p>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
            <code className="text-sm flex-1 break-all">
              {`${window.location.origin}/session/${activeSession.unique_url_slug}`}
            </code>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copySessionUrl}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? 'Copied!' : 'Copy URL'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openSessionInNewWindow}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in New Window
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEndSession} className="text-red-600">
          End Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <TeacherHeader
        studentCount={studentCount}
        currentLayout={currentLayout}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        gridOrientation={gridOrientation}
        onIncreaseStudentCount={handleIncreaseStudentCount}
        onDecreaseStudentCount={handleDecreaseStudentCount}
        onLayoutChange={handleLayoutChange}
        onOrientationChange={handleOrientationChange}
        onToggleSplitView={() => setIsSplitViewActive(!isSplitViewActive)}
        isSplitViewActive={isSplitViewActive}
        isCollapsed={isHeaderCollapsed}
        onToggleCollapse={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
        sessionTitle={activeSession.title}
        sessionId={activeSession.id}
        sessionOptionsDropdown={<SessionOptionsDropdown />}
        onSignOut={onSignOut}
      />
      
      <div className="flex-1 flex">
        {isSplitViewActive ? (
          <WindowManager studentCount={studentCount} />
        ) : (
          <>
            <div className="w-1/2 border-r border-gray-300">
              <TeacherMainBoard onMaximize={handleMaximize} isHeaderCollapsed={isHeaderCollapsed} />
            </div>
            <div className="w-1/2">
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
                isHeaderCollapsed={isHeaderCollapsed}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherView;
