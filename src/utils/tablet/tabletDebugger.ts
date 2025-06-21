/**
 * @fileoverview Tablet-specific debugging utilities
 * @description TABLET-FRIENDLY: Comprehensive debugging tools for tablet interactions
 */

import { createDebugLogger, isDebugEnabled } from '@/utils/debug/debugConfig';
import { TabletEventConfig } from '@/hooks/tablet';

const debugLog = createDebugLogger('tablet');

/**
 * TABLET-FRIENDLY: Interface for tablet capability detection results
 */
export interface TabletCapabilities {
  supportsPointerEvents: boolean;
  supportsTouchEvents: boolean;
  maxTouchPoints: number;
  isIOS: boolean;
  isIPad: boolean;
  isSafari: boolean;
  isAndroid: boolean;
  hasStylus: boolean;
  pointerTypes: string[];
}

/**
 * TABLET-FRIENDLY: Interface for palm rejection status
 */
export interface PalmRejectionStatus {
  enabled: boolean;
  activePointers: number;
  rejectedPointers: number;
  lastDetectionTime: number;
  timeoutRemaining: number;
  config: {
    maxContactSize: number;
    minPressure: number;
    palmTimeoutMs: number;
    clusterDistance: number;
    preferStylus: boolean;
  };
}

/**
 * TABLET-FRIENDLY: Interface for event logging data
 */
export interface TabletEventLog {
  timestamp: number;
  type: string;
  pointerId: number;
  pointerType: string;
  pressure: number;
  width: number;
  height: number;
  x: number;
  y: number;
  isRejected?: boolean;
  reason?: string;
}

/**
 * TABLET-FRIENDLY: Tablet debugger class for comprehensive debugging
 */
export class TabletDebugger {
  private eventLogs: TabletEventLog[] = [];
  private maxLogEntries = 100;
  private capabilities: TabletCapabilities | null = null;

  /**
   * TABLET-FRIENDLY: Detect tablet and touch capabilities
   */
  detectCapabilities(): TabletCapabilities {
    if (this.capabilities) {
      return this.capabilities;
    }

    const userAgent = navigator.userAgent;
    const capabilities: TabletCapabilities = {
      supportsPointerEvents: typeof window !== 'undefined' && 
        window.PointerEvent && 'onpointerdown' in window,
      supportsTouchEvents: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isIPad: /iPad/.test(userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
      isSafari: /^((?!chrome|android).)*safari/i.test(userAgent),
      isAndroid: /Android/.test(userAgent),
      hasStylus: navigator.maxTouchPoints > 1, // Heuristic
      pointerTypes: []
    };

    // TABLET-FRIENDLY: Detect available pointer types
    if (capabilities.supportsPointerEvents) {
      // This is a heuristic - actual pointer types are detected during events
      capabilities.pointerTypes = ['mouse'];
      if (capabilities.supportsTouchEvents) {
        capabilities.pointerTypes.push('touch');
      }
      if (capabilities.hasStylus) {
        capabilities.pointerTypes.push('pen');
      }
    }

    this.capabilities = capabilities;

    debugLog('TabletDebugger', 'Capabilities detected', capabilities);
    return capabilities;
  }

  /**
   * TABLET-FRIENDLY: Log a tablet event for debugging
   */
  logEvent(event: PointerEvent | TouchEvent, isRejected?: boolean, reason?: string): void {
    if (!isDebugEnabled('tablet')) return;

    let eventData: TabletEventLog;

    if ('pointerId' in event) {
      // Pointer event
      eventData = {
        timestamp: Date.now(),
        type: event.type,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        pressure: event.pressure,
        width: event.width || 1,
        height: event.height || 1,
        x: event.clientX,
        y: event.clientY,
        isRejected,
        reason
      };
    } else {
      // Touch event - log first touch
      const touch = event.touches[0] || event.changedTouches[0];
      if (!touch) return;

      eventData = {
        timestamp: Date.now(),
        type: event.type,
        pointerId: touch.identifier,
        pointerType: 'touch',
        pressure: (touch as any).force || 0,
        width: (touch as any).radiusX * 2 || 1,
        height: (touch as any).radiusY * 2 || 1,
        x: touch.clientX,
        y: touch.clientY,
        isRejected,
        reason
      };
    }

    this.eventLogs.push(eventData);
    
    // TABLET-FRIENDLY: Keep only recent logs
    if (this.eventLogs.length > this.maxLogEntries) {
      this.eventLogs = this.eventLogs.slice(-this.maxLogEntries);
    }

    debugLog('TabletDebugger', 'Event logged', eventData);
  }

  /**
   * TABLET-FRIENDLY: Get recent event logs
   */
  getEventLogs(count?: number): TabletEventLog[] {
    const logs = count ? this.eventLogs.slice(-count) : this.eventLogs;
    return [...logs];
  }

  /**
   * TABLET-FRIENDLY: Clear event logs
   */
  clearEventLogs(): void {
    this.eventLogs = [];
    debugLog('TabletDebugger', 'Event logs cleared');
  }

  /**
   * TABLET-FRIENDLY: Validate tablet configuration
   */
  validateConfig(config: TabletEventConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.maxContactSize <= 0) {
      errors.push('maxContactSize must be greater than 0');
    }

    if (config.minPressure < 0 || config.minPressure > 1) {
      errors.push('minPressure must be between 0 and 1');
    }

    if (config.palmTimeoutMs < 0) {
      errors.push('palmTimeoutMs must be non-negative');
    }

    if (config.clusterDistance <= 0) {
      errors.push('clusterDistance must be greater than 0');
    }

    const isValid = errors.length === 0;
    
    if (isValid) {
      debugLog('TabletDebugger', 'Configuration valid', config);
    } else {
      debugLog('TabletDebugger', 'Configuration invalid', { config, errors });
    }

    return { isValid, errors };
  }

