// ============================================================
// WeatherProvider Adapter — Open-Meteo (free, no key required)
// Replace with a commercial provider by implementing WeatherProvider
// and swapping the import in registry.ts
// ============================================================
import type { WeatherProvider, WeatherCondition } from '../providers.interface.js';

export class OpenMeteoWeatherAdapter implements WeatherProvider {
  private readonly BASE_URL = 'https://api.open-meteo.com/v1/forecast';

  async getLiveWeather(lat: number, lon: number): Promise<WeatherCondition> {
    try {
      const url = `${this.BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,precipitation_probability,weather_code,wind_speed_10m&timezone=auto`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

      if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

      const data = (await res.json()) as any;
      const c = data.current ?? {};

      const requiredValues = [c.temperature_2m, c.precipitation, c.precipitation_probability, c.wind_speed_10m, c.weather_code];
      if (!requiredValues.every((value) => typeof value === 'number' && Number.isFinite(value))) {
        throw new Error('Open-Meteo response is missing required current weather fields.');
      }
      const temp: number = c.temperature_2m;
      const precip: number = c.precipitation;
      const precipitationProbability: number = c.precipitation_probability;
      const wind: number = c.wind_speed_10m;
      const humidity: number | null = typeof c.relative_humidity_2m === 'number' ? c.relative_humidity_2m : null;
      const code: number = c.weather_code;
      const apparent: number | null = typeof c.apparent_temperature === 'number' ? c.apparent_temperature : null;
      const offsetSeconds = typeof data.utc_offset_seconds === 'number' ? data.utc_offset_seconds : 0;
      const providerTime = typeof c.time === 'string' ? Date.parse(`${c.time}Z`) : NaN;
      const collectedAt = Number.isFinite(providerTime)
        ? new Date(providerTime - offsetSeconds * 1000).toISOString()
        : new Date().toISOString();

      const condition = this.decodeWeatherCode(code);
      const isOk = temp >= 8 && temp <= 42 && precip < 12 && wind < 50;

      let alertMessage: string | undefined;
      if (temp > 42) alertMessage = '⚠️ Extreme Heat Advisory: Outdoor travel inadvisable between 11am–4pm.';
      else if (temp < 3) alertMessage = '⚠️ Cold Wave Warning: Ice & hypothermia risk in high-altitude areas.';
      else if (precip > 20) alertMessage = '⚠️ Heavy Rain / Monsoon Alert: Landslide risk on hill routes.';
      else if (wind > 50) alertMessage = '⚠️ Cyclonic Wind Warning: Transport services may be disrupted.';

      return {
        temperature: Math.round(temp),
        apparentTemperature: apparent === null ? null : Math.round(apparent),
        precipitation: Math.round(precip * 10) / 10,
        precipitationProbability: Math.round(precipitationProbability),
        weatherCode: code,
        weatherCondition: condition,
        windSpeed: Math.round(wind),
        humidity: humidity === null ? null : Math.round(humidity),
        isSuitableForTravel: isOk,
        alertMessage,
        source: 'Open-Meteo',
        collectedAt,
        confidenceLevel: 'medium',
      };
    } catch (err: any) {
      console.warn('[Weather] Open-Meteo fetch failed:', err.message);
      return this.unknownWeather();
    }
  }

  async getForecast(lat: number, lon: number, days: number): Promise<WeatherCondition[]> {
    try {
      const url = `${this.BASE_URL}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max&forecast_days=${days}&timezone=auto`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`Open-Meteo forecast error: ${res.status}`);
      const data = (await res.json()) as any;
      const daily = data.daily ?? {};
      const len: number = (daily.temperature_2m_max ?? []).length;
      const results: WeatherCondition[] = [];

      for (let i = 0; i < len; i++) {
        const temp = daily.temperature_2m_max[i] ?? 25;
        const precip = daily.precipitation_sum[i] ?? 0;
        const wind = daily.wind_speed_10m_max[i] ?? 10;
        const code = daily.weather_code[i] ?? 0;
        results.push({
          temperature: Math.round(temp),
          apparentTemperature: Math.round(temp - 2),
          precipitation: precip,
          precipitationProbability: Math.round(precip * 5),
          weatherCode: code,
          weatherCondition: this.decodeWeatherCode(code),
          windSpeed: Math.round(wind),
          humidity: 55,
          isSuitableForTravel: temp < 42 && precip < 12,
          source: 'Open-Meteo Forecast',
          collectedAt: new Date().toISOString(),
          confidenceLevel: i < 3 ? 'high' : 'medium',
        });
      }
      return results;
    } catch {
      return [];
    }
  }

  private decodeWeatherCode(code: number): string {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Fog / Low Visibility';
    if (code <= 67) return 'Rain / Drizzle';
    if (code <= 77) return 'Snowfall';
    if (code <= 82) return 'Rain Showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Overcast';
  }

  private unknownWeather(): WeatherCondition {
    return {
      temperature: 0, apparentTemperature: 0, precipitation: 0,
      precipitationProbability: 0, weatherCode: -1, weatherCondition: 'Unknown',
      windSpeed: 0, humidity: 0, isSuitableForTravel: null,
      source: 'UNAVAILABLE', collectedAt: new Date().toISOString(),
      confidenceLevel: 'unknown',
    };
  }
}
