import type { WeatherCondition } from '../../services/providers.interface.js';

export type Freshness = 'FRESH' | 'STALE' | 'UNKNOWN';
export type DecisionOutcome = 'GO' | 'MODIFY' | 'ALTERNATIVE';

export const RULE_VERSION = 'destination-assessment-v1';
export const WEATHER_FRESHNESS_MS = 60 * 60 * 1000;

export function getFreshness(collectedAt: string | null, expiresAt: string | null, now = Date.now()): Freshness {
  if (!collectedAt || !expiresAt) return 'UNKNOWN';
  const collected = Date.parse(collectedAt);
  const expires = Date.parse(expiresAt);
  if (!Number.isFinite(collected) || !Number.isFinite(expires) || collected > now) return 'UNKNOWN';
  return expires < now ? 'STALE' : 'FRESH';
}

export function scoreWeather(weather: WeatherCondition): number | null {
  if (weather.confidenceLevel === 'unknown' || weather.isSuitableForTravel === null) return null;
  if (!weather.isSuitableForTravel) return 10;
  if (weather.precipitationProbability > 60) return 45;
  if (weather.precipitationProbability > 30) return 70;
  if (weather.temperature > 38 || weather.temperature < 10) return 55;
  return 100;
}

export function decideDestination(weatherKnown: boolean, weatherSuitabilityScore: number | null): DecisionOutcome {
  if (weatherKnown && weatherSuitabilityScore !== null && weatherSuitabilityScore <= 10) return 'ALTERNATIVE';
  // A positive weather observation alone cannot satisfy unknown operation, crowd or access constraints.
  return 'MODIFY';
}

export function calculateConfidence(weatherKnown: boolean, confidenceLevel: WeatherCondition['confidenceLevel']): number {
  if (!weatherKnown) return 0;
  const sourceConfidence = confidenceLevel === 'high' ? 0.85 : confidenceLevel === 'medium' ? 0.65 : 0.4;
  return Math.round(sourceConfidence * 0.35 * 100) / 100;
}
