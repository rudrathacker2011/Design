// ============================================================
// AI Provider — Gemini Adapter
// 
// API KEY REQUIRED:
//   Set GEMINI_API_KEY in backend/.env
//   Get key at: https://aistudio.google.com/app/apikey
//
// If key is absent, falls back to DemoAIAdapter (deterministic tag extraction).
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
      throw new Error('GEMINI_API_KEY not set — falling back to demo provider.');
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

// ── Demo / Fallback AI Adapter (deterministic, no key needed) ──
export class DemoAIAdapter implements AIProvider {
  private readonly EXPERIENCE_CATEGORIES = [
    'heritage', 'architecture', 'photography', 'nature', 'wildlife',
    'adventure', 'trek', 'beach', 'coastal', 'art', 'craft', 'culture',
    'spiritual', 'temple', 'fort', 'palace', 'mountain', 'forest',
    'desert', 'lake', 'river', 'food', 'local', 'village', 'peaceful',
    'offbeat', 'pilgrimage', 'yoga', 'wellness',
  ];

  async extractIntent(rawText: string): Promise<ExtractedIntent> {
    const lower = rawText.toLowerCase();
    const experienceTags = this.EXPERIENCE_CATEGORIES.filter(tag => lower.includes(tag));
    if (experienceTags.length === 0) experienceTags.push('culture', 'nature');

    const impliedConstraints: string[] = [];
    if (lower.includes('quiet') || lower.includes('peaceful') || lower.includes('offbeat')) impliedConstraints.push('minimal crowds');
    if (lower.includes('wheelchair') || lower.includes('accessible') || lower.includes('disability')) impliedConstraints.push('accessibility required');
    if (lower.includes('budget')) impliedConstraints.push('budget-conscious');

    const budgetSignal =
      lower.includes('luxury') || lower.includes('premium') ? 'luxury' :
      lower.includes('budget') || lower.includes('cheap') ? 'budget' : 'mid';

    return {
      experienceTags,
      impliedConstraints,
      travelStyle: impliedConstraints.includes('minimal crowds') ? 'slow and immersive' : 'balanced explorer',
      budgetSignal,
      naturalLanguageSummary: `Traveller seeking ${experienceTags.slice(0, 3).join(', ')} experiences in India.`,
    };
  }

  async generateExplanation(context: Record<string, unknown>): Promise<string> {
    const decision = context.decision as string;
    const dest = context.destinationName as string;
    if (decision === 'GO') return `Based on current conditions, ${dest} is well-suited to your travel preferences. All key requirements are met and the environment is conducive to your intended experience.`;
    if (decision === 'MODIFY') return `${dest} is still a viable option but current conditions suggest adjusting your timing or activities for the best experience.`;
    return `Based on current conditions and your profile, we recommend exploring an experience-equivalent alternative to ${dest} that better matches your requirements right now.`;
  }

  async draftItinerary(context: Record<string, unknown>): Promise<string> {
    const days = (context.days as number) ?? 3;
    const dest = context.destination as string;
    const itinerary = [];
    for (let d = 1; d <= days; d++) {
      itinerary.push({
        day: d,
        title: d === 1 ? `Arrival & Orientation at ${dest}` : d === days ? `Final Exploration & Departure` : `Exploration Day ${d}`,
        activities: [
          { time: '9:00 AM', activity: d === 1 ? 'Check into accommodation & local orientation' : 'Morning sightseeing at key attraction', duration: '2h', notes: 'Follow local guide recommendations' },
          { time: '12:00 PM', activity: 'Local cuisine lunch at verified eatery', duration: '1h', notes: 'Try regional specialties' },
          { time: '2:00 PM', activity: 'Afternoon cultural or nature experience', duration: '3h', notes: 'Best experienced with local guide' },
          { time: '6:00 PM', activity: 'Sunset viewpoint or market visit', duration: '1.5h', notes: 'Carry offline maps' },
        ],
      });
    }
    return JSON.stringify(itinerary);
  }

  async computeExperienceSimilarity(intentTags: string[], destinationTags: string[]): Promise<number> {
    const intentSet = new Set(intentTags.map(t => t.toLowerCase()));
    const destSet = new Set(destinationTags.map(t => t.toLowerCase()));
    const intersection = [...intentSet].filter(t => destSet.has(t)).length;
    const union = new Set([...intentSet, ...destSet]).size;
    return union === 0 ? 0.5 : intersection / union;
  }
}
