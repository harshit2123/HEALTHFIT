import Anthropic from '@anthropic-ai/sdk'
import {
  type AIProvider,
  type EstimatedFood,
  SYSTEM_PROMPT,
  parseJSON,
} from './types.js'

class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const
  private _client: Anthropic | null = null

  get isConfigured(): boolean {
    return !!process.env['ANTHROPIC_API_KEY']
  }

  private client(): Anthropic | null {
    if (this._client) return this._client
    const key = process.env['ANTHROPIC_API_KEY']
    if (!key) return null
    this._client = new Anthropic({ apiKey: key })
    return this._client
  }

  private getModel(): string {
    return process.env['AI_MODEL'] ?? 'claude-haiku-4-5-20251001'
  }

  async estimateFood(input: string): Promise<EstimatedFood | null> {
    const c = this.client()
    if (!c) return null

    try {
      const response = await c.messages.create({
        model: this.getModel(),
        max_tokens: 150,
        temperature: 0.1,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: input }],
      })

      const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
      const parsed = parseJSON(text)
      return parsed?.items?.[0] ?? null
    } catch (err) {
      console.error('[AI:anthropic] Estimation failed:', err)
      return null
    }
  }

  async estimateMealText(input: string): Promise<EstimatedFood[] | null> {
    const c = this.client()
    if (!c) return null

    try {
      const response = await c.messages.create({
        model: this.getModel(),
        max_tokens: 400,
        temperature: 0.1,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: input }],
      })

      const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
      const parsed = parseJSON(text)
      return parsed?.items ?? null
    } catch (err) {
      console.error('[AI:anthropic] Bulk estimation failed:', err)
      return null
    }
  }
}

export const anthropicProvider = new AnthropicProvider()
