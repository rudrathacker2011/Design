import { PrismaClient, type Prisma } from '@prisma/client';
import { weatherProvider, geocodingProvider } from '../../services/registry.js';
import { ProfileService } from '../profile/profile.service.js';
import type { WeatherCondition, PlaceResult } from '../../services/providers.interface.js';
import { calculateConfidence, decideDestination, getFreshness, RULE_VERSION, scoreWeather, WEATHER_FRESHNESS_MS } from './decision.rules.js';

const prisma = new PrismaClient();

type PersistenceStatus = 'saved' | 'not_authenticated' | 'not_saved';

interface EvaluateInput {
  destinationName: string;
  userId?: string;
  travelPace?: string;
  crowdPreference?: string;
  accessibilityNeeds?: boolean;
  travelDates?: { start?: string; end?: string };
}

function weatherEvidence(place: PlaceResult, weather: WeatherCondition, score: number | null) {
  const collectedAt = weather.confidenceLevel === 'unknown' ? null : weather.collectedAt;
  const expiresAt = collectedAt ? new Date(Date.parse(collectedAt) + WEATHER_FRESHNESS_MS).toISOString() : null;
  const freshness = getFreshness(collectedAt, expiresAt);
  const known = score !== null && freshness === 'FRESH';

  return {
    name: 'Weather',
    status: known ? 'KNOWN' as const : 'UNKNOWN' as const,
    impact: known ? (score! >= 70 ? 'POSITIVE' as const : 'WARNING' as const) : 'NEUTRAL' as const,
    detail: known
      ? `${weather.temperature}°C, ${weather.weatherCondition}; precipitation probability ${weather.precipitationProbability}%.`
      : 'Current weather could not be verified. It is excluded from the suitability score.',
    score: known ? score : null,
    source: known ? weather.source : null,
    collectedAt: known ? collectedAt : null,
    expiresAt: known ? expiresAt : null,
    freshness: known ? freshness : 'UNKNOWN' as const,
    confidence: known ? weather.confidenceLevel : 'unknown' as const,
    evidenceType: known ? 'API_PROVIDER' : null,
    locationScope: known ? place.slug : null,
    contributesToScore: known,
  };
}

function unavailableFactor(name: string, detail: string) {
  return {
    name,
    status: 'UNKNOWN' as const,
    impact: 'NEUTRAL' as const,
    detail,
    score: null,
    source: null,
    collectedAt: null,
    expiresAt: null,
    freshness: 'UNKNOWN' as const,
    confidence: 'unknown' as const,
    evidenceType: null,
    locationScope: null,
    contributesToScore: false,
  };
}

async function persistAssessment(
  place: PlaceResult,
  weather: WeatherCondition,
  evaluation: { decision: 'GO' | 'MODIFY' | 'ALTERNATIVE'; suitabilityScore: number | null; confidence: number; factors: unknown[]; reasons: string[] },
  input: EvaluateInput,
): Promise<{ observation: PersistenceStatus; recommendation: PersistenceStatus }> {
  const result = {
    observation: 'not_saved' as PersistenceStatus,
    recommendation: input.userId ? 'not_saved' as PersistenceStatus : 'not_authenticated' as PersistenceStatus,
  };

  if (!process.env.DATABASE_URL) return result;

  try {
    const dbDestination = await prisma.destination.upsert({
      where: { slug: place.slug },
      update: {
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        region: place.region,
        state: place.state,
        category: place.category,
        description: place.description,
      },
      create: {
        slug: place.slug,
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        region: place.region,
        state: place.state,
        category: place.category,
        description: place.description,
      },
    });

    if (weather.confidenceLevel !== 'unknown') {
      const collectedAt = new Date(weather.collectedAt);
      await prisma.destinationObservation.create({
        data: {
          destinationId: dbDestination.id,
          signalType: 'WEATHER',
          value: {
            temperature: weather.temperature,
            apparentTemperature: weather.apparentTemperature,
            precipitationMm: weather.precipitation,
            precipitationProbability: weather.precipitationProbability,
            weatherCode: weather.weatherCode,
            weatherCondition: weather.weatherCondition,
            windSpeedKph: weather.windSpeed,
            humidity: weather.humidity,
          } as Prisma.InputJsonValue,
          source: weather.source,
          collectedAt,
          expiresAt: new Date(collectedAt.getTime() + WEATHER_FRESHNESS_MS),
          confidence: weather.confidenceLevel === 'high' ? 0.85 : 0.65,
          evidenceType: 'API_PROVIDER',
          locationScope: place.slug,
        },
      });
      result.observation = 'saved';
    }

    if (input.userId) {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { id: true },
      });
      if (user && evaluation.suitabilityScore !== null) {
        const profile = await ProfileService.getProfileByUserId(user.id);
        await prisma.recommendation.create({
          data: {
            userId: user.id,
            destinationId: dbDestination.id,
            ruleVersion: RULE_VERSION,
            suitability: evaluation.suitabilityScore === null ? 0 : evaluation.suitabilityScore / 100,
            decision: evaluation.decision,
            confidence: evaluation.confidence,
            factors: evaluation.factors as Prisma.InputJsonValue,
            reasons: evaluation.reasons as Prisma.InputJsonValue,
            inputSnapshot: {
              travelPace: input.travelPace ?? profile?.travelPace ?? 'BALANCED',
              crowdPreference: input.crowdPreference ?? profile?.crowdPreference ?? 'MODERATE',
              accessibilityNeeds: input.accessibilityNeeds ?? profile?.accessibilityNeeds ?? false,
              destinationName: input.destinationName,
              ...(input.travelDates ? { travelDates: input.travelDates } : {}),
            } as Prisma.InputJsonValue,
          },
        });
        result.recommendation = 'saved';
      }
    }
  } catch (error) {
    console.warn('[decision:persistence] Assessment persistence failed:', error instanceof Error ? error.message : 'unknown error');
  }

  return result;
}

