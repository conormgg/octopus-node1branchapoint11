
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SessionStatusProps {
  sessionId?: string;
  expiresAt?: Date;
  isExpired: boolean;
  sessionEndReason?: string;
  isRedirecting: boolean;
}

const SessionStatus: React.FC<SessionStatusProps> = ({
  sessionId,
  expiresAt,
  isExpired,
  sessionEndReason,
  isRedirecting
}) => {
  const sessionStatus = sessionId && expiresAt && !isExpired && (
    <div className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150 flex items-center space-x-2 select-none">
      <div className="w-2 h-2 rounded-full bg-green-500"></div>
      <span className="text-xs text-gray-600">
        Session active until {expiresAt.toLocaleTimeString()}
      </span>
    </div>
  );

  const sessionWarning = sessionId && isExpired && !isRedirecting && (
    <div className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-red-50 border border-red-200 shadow-sm transition-all duration-150 flex items-center space-x-2 select-none">
      <AlertCircle size={14} className="text-red-500" />
      <span className="text-xs text-red-600">
        {sessionEndReason === 'ended_by_teacher' ? 'Session ended' : 'Session expired'}
      </span>
    </div>
  );

  return (
    <>
      {sessionStatus}
      {sessionWarning}
    </>
  );
};

export default SessionStatus;
