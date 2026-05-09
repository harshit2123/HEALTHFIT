import {
  type AIProvider,
  type EstimatedFood,
  SYSTEM_PROMPT,
  parseJSON,
} from './types.js'

/**
 * Google Gemini provider via REST API (no SDK dependency).
 *
 * Free tier: 15 req/min, 1M tokens/day on Gemini 1.5 Flash
 * → ~14,000 free food lookups per day
 *
 * Get key: https://aistudio.google.com/app/apikey
 */

class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const

  get isConfigured(): boolean {
    return !!process.env['GEMINI_API_KEY']
  }

  private getModel(): string {
    // Default to flash (free tier). Override via env: GEMINI_MODEL=gemini-1.5-pro etc.
    return process.env['GEMINI_MODEL'] ?? 'gemini-1.5-flash'
  }

  private async callGemini(prompt: string, maxTokens: number): Promise<string | null> {
    const key = process.env['GEMINI_API_KEY']
    if (!key) return null

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.getModel()}:generateContent?key=${key}`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
          },
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        console.error(`[AI:gemini] ${res.status}: ${errBody.slice(0, 200)}`)
        return null
      }

      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      return json.candidates?.[0]?.content?.parts?.[0]?.text ?? null
    } catch (err) {
      console.error('[AI:gemini] Request failed:', err)
      return null
    }
  }

  async estimateFood(input: string): Promise<EstimatedFood | null> {
    const text = await this.callGemini(input, 150)
    if (!text) return null
    const parsed = parseJSON(text)
    return parsed?.items?.[0] ?? null
  }

  async estimateMealText(input: string): Promise<EstimatedFood[] | null> {
    const text = await this.callGemini(input, 400)
    if (!text) return null
    const parsed = parseJSON(text)
    return parsed?.items ?? null
  }
}

export const geminiProvider = new GeminiProvider()
