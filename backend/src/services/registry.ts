// ============================================================
// Provider Registry — single import point for all adapters
// Swap providers by changing the implementation class here.
// ============================================================
import { OpenMeteoWeatherAdapter } from './weather/openmeteo.adapter.js';
import { NominatimGeocodingAdapter } from './geocoding/nominatim.adapter.js';
import { GeminiAIAdapter, DemoAIAdapter } from './ai/gemini.adapter.js';
import type { WeatherProvider, GeocodingProvider, AIProvider } from './providers.interface.js';

// Weather: Open-Meteo (free, no key required)
// SWAP_POINT: Replace with OpenWeatherMapAdapter or IMDAdapter when available
export const weatherProvider: WeatherProvider = new OpenMeteoWeatherAdapter();

// Geocoding: Nominatim (free, no key required)
// SWAP_POINT: Replace with GooglePlacesAdapter when GOOGLE_MAPS_API_KEY is set
export const geocodingProvider: GeocodingProvider = new NominatimGeocodingAdapter();

// AI: Gemini (requires GEMINI_API_KEY in .env)
// Falls back to DemoAIAdapter if key is absent
// SWAP_POINT: Replace with OpenAIAdapter, ClaudeAdapter, etc.
function createAIProvider(): AIProvider {
  if (process.env.GEMINI_API_KEY) {
    console.log('[Registry] AI provider: Gemini (live)');
    return new GeminiAIAdapter();
  }
  console.log('[Registry] AI provider: Demo (no GEMINI_API_KEY set — set it in backend/.env)');
  return new DemoAIAdapter();
}

export const aiProvider: AIProvider = createAIProvider();
