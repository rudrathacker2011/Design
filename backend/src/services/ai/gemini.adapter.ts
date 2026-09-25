// ============================================================
// AI Provider — Gemini Adapter
// 
// API KEY REQUIRED:
//   Set GEMINI_API_KEY in backend/.env
//   Get key at: https://aistudio.google.com/app/apikey
//
// Replace this adapter with OpenAI by implementing AIProvider interface.
// ============================================================
import type { AIProvider, ExtractedIntent } from '../providers.interface.js';
import dotenv from 'dotenv';

dotenv.config();

// ── Gemini Real Adapter ───────────────────────────────────────
export class GeminiAIAdapter implements AIProvider {
  private readonly apiKey = process.env.GEMINI_API_KEY;
  private readonly MODEL = 'gemini-1.5-flash-latest';
  private readonly BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  private async call(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('AI_PROVIDER_NOT_CONFIGURED: GEMINI_API_KEY is required.');
    }
    const url = `${this.BASE_URL}/${this.MODEL}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = (await res.json()) as any;
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  async extractIntent(rawText: string): Promise<ExtractedIntent> {
    const prompt = `
You are a travel intent extraction engine for India tourism.
Extract structured intent from this traveller query. Return ONLY valid JSON matching this schema:
{
  "experienceTags": ["heritage","photography","peaceful","nature",...],
  "impliedConstraints": ["no crowds","wheelchair accessible",...],
  "travelStyle": "slow and immersive",
  "budgetSignal": "mid",
  "naturalLanguageSummary": "..."
}

Traveller query: "${rawText}"
JSON only, no markdown:`;

    const raw = await this.call(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned) as ExtractedIntent;
  }

  async generateExplanation(context: Record<string, unknown>): Promise<string> {
    const prompt = `You are YatraSetu's travel advisor. Write a 2-sentence explanation in plain English of why a traveller should ${context.decision} their trip to ${context.destinationName}.
Key factors: ${JSON.stringify(context.factors)}.
Be direct, factual, empathetic. No marketing language.`;
    return this.call(prompt);
  }

  async draftItinerary(context: Record<string, unknown>): Promise<string> {
    const prompt = `Create a day-wise travel itinerary for ${context.destination} over ${context.days} days.
Traveller profile: ${JSON.stringify(context.profile)}.
Format as JSON array: [{"day":1,"title":"...","activities":[{"time":"9:00 AM","activity":"...","duration":"2h","notes":"..."}]}]
JSON only, no markdown:`;
    return this.call(prompt);
  }

  async computeExperienceSimilarity(intentTags: string[], destinationTags: string[]): Promise<number> {
    const prompt = `Rate semantic similarity (0.0–1.0) between traveller intent and destination experience.
Intent: ${intentTags.join(', ')}
Destination: ${destinationTags.join(', ')}
Return ONLY a single decimal number between 0.0 and 1.0. Nothing else.`;
    const result = await this.call(prompt);
    const score = parseFloat(result.trim());
    return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
  }
}
