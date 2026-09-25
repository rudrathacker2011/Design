// ============================================================
// Nominatim Geocoding Adapter (OpenStreetMap — free, no key required)
// API_KEY placeholder: Replace with Google Places or Mapbox by implementing
// GeocodingProvider interface and swapping in registry.ts
// ============================================================
import type { GeocodingProvider, PlaceResult } from '../providers.interface.js';

export class GeocodingProviderUnavailableError extends Error {
  constructor() {
    super('GEOCODING_PROVIDER_UNAVAILABLE');
    this.name = 'GeocodingProviderUnavailableError';
  }
}

export class NominatimGeocodingAdapter implements GeocodingProvider {
  private readonly BASE_URL = 'https://nominatim.openstreetmap.org';
  private readonly USER_AGENT = 'YatraSetu-Tourism-Intelligence/1.0 (contact@yatrasetu.in)';

  async searchPlaces(query: string, countryCode = 'IN'): Promise<PlaceResult[]> {
    try {
      const url = `${this.BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=${countryCode}&addressdetails=1&limit=8&extratags=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
      const results = (await res.json()) as any[];

      return results.map((item) => this.mapResult(item));
    } catch (err: any) {
      console.warn('[Geocoding] Nominatim search failed:', err.message);
      throw new GeocodingProviderUnavailableError();
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<PlaceResult | null> {
    try {
      const url = `${this.BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': this.USER_AGENT },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as any;
      return this.mapResult(data);
    } catch {
      return null;
    }
  }

  private mapResult(item: any): PlaceResult {
    const addr = item.address ?? {};
    const name = (
      addr.tourism ||
      addr.historic ||
      addr.natural ||
      addr.leisure ||
      addr.amenity ||
      addr.city ||
      addr.town ||
      addr.village ||
      item.display_name?.split(',')[0] ||
      'Unknown'
    ).trim();

    const readableSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = item.osm_id
      ? `osm-${item.osm_type ?? 'place'}-${item.osm_id}`
      : `${readableSlug}-${Math.abs(Math.round(parseFloat(item.lon) * 100))}`;
    const state = addr.state ?? 'India';
    const region = addr.county ?? addr.state_district ?? state;

    return {
      name,
      slug,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      region,
      state,
      country: 'India',
      category: this.inferCategory(addr, item),
      description: item.display_name ?? name,
      osmId: item.osm_id?.toString(),
    };
  }

  private inferCategory(addr: any, item: any): string {
    if (addr.tourism) return 'Tourism';
    if (addr.historic) return 'Heritage & History';
    if (addr.natural) return 'Nature & Wildlife';
    if (addr.leisure) return 'Leisure & Recreation';
    if (item.type === 'peak' || item.type === 'hill') return 'Mountain & Trekking';
    if (item.type === 'bay' || item.type === 'beach') return 'Coastal & Beach';
    if (item.type === 'forest') return 'Forest & Eco';
    return 'Destination';
  }
}
