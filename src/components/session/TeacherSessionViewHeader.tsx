
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Plus, 
  Minus, 
  UserPlus, 
  ChevronUp, 
  ChevronDown, 
  Columns2, 
  Rows2,
  LogOut,
  XCircle,
  Settings
} from 'lucide-react';
import LayoutSelector from '../LayoutSelector';
import SyncDirectionToggle from './SyncDirectionToggle';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from '../TeacherView';
import { useSessionParticipants } from '@/hooks/useSessionParticipants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TeacherSessionViewHeaderProps {
  studentCount: number;
  currentLayout: any;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  gridOrientation: GridOrientation;
  isSplitViewActive: boolean;
  isControlsCollapsed: boolean;
  activeSession: {
    id: string;
    title: string;
    unique_url_slug: string;
    status: string;
    created_at: string;
    teacher_id: string;
  };
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onToggleSplitView: () => void;
  onToggleControlsCollapse: () => void;
  onEndSession: () => void;
  onSignOut: () => void;
}

const TeacherSessionViewHeader: React.FC<TeacherSessionViewHeaderProps> = ({
  studentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  gridOrientation,
  isSplitViewActive,
  isControlsCollapsed,
  activeSession,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onLayoutChange,
  onOrientationChange,
  onToggleSplitView,
  onToggleControlsCollapse,
  onEndSession,
  onSignOut,
}) => {
  const [syncControlsOpen, setSyncControlsOpen] = useState(false);
  const { participants, updateSyncDirection } = useSessionParticipants(activeSession.id);

  const handleOrientationToggle = () => {
    onOrientationChange(gridOrientation === 'columns-first' ? 'rows-first' : 'columns-first');
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {activeSession.title}
            </h1>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Active Session
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Sync Direction Controls */}
            <Collapsible open={syncControlsOpen} onOpenChange={setSyncControlsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Sync Controls ({participants.length})
                  {syncControlsOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>

            {/* Layout Controls */}
            <LayoutSelector
              availableLayouts={availableLayouts}
              selectedLayoutId={selectedLayoutId}
              onLayoutChange={onLayoutChange}
            />
            
            <div className="flex items-center space-x-2">
              <Columns2 className="w-4 h-4 text-gray-600" />
              <Switch
                checked={gridOrientation === 'rows-first'}
                onCheckedChange={handleOrientationToggle}
              />
              <Rows2 className="w-4 h-4 text-gray-600" />
            </div>

            {/* Student Count Controls */}
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

            {/* Split View Toggle */}
            <Button
              variant={isSplitViewActive ? "default" : "outline"}
              size="sm"
              onClick={onToggleSplitView}
            >
              Split View
            </Button>

            {/* Session Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={onEndSession}
            >
              <XCircle className="w-4 h-4 mr-2" />
              End Session
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleControlsCollapse}
            >
              {isControlsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Sync Direction Controls Panel */}
        <CollapsibleContent>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Student Sync Controls</CardTitle>
                <p className="text-sm text-gray-600">
                  Control who has drawing authority for each student board. 
                  <span className="font-medium text-green-600"> Teacher Active</span> means you control the board, 
                  <span className="font-medium text-blue-600"> Student Active</span> means the student controls it.
                </p>
              </CardHeader>
              <CardContent>
                {participants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {participants.map((participant) => (
                      <SyncDirectionToggle
                        key={participant.id}
                        participant={participant}
                        onToggle={updateSyncDirection}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No students have joined this session yet.</p>
                    <p className="text-sm">Share the session URL to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CollapsibleContent>
      </div>
    </div>
  );
};

export default TeacherSessionViewHeader;
