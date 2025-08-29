import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('state');

export interface PersistenceLogEntry {
  timestamp: number;
  whiteboardId: string;
  operation: string;
  details: any;
  severity: 'info' | 'warning' | 'error';
}

export interface DataLossMetrics {
  totalIncidents: number;
  linesLost: number;
  imagesLost: number;
  mostCommonCause: string;
  affectedWhiteboards: Set<string>;
}

class PersistenceLogger {
  private logs: PersistenceLogEntry[] = [];
  private maxLogEntries = 1000;
  private dataLossMetrics: DataLossMetrics = {
    totalIncidents: 0,
    linesLost: 0,
    imagesLost: 0,
    mostCommonCause: 'unknown',
    affectedWhiteboards: new Set()
  };

  /**
   * Logs a persistence-related event
   */
  log(
    whiteboardId: string,
    operation: string,
    details: any,
    severity: 'info' | 'warning' | 'error' = 'info'
  ) {
    const entry: PersistenceLogEntry = {
      timestamp: Date.now(),
      whiteboardId,
      operation,
      details,
      severity
    };

    this.logs.push(entry);
    
    // Keep logs within limit
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Update metrics for data loss incidents
    if (operation === 'data_loss_detected') {
      this.updateDataLossMetrics(whiteboardId, details);
    }

    // Log to debug system
    debugLog('Logger', `${operation} for ${whiteboardId}`, { details, severity });

    // Log critical issues to console
    if (severity === 'error') {
      console.error(`[PersistenceLogger] ${operation} in ${whiteboardId}:`, details);
    } else if (severity === 'warning') {
      console.warn(`[PersistenceLogger] ${operation} in ${whiteboardId}:`, details);
    }
  }

  /**
   * Logs data loading events
   */
  logDataLoad(
    whiteboardId: string,
    source: 'persistence' | 'context' | 'fallback',
    linesCount: number,
    imagesCount: number,
    operationsCount?: number
  ) {
    this.log(whiteboardId, 'data_loaded', {
      source,
      linesCount,
      imagesCount,
      operationsCount,
      loadedAt: new Date().toISOString()
    });
  }

  /**
   * Logs data merge operations
   */
  logDataMerge(
    whiteboardId: string,
    beforeCount: { lines: number; images: number },
    afterCount: { lines: number; images: number },
    duplicatesRemoved: { lines: number; images: number }
  ) {
    this.log(whiteboardId, 'data_merged', {
      beforeCount,
      afterCount,
      duplicatesRemoved,
      mergedAt: new Date().toISOString()
    });
  }

  /**
   * Logs data loss incidents
   */
  logDataLoss(
    whiteboardId: string,
    lossType: 'lines' | 'images' | 'both',
    beforeCount: { lines: number; images: number },
    afterCount: { lines: number; images: number },
    cause?: string,
    stackTrace?: string
  ) {
    this.log(whiteboardId, 'data_loss_detected', {
      lossType,
      beforeCount,
      afterCount,
      cause: cause || 'unknown',
      stackTrace,
      lossPercentage: {
        lines: beforeCount.lines > 0 ? ((beforeCount.lines - afterCount.lines) / beforeCount.lines * 100) : 0,
        images: beforeCount.images > 0 ? ((beforeCount.images - afterCount.images) / beforeCount.images * 100) : 0
      },
      detectedAt: new Date().toISOString()
    }, 'error');
  }

  /**
   * Logs state validation results
   */
  logValidation(
    whiteboardId: string,
    isValid: boolean,
    issues: string[],
    recoverable: boolean
  ) {
    this.log(whiteboardId, 'state_validated', {
      isValid,
      issues,
      recoverable,
      validatedAt: new Date().toISOString()
    }, isValid ? 'info' : 'warning');
  }

  /**
   * Logs recovery attempts
   */
  logRecovery(
    whiteboardId: string,
    successful: boolean,
    recoveredCount: { lines: number; images: number },
    method: string
  ) {
    this.log(whiteboardId, 'recovery_attempted', {
      successful,
      recoveredCount,
      method,
      attemptedAt: new Date().toISOString()
    }, successful ? 'info' : 'error');
  }

  /**
   * Logs component stability issues
   */
  logStabilityIssue(
    whiteboardId: string,
    componentName: string,
    issueType: 'excessive_remounting' | 'loading_timeout' | 'state_corruption',
    details: any
  ) {
    this.log(whiteboardId, 'stability_issue', {
      componentName,
      issueType,
      details,
      detectedAt: new Date().toISOString()
    }, 'warning');
  }

  /**
   * Updates data loss metrics
   */
  private updateDataLossMetrics(whiteboardId: string, details: any) {
    this.dataLossMetrics.totalIncidents++;
    this.dataLossMetrics.affectedWhiteboards.add(whiteboardId);
    
    if (details.beforeCount && details.afterCount) {
      this.dataLossMetrics.linesLost += Math.max(0, details.beforeCount.lines - details.afterCount.lines);
      this.dataLossMetrics.imagesLost += Math.max(0, details.beforeCount.images - details.afterCount.images);
    }
    
    // Track most common cause (simplified)
    if (details.cause && details.cause !== 'unknown') {
      this.dataLossMetrics.mostCommonCause = details.cause;
    }
  }

  /**
   * Gets filtered logs by criteria
   */
  getLogs(
    whiteboardId?: string,
    operation?: string,
    severity?: 'info' | 'warning' | 'error',
    limit = 100
  ): PersistenceLogEntry[] {
    let filtered = this.logs;

    if (whiteboardId) {
      filtered = filtered.filter(log => log.whiteboardId === whiteboardId);
    }

    if (operation) {
      filtered = filtered.filter(log => log.operation === operation);
    }

    if (severity) {
      filtered = filtered.filter(log => log.severity === severity);
    }

    return filtered.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Gets data loss metrics
   */
  getDataLossMetrics(): DataLossMetrics {
    return {
      ...this.dataLossMetrics,
      affectedWhiteboards: new Set(this.dataLossMetrics.affectedWhiteboards)
    };
  }

  /**
   * Exports logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clears old logs
   */
  clearOldLogs(olderThanHours = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp > cutoffTime);
  }

  /**
   * Generates a summary report
   */
  generateSummaryReport(): string {
    const totalLogs = this.logs.length;
    const errorCount = this.logs.filter(log => log.severity === 'error').length;
    const warningCount = this.logs.filter(log => log.severity === 'warning').length;
    const uniqueWhiteboards = new Set(this.logs.map(log => log.whiteboardId)).size;

    return `
Persistence Logger Summary Report
Generated: ${new Date().toISOString()}

Total Log Entries: ${totalLogs}
Errors: ${errorCount}
Warnings: ${warningCount}
Unique Whiteboards: ${uniqueWhiteboards}

Data Loss Metrics:
- Total Incidents: ${this.dataLossMetrics.totalIncidents}
- Lines Lost: ${this.dataLossMetrics.linesLost}
- Images Lost: ${this.dataLossMetrics.imagesLost}
- Affected Whiteboards: ${this.dataLossMetrics.affectedWhiteboards.size}
- Most Common Cause: ${this.dataLossMetrics.mostCommonCause}

Recent Errors (Last 10):
${this.getLogs(undefined, undefined, 'error', 10)
  .map(log => `- ${new Date(log.timestamp).toISOString()}: ${log.operation} in ${log.whiteboardId}`)
  .join('\n')}
    `.trim();
  }
}

// Global instance
export const persistenceLogger = new PersistenceLogger();
