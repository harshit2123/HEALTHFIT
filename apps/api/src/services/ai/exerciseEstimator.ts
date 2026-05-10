/**
 * Token-efficient exercise estimator. Same multi-provider pattern as calorieEstimator.
 *
 * Used when user types unknown exercise (e.g. "Zercher squat" not in seed).
 * AI returns canonical name + category + muscle groups. Cached to DB for next user.
 */
import {
  type AIProvider,
  parseJSON,
  normalizeSearchKey,
} from './types.js'
import Anthropic from '@anthropic-ai/sdk'

export interface EstimatedExercise {
  name: string
  category: 'STRENGTH' | 'CARDIO' | 'FLEXIBILITY' | 'SPORTS' | 'BODYWEIGHT' | 'OTHER'
  primaryMuscles: string[]
  secondaryMuscles?: string[]
  equipment?: string
  defaultUnit: 'REPS' | 'TIME' | 'DISTANCE'
}

const SYSTEM_PROMPT = `You classify exercises. Output JSON only. No prose.
Schema: {"name":string,"category":"STRENGTH"|"CARDIO"|"FLEXIBILITY"|"SPORTS"|"BODYWEIGHT"|"OTHER","primaryMuscles":string[],"secondaryMuscles":string[],"equipment":"barbell"|"dumbbell"|"machine"|"cable"|"bodyweight"|"none","defaultUnit":"REPS"|"TIME"|"DISTANCE"}
Rules:
- Use lowercase muscle names (chest, back, quads, hamstrings, glutes, shoulders, biceps, triceps, core, calves, forearms, full body)
- BODYWEIGHT for no-equipment strength (push-up, pull-up)
- defaultUnit=TIME for plank, holds; DISTANCE for running/cycling; REPS for everything else
- Indian-context exercises (Surya Namaskar, etc.) classify as FLEXIBILITY`

let _client: Anthropic | null = null
function client(): Anthropic | null {
  if (_client) return _client
  const key = process.env['ANTHROPIC_API_KEY']
  if (!key) return null
  _client = new Anthropic({ apiKey: key })
  return _client
}

function getModel(): string {
  return process.env['AI_MODEL'] ?? 'claude-haiku-4-5-20251001'
}

class AnthropicExerciseProvider implements AIProvider {
  readonly name = 'anthropic' as const

  get isConfigured(): boolean {
    return !!process.env['ANTHROPIC_API_KEY']
  }

  async estimateFood() { return null }
  async estimateMealText() { return null }

  async estimateExercise(input: string): Promise<EstimatedExercise | null> {
    const c = client()
    if (!c) return null
    try {
      const response = await c.messages.create({
        model: getModel(),
        max_tokens: 200,
        temperature: 0.1,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: input }],
      })
      const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
      // Parse: schema returns single object, not wrapped
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
      try {
        return JSON.parse(cleaned)
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/)
        if (match) return JSON.parse(match[0])
        return null
      }
    } catch (err) {
      console.error('[AI:exercise] failed:', err)
      return null
    }
  }
}

const provider = new AnthropicExerciseProvider()

export function isAIConfigured(): boolean {
  return provider.isConfigured
}

export async function estimateExercise(input: string): Promise<EstimatedExercise | null> {
  return provider.estimateExercise(input)
}

export { normalizeSearchKey }
