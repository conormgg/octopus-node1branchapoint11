
import React from 'react';
import { useParams } from 'react-router-dom';
import { useSessionData } from '@/hooks/useSessionData';
import StudentMonitorContent from '@/components/StudentMonitorContent';
import { InvalidSessionError, LoadingState, SessionNotFoundError } from '@/components/StudentMonitorErrorStates';

const StudentMonitorPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, loading } = useSessionData(sessionId);

  if (!sessionId) {
    return <InvalidSessionError />;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!session) {
    return <SessionNotFoundError />;
  }

  return <StudentMonitorContent session={session} sessionId={sessionId} />;
};

export default StudentMonitorPage;
