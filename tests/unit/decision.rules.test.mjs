import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateConfidence,
  decideDestination,
  getFreshness,
  scoreWeather,
} from '../../backend/dist/modules/decision/decision.rules.js';

const knownWeather = {
  temperature: 24,
  apparentTemperature: 25,
  precipitation: 0,
  precipitationProbability: 10,
  weatherCode: 0,
  weatherCondition: 'Clear Sky',
  windSpeed: 8,
  humidity: 45,
  isSuitableForTravel: true,
  source: 'Open-Meteo',
  collectedAt: '2026-09-25T05:00:00.000Z',
  confidenceLevel: 'medium',
};

test('unknown weather has no suitability score and cannot produce GO', () => {
  const weather = { ...knownWeather, confidenceLevel: 'unknown', isSuitableForTravel: null };
  assert.equal(scoreWeather(weather), null);
  assert.equal(calculateConfidence(false, 'unknown'), 0);
  assert.equal(decideDestination(false, null), 'MODIFY');
});

test('weather alone cannot produce GO while important destination signals are unknown', () => {
  assert.equal(scoreWeather(knownWeather), 100);
  assert.equal(calculateConfidence(true, 'medium'), 0.23);
  assert.equal(decideDestination(true, 100), 'MODIFY');
});

test('known weather outside the configured travel threshold recommends an alternative', () => {
  const adverseWeather = { ...knownWeather, isSuitableForTravel: false };
  const score = scoreWeather(adverseWeather);
  assert.equal(score, 10);
  assert.equal(decideDestination(true, score), 'ALTERNATIVE');
});

test('freshness distinguishes fresh, stale and unavailable timestamps', () => {
  const now = Date.parse('2026-09-25T06:00:00.000Z');
  assert.equal(getFreshness('2026-09-25T05:30:00.000Z', '2026-09-25T06:30:00.000Z', now), 'FRESH');
  assert.equal(getFreshness('2026-09-25T04:00:00.000Z', '2026-09-25T05:00:00.000Z', now), 'STALE');
  assert.equal(getFreshness(null, null, now), 'UNKNOWN');
});
