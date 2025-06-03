
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { BookOpen, Edit, Trash2, ChevronDown } from 'lucide-react';

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
  onEditTemplate?: (template: ClassTemplate) => void;
  onDeleteTemplate?: (template: ClassTemplate) => void;
}

const SavedClassesSection: React.FC<SavedClassesSectionProps> = ({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  onEditTemplate,
  onDeleteTemplate,
}) => {
  if (templates.length === 0) return null;

  const selectedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Saved Classes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
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
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};

export default SavedClassesSection;
