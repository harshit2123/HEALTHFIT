import { type AIProvider, type EstimatedFood, normalizeSearchKey } from './types.js'
import { anthropicProvider } from './anthropicProvider.js'
import { geminiProvider } from './geminiProvider.js'
import { groqProvider } from './groqProvider.js'

export { normalizeSearchKey, type EstimatedFood } from './types.js'

/**
 * Multi-provider AI orchestrator with auto-fallback.
 *
 * Priority order (configurable via AI_PROVIDER env):
 * 1. AI_PROVIDER env var (gemini|anthropic|groq) — explicit choice
 * 2. Auto: Gemini (free) → Anthropic (paid, best quality) → Groq (free, fast)
 *
 * If primary fails (rate limit, error, etc.), falls back to next configured provider.
 *
 * Cost-conscious defaults:
 * - Gemini Flash: 1M tokens/day FREE → ~14k food lookups
 * - Groq Llama: 14k req/day FREE
 * - Anthropic Haiku: ~$0.0002/lookup paid
 */

const ALL_PROVIDERS: AIProvider[] = [geminiProvider, anthropicProvider, groqProvider]

function getProviderOrder(): AIProvider[] {
  const explicit = process.env['AI_PROVIDER']?.toLowerCase()

  if (explicit) {
    const matched = ALL_PROVIDERS.find((p) => p.name === explicit)
    if (matched && matched.isConfigured) return [matched]
    // If explicit choice not configured, fall through to auto
    console.warn(`[AI] AI_PROVIDER=${explicit} but not configured. Falling back to auto.`)
  }

  // Auto: prefer free providers first, then paid as fallback
  return ALL_PROVIDERS.filter((p) => p.isConfigured)
}

export function isAIConfigured(): boolean {
  return ALL_PROVIDERS.some((p) => p.isConfigured)
}

export function getActiveProvider(): string | null {
  const order = getProviderOrder()
  return order[0]?.name ?? null
}

export function getProviderStatus() {
  return ALL_PROVIDERS.map((p) => ({
    name: p.name,
    configured: p.isConfigured,
  }))
}

/**
 * Estimate single food. Tries providers in order until one succeeds.
 */
export async function estimateFood(input: string): Promise<EstimatedFood | null> {
  const providers = getProviderOrder()
  if (providers.length === 0) return null

  for (const provider of providers) {
    const result = await provider.estimateFood(input)
    if (result) return result
    // If null returned, try next provider (likely rate limit or error)
  }

  return null
}

/**
 * Bulk estimation. Same fallback chain.
 */
export async function estimateMealText(input: string): Promise<EstimatedFood[] | null> {
  const providers = getProviderOrder()
  if (providers.length === 0) return null

  for (const provider of providers) {
    const result = await provider.estimateMealText(input)
    if (result && result.length > 0) return result
  }

  return null
}
