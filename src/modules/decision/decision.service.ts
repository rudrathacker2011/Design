import { apiClient, type DecisionEvaluateResponse } from '@/lib/api/client';
import { SEED_DESTINATIONS, type Destination, type TravellerProfile } from '../destination/seed';

export type EvaluationResult = DecisionEvaluateResponse['evaluation'];

const intentAliases: Record<string, string[]> = {
  peace: ['peace', 'peaceful', 'quiet', 'calm', 'slow', 'serene'],
  heritage: ['heritage', 'history', 'historic', 'historical', 'monument', 'temple'],
  architecture: ['architecture', 'architectural', 'building', 'design'],
  photography: ['photography', 'photo', 'photograph', 'pictures'],
  nature: ['nature', 'forest', 'outdoors', 'landscape'],
  craft: ['craft', 'artisan', 'textile', 'weaving', 'handloom'],
  food: ['food', 'cuisine', 'culinary', 'eat'],
  culture: ['culture', 'cultural', 'village', 'local life'],
  wildlife: ['wildlife', 'birds', 'animals', 'safari'],
  adventure: ['adventure', 'hiking', 'trek', 'explore'],
};

export function normalizeDemoIntent(text: string): string[] {
  const value = text.toLowerCase();
  return Object.entries(intentAliases)
    .filter(([, aliases]) => aliases.some((alias) => value.includes(alias)))
    .map(([tag]) => tag);
}

export interface DemoAlternative {
  destination: Destination;
  matchedExperiences: string[];
  score: number;
  reason: string;
}

export function rankDemoAlternatives(profile: TravellerProfile, destination: Destination): DemoAlternative[] {
  const intent = normalizeDemoIntent(profile.experienceIntent);
  const desired = intent.length ? intent : normalizeDemoIntent(destination.tags.join(' '));
  return SEED_DESTINATIONS
    .filter((candidate) => candidate.id !== destination.id && candidate.isOpen && (!profile.accessibilityNeeded || candidate.isAccessible))
    .map((candidate) => {
      const candidateTags = new Set([...candidate.tags, ...normalizeDemoIntent(candidate.tags.join(' '))]);
      const matchedExperiences = desired.filter((tag) => candidateTags.has(tag));
      const coverage = desired.length ? matchedExperiences.length / desired.length : 0;
      const crowdAdjustment = profile.crowdPreference === 'quiet' && candidate.crowdLevel === 'quiet' ? 0.15
        : profile.crowdPreference === 'quiet' && candidate.crowdLevel === 'heavy' ? -0.2
          : profile.crowdPreference === 'lively' && candidate.crowdLevel === 'heavy' ? 0.1 : 0;
      const score = Math.max(0, Math.min(1, coverage + crowdAdjustment));
      const reason = matchedExperiences.length
        ? `Shares ${matchedExperiences.join(', ')} with the stated experience intent${candidate.crowdLevel === 'quiet' && profile.crowdPreference === 'quiet' ? ' and fits the quiet preference' : ''}.`
        : 'No strong intent overlap was found in the small demo catalogue.';
      return { destination: candidate, matchedExperiences, score, reason };
    })
    .filter((item) => item.matchedExperiences.length > 0)
    .sort((a, b) => b.score - a.score || b.matchedExperiences.length - a.matchedExperiences.length || a.destination.name.localeCompare(b.destination.name))
    .slice(0, 2);
}

function apiPace(pace: TravellerProfile['pace']): 'RELAXED' | 'BALANCED' | 'FAST' {
  if (pace === 'slow') return 'RELAXED';
  if (pace === 'fast') return 'FAST';
  return 'BALANCED';
}

function apiCrowdPreference(preference: TravellerProfile['crowdPreference']): 'SEEK_QUIET' | 'MODERATE' | 'DONT_CARE' {
  if (preference === 'quiet') return 'SEEK_QUIET';
  if (preference === 'lively') return 'DONT_CARE';
  return 'MODERATE';
}

export const decisionService = {
  async evaluateDestination(profile: TravellerProfile, destination: Destination): Promise<DecisionEvaluateResponse> {
    return apiClient.evaluateDestination({
      destinationName: destination.name,
      travelPace: apiPace(profile.pace),
      crowdPreference: apiCrowdPreference(profile.crowdPreference),
      accessibilityNeeds: profile.accessibilityNeeded,
    });
  },
};
