
interface PendingUpdate {
  participantId: number;
  updateData: any;
  timestamp: number;
}

class UpdateThrottler {
  private pendingUpdates = new Map<number, PendingUpdate>();
  private updateCounts = new Map<number, number>();
  private lastUpdateTimes = new Map<number, number>();
  private readonly minUpdateInterval = 5000; // 5 seconds minimum between updates
  private readonly maxUpdatesPerMinute = 6; // Circuit breaker threshold
  private readonly circuitBreakerCooldown = 60000; // 1 minute cooldown
  private blockedParticipants = new Set<number>();

  shouldAllowUpdate(participantId: number): boolean {
    const now = Date.now();
    const lastUpdate = this.lastUpdateTimes.get(participantId) || 0;
    const timeSinceLastUpdate = now - lastUpdate;

    // Check if participant is circuit-breaker blocked
    if (this.blockedParticipants.has(participantId)) {
      return false;
    }

    // Check minimum interval
    if (timeSinceLastUpdate < this.minUpdateInterval) {
      console.log(`[UpdateThrottler] Throttling update for participant ${participantId} - too soon (${timeSinceLastUpdate}ms)`);
      return false;
    }

    // Check circuit breaker
    const updateCount = this.getUpdateCountInLastMinute(participantId);
    if (updateCount >= this.maxUpdatesPerMinute) {
      console.warn(`[UpdateThrottler] Circuit breaker triggered for participant ${participantId} - too many updates (${updateCount})`);
      this.blockParticipant(participantId);
      return false;
    }

    return true;
  }

  recordUpdate(participantId: number): void {
    const now = Date.now();
    this.lastUpdateTimes.set(participantId, now);
    
    // Increment update count
    const currentCount = this.updateCounts.get(participantId) || 0;
    this.updateCounts.set(participantId, currentCount + 1);
    
    // Clean up old update counts (older than 1 minute)
    setTimeout(() => {
      const count = this.updateCounts.get(participantId) || 0;
      if (count > 0) {
        this.updateCounts.set(participantId, count - 1);
      }
    }, 60000);
  }

  private getUpdateCountInLastMinute(participantId: number): number {
    return this.updateCounts.get(participantId) || 0;
  }

  private blockParticipant(participantId: number): void {
    this.blockedParticipants.add(participantId);
    console.warn(`[UpdateThrottler] Participant ${participantId} blocked for ${this.circuitBreakerCooldown}ms`);
    
    setTimeout(() => {
      this.blockedParticipants.delete(participantId);
      this.updateCounts.set(participantId, 0); // Reset counter
      console.log(`[UpdateThrottler] Participant ${participantId} unblocked`);
    }, this.circuitBreakerCooldown);
  }

  getStats(participantId: number) {
    return {
      isBlocked: this.blockedParticipants.has(participantId),
      updateCount: this.updateCounts.get(participantId) || 0,
      lastUpdate: this.lastUpdateTimes.get(participantId),
      timeSinceLastUpdate: Date.now() - (this.lastUpdateTimes.get(participantId) || 0)
    };
  }
}

export const updateThrottler = new UpdateThrottler();
