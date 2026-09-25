// ============================================================
// YatraSetu Frontend API Client
// Single typed HTTP client for all backend communication.
// Replaces scattered fetch() calls with centralized error handling.
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? '/api/v1';

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  retryable?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

class ApiClientError extends Error {
  code: string;
  retryable: boolean;

  constructor(code: string, message: string, retryable = false) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.retryable = retryable;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json: ApiResponse<T> = await res.json();

  if (!json.success || !res.ok) {
    throw new ApiClientError(
      json.error?.code ?? 'INTERNAL_ERROR',
      json.error?.message ?? 'An unexpected error occurred.',
      json.error?.retryable ?? false
    );
  }

  return json.data as T;
}

export const apiClient = {
  // ── Profile ──────────────────────────────────────────────
  async getProfile(token: string) {
    return request<TravellerProfileResponse>('/profile', {}, token);
  },

  async updateProfile(data: UpdateProfileInput, token: string) {
    return request<TravellerProfileResponse>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  },

  async extractIntent(data: { rawText: string; tripId?: string }, token?: string) {
    return request<{ experienceTags: string[]; impliedConstraints: Record<string, unknown> }>('/intent/extract', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  // ── Decision Engine ──────────────────────────────────────
  async evaluateDestination(data: DecisionEvaluateInput, token?: string) {
    return request<DecisionEvaluateResponse>('/decisions/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  // ── Mobility & Arrival ───────────────────────────────────
  async getMobilityRoutes(params: { origin: string; destination: string; travelPace?: string; accessibilityNeeds?: boolean }) {
    const query = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
      ...(params.travelPace ? { travelPace: params.travelPace } : {}),
      ...(params.accessibilityNeeds !== undefined ? { accessibilityNeeds: String(params.accessibilityNeeds) } : {}),
    });
    return request<{ origin: string; destination: string; routes: any[] }>(`/mobility/routes?${query.toString()}`);
  },

  async getArrivalPoints(destination: string) {
    return request<{ destination: string; arrivalPoints: any[] }>(`/mobility/arrival-points?destination=${encodeURIComponent(destination)}`);
  },

  // ── Safety & Emergency Assistance ────────────────────────
  async dispatchAssistance(data: {
    type: 'SOS' | 'MECHANIC' | 'MEDICAL' | 'INFO';
    latitude: number;
    longitude: number;
    locationName?: string;
    batteryLevel?: number;
    networkSignal?: string;
    notes?: string;
  }, token?: string) {
    return request<any>('/safety/assistance', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async getSafetyAssessment(destination: string) {
    return request<any>(`/safety/assessment?destination=${encodeURIComponent(destination)}`);
  },

  // ── Trust & Verification ─────────────────────────────────
  async getVerifiedProviders(category?: string) {
    const q = category ? `?category=${category}` : '';
    return request<any[]>(`/trust/providers${q}`);
  },

  async submitVerifiedReview(data: {
    providerId?: string;
    destinationId?: string;
    rating: number;
    title: string;
    body: string;
    checkInProofCode: string;
  }, token?: string) {
    return request<any>('/trust/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  // ── Government Portal Telemetry ──────────────────────────
  async getGovCapacity(destination?: string) {
    const q = destination ? `?destination=${encodeURIComponent(destination)}` : '';
    return request<any>(`/gov/capacity${q}`);
  },

  async getGovDispersal() {
    return request<any>('/gov/dispersal');
  },
};

// ── Shared Types (mirrors backend schemas) ────────────────────

export interface TravellerProfileResponse {
  id: string;
  userId: string;
  budgetMin?: number;
  budgetMax?: number;
  travelPace: 'RELAXED' | 'BALANCED' | 'FAST';
  crowdPreference: 'SEEK_QUIET' | 'MODERATE' | 'DONT_CARE';
  accessibilityNeeds: boolean;
  transportPreference?: string;
  vehicleRequired: boolean;
  languagePreference: string;
  experienceTags: string[];
}

export interface UpdateProfileInput {
  budgetMin?: number;
  budgetMax?: number;
  travelPace?: 'RELAXED' | 'BALANCED' | 'FAST';
  crowdPreference?: 'SEEK_QUIET' | 'MODERATE' | 'DONT_CARE';
  accessibilityNeeds?: boolean;
  transportPreference?: string;
  vehicleRequired?: boolean;
  languagePreference?: string;
  experienceTags?: string[];
}

export interface DecisionEvaluateInput {
  destinationName: string;
  travelPace?: 'RELAXED' | 'BALANCED' | 'FAST';
  crowdPreference?: 'SEEK_QUIET' | 'MODERATE' | 'DONT_CARE';
  accessibilityNeeds?: boolean;
}

export interface LiveWeather {
  temperature: number | null;
  apparentTemperature: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  weatherCondition: string;
  windSpeed: number | null;
  humidity: number | null;
  isSuitableForTravel: boolean | null;
  alertMessage: string | null;
  source: string | null;
  collectedAt: string | null;
  expiresAt: string | null;
  freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  confidenceLevel: 'high' | 'medium' | 'low' | 'unknown';
}

export interface DecisionFactor {
  name: string;
  status: 'KNOWN' | 'UNKNOWN';
  impact: 'POSITIVE' | 'NEGATIVE' | 'WARNING' | 'NEUTRAL';
  detail: string;
  score: number | null;
  source: string | null;
  collectedAt: string | null;
  expiresAt: string | null;
  freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  evidenceType: string | null;
  locationScope: string | null;
  contributesToScore: boolean;
}

export interface DecisionEvaluateResponse {
  dataMode?: 'DEMO' | 'LIVE';
  destination: {
    name: string;
    region: string;
    state: string;
    latitude: number;
    longitude: number;
    category: string;
  };
  evaluation: {
    decision: 'GO' | 'MODIFY' | 'ALTERNATIVE';
    suitabilityScore: number | null;
    confidence: number;
    ruleVersion: string;
    weather: LiveWeather;
    factors: DecisionFactor[];
    reasons: string[];
    recommendedAction: string;
    limitations: string[];
    persistence: {
      observation: 'saved' | 'not_authenticated' | 'not_saved';
      recommendation: 'saved' | 'not_authenticated' | 'not_saved';
    };
  };
}
