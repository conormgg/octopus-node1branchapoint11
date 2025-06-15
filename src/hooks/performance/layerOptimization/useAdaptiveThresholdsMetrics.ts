
/**
 * @fileoverview Adaptive thresholds metrics tracking
 */

import { useCallback, useState } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('layerOptimization');

export const useAdaptiveThresholdsMetrics = () => {
  const [adaptiveThresholds, setAdaptiveThresholds] = useState({
    current: 30,
    baseline: 30,
    adjustmentCount: 0,
    lastAdjustment: 0
  });

  /**
   * @function recordThresholdAdjustment
   * @description Record adaptive threshold changes
   */
  const recordThresholdAdjustment = useCallback((newThreshold: number) => {
    setAdaptiveThresholds(prev => {
      debugLog('Metrics', 'Threshold adjustment recorded', {
        oldThreshold: prev.current,
        newThreshold,
        adjustmentCount: prev.adjustmentCount + 1
      });

      return {
        ...prev,
        current: newThreshold,
        adjustmentCount: prev.adjustmentCount + 1,
        lastAdjustment: Date.now()
      };
    });
  }, []);

  const resetAdaptiveThresholds = useCallback(() => {
    setAdaptiveThresholds({ current: 30, baseline: 30, adjustmentCount: 0, lastAdjustment: 0 });
  }, []);

  return {
    adaptiveThresholds,
    recordThresholdAdjustment,
    resetAdaptiveThresholds
  };
};
