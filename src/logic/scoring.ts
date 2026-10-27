/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PriorityLevel } from '../types';

/**
 * Maps raw 30-day report count of similar issues to a 1-5 frequency value.
 * PRD FR-08 Specification:
 * - 1       -> 1
 * - 2-3     -> 2
 * - 4-6     -> 3
 * - 7-10    -> 4
 * - >10     -> 5
 */
export function calculateFrequencyValue(count30d: number): number {
  if (count30d <= 1) return 1;
  if (count30d <= 3) return 2;
  if (count30d <= 6) return 3;
  if (count30d <= 10) return 4;
  return 5;
}

export interface PriorityCalculationResult {
  score: number;
  level: PriorityLevel;
  breakdown: {
    severity: number;
    severityWeighted: number;
    serviceImpact: number;
    serviceImpactWeighted: number;
    frequencyCount: number;
    frequencyValue: number;
    frequencyWeighted: number;
  };
}

/**
 * Calculates priority score by application logic (FR-08):
 * Formula: (severity * 8) + (service_impact * 6) + (frequency_value * 6)
 * Thresholds:
 * - High:   >= 75
 * - Medium: 50 - 74
 * - Low:    < 50
 */
export function calculatePriorityScore(
  severity: number,
  serviceImpact: number,
  frequency30d: number
): PriorityCalculationResult {
  const boundedSeverity = Math.min(Math.max(Math.round(severity || 1), 1), 5);
  const boundedImpact = Math.min(Math.max(Math.round(serviceImpact || 1), 1), 5);
  const freqValue = calculateFrequencyValue(frequency30d || 1);

  const severityWeighted = boundedSeverity * 8;
  const serviceImpactWeighted = boundedImpact * 6;
  const frequencyWeighted = freqValue * 6;

  const score = severityWeighted + serviceImpactWeighted + frequencyWeighted;

  let level: PriorityLevel = 'rendah';
  if (score >= 75) {
    level = 'tinggi';
  } else if (score >= 50) {
    level = 'sedang';
  }

  return {
    score,
    level,
    breakdown: {
      severity: boundedSeverity,
      severityWeighted,
      serviceImpact: boundedImpact,
      serviceImpactWeighted,
      frequencyCount: frequency30d,
      frequencyValue: freqValue,
      frequencyWeighted,
    },
  };
}
