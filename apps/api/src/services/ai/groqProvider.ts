import {
  type AIProvider,
  type EstimatedFood,
  SYSTEM_PROMPT,
  parseJSON,
} from './types.js'

/**
 * Groq provider — runs Llama 3.3 70B at 300+ tok/s.
 *
 * Free tier: 14,400 req/day, 30 req/min
 * Get key: https://console.groq.com/keys
 *
 * Use case: when you need pure speed (e.g. real-time UX). Less Indian-food-aware
 * than Gemini/Anthropic but works fine with our explicit Indian context prompt.
 */

class GroqProvider implements AIProvider {
  readonly name = 'groq' as const

  get isConfigured(): boolean {
    return !!process.env['GROQ_API_KEY']
  }

  private getModel(): string {
    return process.env['GROQ_MODEL'] ?? 'llama-3.3-70b-versatile'
  }

  private async callGroq(prompt: string, maxTokens: number): Promise<string | null> {
    const key = process.env['GROQ_API_KEY']
    if (!key) return null

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.getModel(),
          temperature: 0.1,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
        }),
      })

      if (!res.ok) {
        const errBody = await res.text()
        console.error(`[AI:groq] ${res.status}: ${errBody.slice(0, 200)}`)
        return null
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      return json.choices?.[0]?.message?.content ?? null
    } catch (err) {
      console.error('[AI:groq] Request failed:', err)
      return null
    }
  }

  async estimateFood(input: string): Promise<EstimatedFood | null> {
    const text = await this.callGroq(input, 150)
    if (!text) return null
    const parsed = parseJSON(text)
    return parsed?.items?.[0] ?? null
  }

  async estimateMealText(input: string): Promise<EstimatedFood[] | null> {
    const text = await this.callGroq(input, 400)
    if (!text) return null
    const parsed = parseJSON(text)
    return parsed?.items ?? null
  }
}

export const groqProvider = new GroqProvider()
