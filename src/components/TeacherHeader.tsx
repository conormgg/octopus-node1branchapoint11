
import React, { useState } from 'react';
import { GraduationCap, ChevronUp, ChevronDown, Columns2, Rows2, Settings, Copy, Check, ExternalLink, LogOut, X, UserMinus, Monitor, UserPlus, MonitorSpeaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import LayoutSelector from './LayoutSelector';
import AddStudentDialog from './session/AddStudentDialog';
import RemoveStudentDialog from './session/RemoveStudentDialog';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from './TeacherView';
import { SessionParticipant } from '@/types/student';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
}

interface TeacherHeaderProps {
  activeStudentCount?: number; // Keep for internal use
  currentLayout: LayoutOption | undefined;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  gridOrientation: GridOrientation;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onToggleSplitView?: () => void;
  isSplitViewActive?: boolean;
  onToggleDualBrowser?: () => void;
  isDualBrowserActive?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeSession?: Session | null;
  onEndSession?: () => void;
  onSignOut?: () => void;
  // Individual student management props
  sessionStudents?: SessionParticipant[];
  onAddIndividualStudent?: (name: string, email: string) => Promise<void>;
  onRemoveIndividualStudent?: (participantId: number) => Promise<void>;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  activeStudentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  gridOrientation,
  onLayoutChange,
  onOrientationChange,
  onToggleSplitView,
  isSplitViewActive = false,
  onToggleDualBrowser,
  isDualBrowserActive = false,
  isCollapsed = false,
  onToggleCollapse,
  activeSession,
  onEndSession,
  onSignOut,
  sessionStudents = [],
  onAddIndividualStudent,
  onRemoveIndividualStudent,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showRemoveStudentDialog, setShowRemoveStudentDialog] = useState(false);
  const { toast } = useToast();

  const shouldShowHeader = !isCollapsed || isHovered;

  const sessionUrl = activeSession ? `${window.location.origin}/session/${activeSession.unique_url_slug}` : '';

  const copyToClipboard = async () => {
    if (!sessionUrl) return;
    
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

  const openInNewWindow = () => {
    if (sessionUrl) {
      window.open(sessionUrl, '_blank');
    }
  };

  const handleAddStudent = async (name: string, email: string) => {
    if (onAddIndividualStudent) {
      await onAddIndividualStudent(name, email);
    }
  };

  const handleRemoveStudent = async (participantId: number) => {
    if (onRemoveIndividualStudent) {
      await onRemoveIndividualStudent(participantId);
    }
  };

  return (
    <>
      {isCollapsed && (
        <div 
          className="absolute top-0 left-0 right-0 h-4 z-50 bg-transparent"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      )}
      
      <div 
        className={`bg-white border-b border-gray-200 transition-all duration-300 ease-in-out ${
          shouldShowHeader 
            ? 'transform translate-y-0 opacity-100' 
            : 'transform -translate-y-full opacity-0 absolute top-0 left-0 right-0 z-40'
        }`}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => isCollapsed && setIsHovered(false)}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
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
            
            <div className="flex items-center space-x-6">
              {/* Layout Selector */}
              <LayoutSelector
                availableLayouts={availableLayouts}
                selectedLayoutId={selectedLayoutId}
                onLayoutChange={onLayoutChange}
              />

              {/* Grid Orientation Toggle */}
              {availableLayouts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Grid:</span>
                  <ToggleGroup
                    type="single"
                    value={gridOrientation}
                    onValueChange={(value) => value && onOrientationChange(value as GridOrientation)}
                    className="border rounded-lg p-1"
                  >
                    <ToggleGroupItem
                      value="columns-first"
                      aria-label="Columns first"
                      className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                      title="Columns first"
                    >
                      <Columns2 className="w-4 h-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="rows-first"
                      aria-label="Rows first"
                      className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                      title="Rows first"
                    >
                      <Rows2 className="w-4 h-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}
              
              {/* Split View Buttons */}
              <div className="flex items-center space-x-2">
                {onToggleSplitView && (
                  <Button
                    variant={isSplitViewActive ? "default" : "outline"}
                    size="sm"
                    onClick={onToggleSplitView}
                    className="flex items-center space-x-2"
                    disabled={isDualBrowserActive}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>{isSplitViewActive ? 'Close Split' : 'Split View'}</span>
                  </Button>
                )}
                
                {onToggleDualBrowser && (
                  <Button
                    variant={isDualBrowserActive ? "default" : "outline"}
                    size="sm"
                    onClick={onToggleDualBrowser}
                    className="flex items-center space-x-2 relative"
                    disabled={isSplitViewActive}
                    title={isDualBrowserActive ? 'Close dual browser view' : 'Open student boards in separate window (ideal for dual monitors)'}
                  >
                    <div className="relative">
                      <MonitorSpeaker className="w-4 h-4" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center text-[8px] font-bold">
                        2
                      </span>
                    </div>
                    <span>{isDualBrowserActive ? 'Close Dual' : 'Split View 2'}</span>
                  </Button>
                )}
              </div>

              {/* Session Options Dropdown */}
              {activeSession && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Session Options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80 bg-white" align="end">
                    <DropdownMenuLabel className="font-semibold">
                      Active Session: {activeSession.title}
                    </DropdownMenuLabel>
                    <div className="px-2 py-1 text-xs text-gray-500">
                      Session ID: {activeSession.id}
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuLabel className="text-sm font-medium">
                      Student Access URL
                    </DropdownMenuLabel>
                    <div className="px-2 py-2">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs font-mono">
                        <span className="flex-1 truncate">{sessionUrl}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyToClipboard}
                          className="h-6 w-6 p-0"
                        >
                          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
                      <Copy className="w-4 h-4 mr-2" />
                      {copied ? 'Copied!' : 'Copy URL'}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={openInNewWindow} className="cursor-pointer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Window
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={() => setShowAddStudentDialog(true)} 
                      className="cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Student
                    </DropdownMenuItem>
                    
                    {sessionStudents.length > 0 && (
                      <DropdownMenuItem 
                        onClick={() => setShowRemoveStudentDialog(true)} 
                        className="cursor-pointer"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remove Student
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      onClick={onEndSession} 
                      className="cursor-pointer text-orange-600 focus:text-orange-600"
                    >
                      <X className="w-4 h-4 mr-2" />
                      End Session
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={onSignOut} 
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Hide Controls Button */}
              {onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className="flex items-center space-x-1"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Show Controls</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Hide Controls</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Dialog */}
      <AddStudentDialog
        isOpen={showAddStudentDialog}
        onClose={() => setShowAddStudentDialog(false)}
        onAddStudent={handleAddStudent}
      />

      {/* Remove Student Dialog */}
      <RemoveStudentDialog
        isOpen={showRemoveStudentDialog}
        onClose={() => setShowRemoveStudentDialog(false)}
        onRemoveStudent={handleRemoveStudent}
        sessionStudents={sessionStudents}
      />
    </>
  );
};

export default TeacherHeader;
