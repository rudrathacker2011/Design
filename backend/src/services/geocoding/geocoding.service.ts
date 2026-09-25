export interface IndianDestinationSearchResult {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  region: string;
  country: string;
  category: string;
  description: string;
}

export class GeocodingService {
  /**
   * Search any location/destination across India in real-time
   */
  static async searchIndiaDestinations(query: string): Promise<IndianDestinationSearchResult[]> {
    try {
      const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&addressdetails=1&limit=8`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'YatraSetu-AI-Tourism-Intelligence/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding request failed: ${response.statusText}`);
      }

      const results = (await response.json()) as any[];

      return results.map((item) => {
        const address = item.address || {};
        const state = address.state || address.region || address.county || 'India';
        const category = address.tourism || address.amenity || item.type || 'Heritage & Culture';

        return {
          name: item.display_name.split(',')[0],
          slug: item.display_name.split(',')[0].toLowerCase().replace(/[^a-z0-0]/g, '-'),
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          region: state,
          country: 'India',
          category: category,
          description: item.display_name,
        };
      });
    } catch (error: any) {
      console.error('Error in Geocoding Search:', error.message);
      return [];
    }
  }
}