export class DecisionService {
  static async evaluateDestination(input: EvaluateInput) {
    const places = await geocodingProvider.searchPlaces(input.destinationName, 'IN');
    if (!places.length) throw new Error('DESTINATION_NOT_FOUND');
    const place = places[0];
    const weather = await weatherProvider.getLiveWeather(place.latitude, place.longitude);
    let profile: Awaited<ReturnType<typeof ProfileService.getProfileByUserId>> = null;
    if (input.userId && process.env.DATABASE_URL) {
      try {
        const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true } });
        if (user) profile = await ProfileService.getProfileByUserId(user.id);
      } catch (error) {
        console.warn('[decision:profile] Linked traveller profile unavailable:', error instanceof Error ? error.message : 'unknown error');
      }
    }
    const accessibilityNeeds = input.accessibilityNeeds ?? profile?.accessibilityNeeds ?? false;
    const crowdPreference = input.crowdPreference ?? profile?.crowdPreference;
    const weatherScoreValue = scoreWeather(weather);
    const weatherFactor = weatherEvidence(place, weather, weatherScoreValue);
    const unknownFactors = [
      unavailableFactor('Crowd Conditions', crowdPreference === 'SEEK_QUIET'
        ? 'You prefer quieter places, but no current crowd source is connected for this destination.'
        : 'No current crowd source is connected for this destination.'),
      unavailableFactor('Operational Status', 'Opening hours and restrictions are not verified by a current source.'),
      unavailableFactor('Accessibility', accessibilityNeeds
        ? 'Accessibility is required but has not been verified for this destination.'
        : 'Accessibility information is not verified for this destination.'),
    ];
    const factors = [weatherFactor, ...unknownFactors];
    const confidence = calculateConfidence(weatherFactor.status === 'KNOWN', weather.confidenceLevel);
    const suitabilityScore = weatherFactor.status === 'KNOWN' ? weatherScoreValue : null;
    const decision = decideDestination(weatherFactor.status === 'KNOWN', weatherFactor.score);
    const reasons = [
      weatherFactor.status === 'KNOWN'
        ? weatherFactor.detail
        : 'Weather conditions are unknown; no weather-based suitability score is available.',
      'Crowd level is unknown because no current crowd source is connected.',
      'Operating status and access conditions remain unverified; confirm them before travel.',
    ];
    const limitations = unknownFactors.map((factor) => factor.detail);
    const evaluation = {
      decision,
      suitabilityScore,
      confidence,
      ruleVersion: RULE_VERSION,
      factors,
      reasons,
      recommendedAction: decision === 'ALTERNATIVE'
        ? 'Weather conditions exceed the current travel thresholds. Consider another date or destination.'
        : 'Check opening status, crowd conditions and accessibility before committing; this assessment has incomplete coverage.',
      limitations,
    };

    const persistence = await persistAssessment(place, weather, evaluation, {
      ...input,
      travelPace: input.travelPace ?? profile?.travelPace,
      crowdPreference,
      accessibilityNeeds,
    });
    return {
      destination: {
        name: place.name,
        region: place.region,
        state: place.state,
        latitude: place.latitude,
        longitude: place.longitude,
        category: place.category,
      },
      evaluation: {
        ...evaluation,
        weather: {
          temperature: weather.confidenceLevel === 'unknown' ? null : weather.temperature,
          apparentTemperature: weather.confidenceLevel === 'unknown' ? null : weather.apparentTemperature,
          precipitation: weather.confidenceLevel === 'unknown' ? null : weather.precipitation,
          precipitationProbability: weather.confidenceLevel === 'unknown' ? null : weather.precipitationProbability,
          weatherCondition: weather.confidenceLevel === 'unknown' ? 'Unknown' : weather.weatherCondition,
          windSpeed: weather.confidenceLevel === 'unknown' ? null : weather.windSpeed,
          humidity: weather.confidenceLevel === 'unknown' ? null : weather.humidity,
          isSuitableForTravel: weather.confidenceLevel === 'unknown' ? null : weather.isSuitableForTravel,
          alertMessage: weather.alertMessage ?? null,
          source: weather.confidenceLevel === 'unknown' ? null : weather.source,
          collectedAt: weatherFactor.status === 'KNOWN' ? weatherFactor.collectedAt : null,
          expiresAt: weatherFactor.status === 'KNOWN' ? weatherFactor.expiresAt : null,
          freshness: weatherFactor.freshness,
          confidenceLevel: weather.confidenceLevel,
        },
        persistence,
      },
    };
  }
}
