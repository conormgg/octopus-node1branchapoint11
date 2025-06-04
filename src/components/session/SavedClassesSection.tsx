
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { BookOpen, Trash2, ChevronDown, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface ClassTemplate {
  id: number;
  class_name: string;
  duration_minutes: number | null;
  created_at: string;
  students: Array<{
    student_name: string;
    student_email: string | null;
  }>;
}

interface SavedClassesSectionProps {
  templates: ClassTemplate[];
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
  onDeleteTemplate?: (template: ClassTemplate) => void;
  onCompleteReset?: () => void;
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
  shouldShowResetButton?: boolean;
}

const SavedClassesSection: React.FC<SavedClassesSectionProps> = ({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  onDeleteTemplate,
  onCompleteReset,
  isLoading = false,
  hasUnsavedChanges = false,
  shouldShowResetButton = false,
}) => {
  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Saved Classes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0 && !shouldShowResetButton) return null;

  const selectedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Saved Classes
          {hasUnsavedChanges && selectedTemplate && (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
              Unsaved Changes
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={`w-full justify-between ${hasUnsavedChanges && selectedTemplate ? 'border-orange-200 bg-orange-50' : ''}`}
              >
                {selectedTemplate 
                  ? `${selectedTemplate.class_name} (${selectedTemplate.students.length} students)`
                  : "Select a saved class"
                }
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-md">
              {templates.map((template, index) => (
                <React.Fragment key={template.id}>
                  <DropdownMenuItem
                    className="flex items-center justify-between cursor-pointer p-3"
                    onSelect={() => onTemplateSelect(template.id.toString())}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{template.class_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.students.length} students
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteTemplate?.(template);
                        }}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                  {index < templates.length - 1 && <DropdownMenuSeparator />}
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {shouldShowResetButton && (
          <Button
            variant="outline"
            className="w-full text-muted-foreground hover:text-destructive hover:border-destructive"
            onClick={onCompleteReset}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedClassesSection;
