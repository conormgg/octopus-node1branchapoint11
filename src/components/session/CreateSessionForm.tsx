
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useCreateSessionForm } from '@/hooks/useCreateSessionForm';
import SavedClassesSection from './SavedClassesSection';
import SessionFormFields from './SessionFormFields';
import StudentListSection from './StudentListSection';
import TemplateActionDialog from './TemplateActionDialog';

interface CreateSessionFormProps {
  onSessionCreated: (sessionId: string) => void;
}

const CreateSessionForm: React.FC<CreateSessionFormProps> = ({ onSessionCreated }) => {
  const {
    title,
    duration,
    students,
    isLoading,
    selectedTemplateId,
    templates,
    templateButtonState,
    loadedTemplate,
    hasUnsavedChanges,
    showSaveAsNewOption,
    isClearedTemplate,
    templatesLoading,
    templateActions,
    setTitle,
    setDuration,
    addStudent,
    removeStudent,
    updateStudent,
    handleTemplateSelect,
    handleClearTemplate,
    handleEditTemplate,
    handleDeleteTemplate,
    handleSaveTemplate,
    handleUpdateTemplate,
    handleSaveAsNew,
    handleConfirmAction,
    handleSubmit,
  } = useCreateSessionForm(onSessionCreated);

  const dialogProps = templateActions.getDialogProps();

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create New Session
          </CardTitle>
          <CardDescription>
            Set up a new collaborative whiteboard session for your class
            {loadedTemplate && !isClearedTemplate && (
              <div className="text-xs text-muted-foreground mt-1">
                Tip: Press Ctrl+Shift+C to clear template connection
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <SavedClassesSection
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onTemplateSelect={handleTemplateSelect}
              onClearTemplate={handleClearTemplate}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              isLoading={templatesLoading}
              hasUnsavedChanges={hasUnsavedChanges}
              isClearedTemplate={isClearedTemplate}
            />

            <SessionFormFields
              title={title}
              duration={duration}
              onTitleChange={setTitle}
              onDurationChange={setDuration}
            />

            <StudentListSection
              students={students}
              onAddStudent={addStudent}
              onRemoveStudent={removeStudent}
              onUpdateStudent={updateStudent}
              onSaveTemplate={handleSaveTemplate}
              onUpdateTemplate={handleUpdateTemplate}
              onSaveAsNew={handleSaveAsNew}
              templateButtonState={templateButtonState}
              loadedTemplateName={loadedTemplate?.class_name}
              showSaveAsNewOption={showSaveAsNewOption}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Session...' : 'Start Session'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Template Action Confirmation Dialog */}
      {dialogProps && (
        <TemplateActionDialog
          open={templateActions.actionState.type !== null}
          onOpenChange={templateActions.closeDialog}
          title={dialogProps.title}
          description={dialogProps.description}
          confirmLabel={dialogProps.confirmLabel}
          variant={dialogProps.variant}
          onConfirm={handleConfirmAction}
        />
      )}
    </>
  );
};

export default CreateSessionForm;
