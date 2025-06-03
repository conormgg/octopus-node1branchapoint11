
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useCreateSessionForm } from '@/hooks/useCreateSessionForm';
import SavedClassesSection from './SavedClassesSection';
import SessionFormFields from './SessionFormFields';
import StudentListSection from './StudentListSection';

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
    showSaveButton,
    setTitle,
    setDuration,
    addStudent,
    removeStudent,
    updateStudent,
    handleTemplateSelect,
    handleEditTemplate,
    handleDeleteTemplate,
    handleSaveTemplate,
    handleSubmit,
  } = useCreateSessionForm(onSessionCreated);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Create New Session
        </CardTitle>
        <CardDescription>
          Set up a new collaborative whiteboard session for your class
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <SavedClassesSection
            templates={templates}
            selectedTemplateId={selectedTemplateId}
            onTemplateSelect={handleTemplateSelect}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
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
            showSaveButton={showSaveButton}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Session...' : 'Start Session'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateSessionForm;
