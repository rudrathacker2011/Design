// ============================================================
// YatraSetu — Provider Abstraction Layer
// All external integrations go through these interfaces.
// Swap providers without touching business logic.
// ============================================================

// ── Weather ───────────────────────────────────────────────────
export interface WeatherCondition {
  temperature: number;
  apparentTemperature: number | null;
  precipitation: number;      // mm
  precipitationProbability: number; // 0–100
  weatherCode: number;
  weatherCondition: string;
  windSpeed: number;           // km/h
  humidity: number | null;     // %
  isSuitableForTravel: boolean | null;
  alertMessage?: string;
  source: string;
  collectedAt: string;
  confidenceLevel: 'high' | 'medium' | 'low' | 'unknown';
}

export interface WeatherProvider {
  getLiveWeather(lat: number, lon: number): Promise<WeatherCondition>;
  getForecast?(lat: number, lon: number, days: number): Promise<WeatherCondition[]>;
}

// ── Geocoding / Places ────────────────────────────────────────
export interface PlaceResult {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  region: string;
  state: string;
  country: string;
  category: string;
  description: string;
  osmId?: string;
}

export interface GeocodingProvider {
  searchPlaces(query: string, countryCode?: string): Promise<PlaceResult[]>;
  reverseGeocode(lat: number, lon: number): Promise<PlaceResult | null>;
}

// ── AI / LLM ──────────────────────────────────────────────────
export interface ExtractedIntent {
  experienceTags: string[];       // ['heritage', 'photography', 'peaceful']
  impliedConstraints: string[];   // ['no crowds', 'wheelchair accessible']
  travelStyle: string;            // 'slow and immersive'
  budgetSignal?: 'budget' | 'mid' | 'luxury';
  naturalLanguageSummary: string;
}

export interface AIProvider {
  extractIntent(rawText: string, language?: string): Promise<ExtractedIntent>;
  generateExplanation(context: Record<string, unknown>): Promise<string>;
  draftItinerary(context: Record<string, unknown>): Promise<string>;
  computeExperienceSimilarity(intentTags: string[], destinationTags: string[]): Promise<number>;
}

// ── Notifications ─────────────────────────────────────────────
export interface NotificationPayload {
  recipient: string;    // phone or email
  channel: 'sms' | 'email' | 'push';
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<{ success: boolean; referenceId?: string }>;
}