  /**
   * TABLET-FRIENDLY: Generate debugging report
   */
  generateReport(): {
    capabilities: TabletCapabilities;
    recentEvents: TabletEventLog[];
    eventStats: {
      total: number;
      rejected: number;
      byType: Record<string, number>;
      byPointerType: Record<string, number>;
    };
  } {
    const capabilities = this.detectCapabilities();
    const recentEvents = this.getEventLogs(20);
    
    const eventStats = {
      total: this.eventLogs.length,
      rejected: this.eventLogs.filter(log => log.isRejected).length,
      byType: {} as Record<string, number>,
      byPointerType: {} as Record<string, number>
    };

    // TABLET-FRIENDLY: Calculate statistics
    this.eventLogs.forEach(log => {
      eventStats.byType[log.type] = (eventStats.byType[log.type] || 0) + 1;
      eventStats.byPointerType[log.pointerType] = (eventStats.byPointerType[log.pointerType] || 0) + 1;
    });

    const report = {
      capabilities,
      recentEvents,
      eventStats
    };

    debugLog('TabletDebugger', 'Debug report generated', report);
    return report;
  }
}

// TABLET-FRIENDLY: Global debugger instance
export const tabletDebugger = new TabletDebugger();

/**
 * TABLET-FRIENDLY: Convenience function to log palm rejection status
 */
export const logPalmRejectionStatus = (status: PalmRejectionStatus): void => {
  if (!isDebugEnabled('palmRejection')) return;
  
  debugLog('PalmRejection', 'Status update', status);
};

/**
 * TABLET-FRIENDLY: Convenience function to log configuration changes
 */
export const logConfigurationChange = (
  oldConfig: Partial<TabletEventConfig>, 
  newConfig: Partial<TabletEventConfig>
): void => {
  if (!isDebugEnabled('tablet')) return;
  
  debugLog('TabletDebugger', 'Configuration changed', { oldConfig, newConfig });
};

/**
 * TABLET-FRIENDLY: Export global debugger for console access
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).tabletDebugger = tabletDebugger;
  console.log('[TabletDebugger] Tablet debugger available at window.tabletDebugger');
}
