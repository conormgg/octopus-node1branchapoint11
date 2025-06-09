
export interface UseSessionExpirationProps {
  sessionId: string | null;
  onSessionExpired?: () => void;
}

export interface SessionExpirationState {
  isExpired: boolean;
  expiresAt: Date | null;
  timeRemaining: number | null;
  sessionEndReason: 'expired' | 'ended_by_teacher' | null;
  hasShownToast: boolean;
  lastKnownStatus: string | null;
  hasProcessedEndState: boolean;
  isRedirecting: boolean;
  toastShownForSession: string | null;
  sessionData: any;
}

export interface SessionExpirationReturn {
  isExpired: boolean;
  expiresAt: Date | null;
  timeRemaining: number | null;
  sessionEndReason: 'expired' | 'ended_by_teacher' | null;
  isRedirecting: boolean;
}
