
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { BookOpen, Edit, Trash2, ChevronDown, X, Copy } from 'lucide-react';
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
  onClearTemplate?: () => void;
  onEditTemplate?: (template: ClassTemplate) => void;
  onDeleteTemplate?: (template: ClassTemplate) => void;
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
  isClearedTemplate?: boolean;
}

const SavedClassesSection: React.FC<SavedClassesSectionProps> = ({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  onClearTemplate,
  onEditTemplate,
  onDeleteTemplate,
  isLoading = false,
  hasUnsavedChanges = false,
  isClearedTemplate = false,
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

  if (templates.length === 0) return null;

  const selectedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);
  const showClearButton = selectedTemplate && !isClearedTemplate;

  return (
    <Card className={`border-dashed ${isClearedTemplate ? 'bg-blue-50/50 border-blue-200' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Saved Classes
          {hasUnsavedChanges && selectedTemplate && !isClearedTemplate && (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
              Unsaved Changes
            </Badge>
          )}
          {isClearedTemplate && (
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
              <Copy className="h-3 w-3 mr-1" />
              Working Copy
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={`w-full justify-between ${
                hasUnsavedChanges && selectedTemplate && !isClearedTemplate 
                  ? 'border-orange-200 bg-orange-50' 
                  : isClearedTemplate 
                    ? 'border-blue-200 bg-blue-50' 
                    : ''
              }`}
              disabled={isClearedTemplate}
            >
              {isClearedTemplate 
                ? "Working with template copy"
                : selectedTemplate 
                  ? `${selectedTemplate.class_name} (${selectedTemplate.students.length} students)`
                  : "Select a saved class"
              }
              {!isClearedTemplate && <ChevronDown className="h-4 w-4 opacity-50" />}
            </Button>
          </DropdownMenuTrigger>
          {!isClearedTemplate && (
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
                          onEditTemplate?.(template);
                        }}
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
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
          )}
        </DropdownMenu>
        
        {showClearButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearTemplate}
            className="w-full text-muted-foreground hover:text-foreground border-dashed"
            title="Clear template connection (Ctrl+Shift+C)"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Template (Keep Data)
          </Button>
        )}

        {isClearedTemplate && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
            <div className="font-medium mb-1">Working with template copy</div>
            <div>You're working with a copy of the template data. Any changes can be saved as a new template.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedClassesSection;
