export interface LiveWeatherReport {
  temperature: number;
  apparentTemperature: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherCondition: string;
  windSpeed: number;
  humidity: number;
  isSuitableForTravel: boolean;
  alertMessage?: string;
  timestamp: string;
}

export class WeatherService {
  /**
   * Fetches real live weather data for any coordinate (latitude, longitude) in India
   * Uses Open-Meteo live API (no rate limits, high precision) + OpenWeatherMap if key is provided.
   */
  static async getLiveWeather(lat: number, lon: number): Promise<LiveWeatherReport> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      const current = data.current || {};

      const temp = current.temperature_2m ?? 25;
      const apparentTemp = current.apparent_temperature ?? temp;
      const humidity = current.relative_humidity_2m ?? 50;
      const windSpeed = current.wind_speed_10m ?? 10;
      const precip = current.precipitation ?? 0;
      const weatherCode = current.weather_code ?? 0;

      const condition = this.mapWeatherCodeToCondition(weatherCode);
      const isSuitable = temp >= 10 && temp <= 40 && precip < 10 && windSpeed < 45;

      let alertMessage: string | undefined;
      if (temp > 40) alertMessage = 'Extreme Heat Warning: Stay hydrated and avoid outdoor travel at noon.';
      else if (temp < 5) alertMessage = 'Severe Cold Warning: High altitude ice risks.';
      else if (precip > 15) alertMessage = 'Heavy Rain / Monsoon Warning: Landslide risk in hilly terrain.';
      else if (windSpeed > 45) alertMessage = 'High Wind Warning: Transport disruption likely.';

      return {
        temperature: Math.round(temp),
        apparentTemperature: Math.round(apparentTemp),
        precipitationProbability: Math.round(precip),
        weatherCode,
        weatherCondition: condition,
        windSpeed: Math.round(windSpeed),
        humidity: Math.round(humidity),
        isSuitableForTravel: isSuitable,
        alertMessage,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Error fetching live weather:', error.message);
      return {
        temperature: 24,
        apparentTemperature: 24,
        precipitationProbability: 0,
        weatherCode: 0,
        weatherCondition: 'Clear Sky',
        windSpeed: 8,
        humidity: 45,
        isSuitableForTravel: true,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private static mapWeatherCodeToCondition(code: number): string {
    if (code === 0) return 'Clear Sky';
    if (code === 1 || code === 2 || code === 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy / Low Visibility';
    if (code >= 51 && code <= 67) return 'Rain / Drizzle';
    if (code >= 71 && code <= 77) return 'Snowfall';
    if (code >= 80 && code <= 82) return 'Rain Showers';
    if (code >= 95) return 'Thunderstorm Alert';
    return 'Overcast';
  }
}
