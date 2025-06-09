
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SessionStatusIndicatorProps {
  sessionId?: string;
  expiresAt?: Date;
  isExpired: boolean;
  isRedirecting: boolean;
  sessionEndReason?: string;
}

const SessionStatusIndicator: React.FC<SessionStatusIndicatorProps> = ({
  sessionId,
  expiresAt,
  isExpired,
  isRedirecting,
  sessionEndReason
}) => {
  if (!sessionId) return null;

  if (isExpired && !isRedirecting) {
    return (
      <div className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-red-50 border border-red-200 shadow-sm transition-all duration-150 flex items-center space-x-2">
        <AlertCircle size={14} className="text-red-500" />
        <span className="text-xs text-red-600">
          {sessionEndReason === 'ended_by_teacher' ? 'Session ended' : 'Session expired'}
        </span>
      </div>
    );
  }

  if (expiresAt && !isExpired) {
    return (
      <div className="absolute top-3 left-3 z-10 p-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150 flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <span className="text-xs text-gray-600">
          Session active until {expiresAt.toLocaleTimeString()}
        </span>
      </div>
    );
  }

  return null;
};

export default SessionStatusIndicator;
