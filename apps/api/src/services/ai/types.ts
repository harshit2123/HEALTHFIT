// AI provider abstraction. Each provider implements estimate() with the same contract.
// Strategy pattern: orchestrator picks provider based on AI_PROVIDER env var.

export interface EstimatedFood {
  name: string
  servingSize: string
  cal: number
  p: number
  c: number
  f: number
  fib?: number
  confidence: 'high' | 'medium' | 'low'
}

export interface AIProvider {
  readonly name: 'anthropic' | 'gemini' | 'groq'
  readonly isConfigured: boolean
  estimateFood(input: string): Promise<EstimatedFood | null>
  estimateMealText(input: string): Promise<EstimatedFood[] | null>
}

// Same prompt for all providers — keeps responses consistent.
// Indian-food-aware. Strict JSON output. Short keys to save tokens.
export const SYSTEM_PROMPT = `You estimate Indian food macros. Output JSON only. No prose.
Schema: {"items":[{"name":string,"servingSize":string,"cal":number,"p":number,"c":number,"f":number,"fib":number,"confidence":"high"|"medium"|"low"}]}
Rules:
- Indian context: roti=40g, dal bowl=150g, rice cup=158g, paratha=60g
- Macros are TOTAL for the serving stated, not per 100g
- confidence=high for common Indian dishes, low for ambiguous
- If input mentions multiple foods, return one item per food
- Round to integers`

export function parseJSON(text: string): { items?: EstimatedFood[] } | null {
  if (!text) return null

  // Strip markdown code fences if present (some models wrap in ```json...```)
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    // Last resort: find the first { ... } block
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }
    return null
  }
}

export function normalizeSearchKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100)
}
