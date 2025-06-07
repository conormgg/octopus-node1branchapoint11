
export interface SessionExpirationContextType {
  isExpired: boolean;
  expiresAt: Date | null;
  timeRemaining: number | null;
  sessionEndReason: 'expired' | 'ended_by_teacher' | null;
  isRedirecting?: boolean;
}

export interface SessionExpirationProviderProps {
  children: React.ReactNode;
  sessionId: string | null;
  onSessionExpired?: () => void;
}

export interface SessionData {
  created_at: string;
  duration_minutes: number;
  status: string;
}
