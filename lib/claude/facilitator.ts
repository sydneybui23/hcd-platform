import Anthropic from '@anthropic-ai/sdk'
import { phase1SystemPrompt } from './prompts/phase1'
import { phase2SystemPrompt } from './prompts/phase2'
import { phase3SystemPrompt } from './prompts/phase3'
import { phase4SystemPrompt } from './prompts/phase4'
import { phase5SystemPrompt } from './prompts/phase5'
import { phase6SystemPrompt } from './prompts/phase6'
import { phase7SystemPrompt } from './prompts/phase7'
import { phase8SystemPrompt } from './prompts/phase8'

const phasePrompts: Record<number, string> = {
  1: phase1SystemPrompt,
  2: phase2SystemPrompt,
  3: phase3SystemPrompt,
  4: phase4SystemPrompt,
  5: phase5SystemPrompt,
  6: phase6SystemPrompt,
  7: phase7SystemPrompt,
  8: phase8SystemPrompt,
}

export type Message = { role: 'user' | 'assistant'; content: string }

export function getPhaseSystemPrompt(phase: number): string {
  return phasePrompts[phase] ?? phasePrompts[1]
}

export async function streamPhaseChat(
  phase: number,
  messages: Message[],
  projectContext?: string
): Promise<ReadableStream> {
  const client = new Anthropic()

  const systemPrompt = getPhaseSystemPrompt(phase) +
    (projectContext ? `\n\nProject context:\n${projectContext}` : '')

  const stream = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages as Anthropic.MessageParam[],
    stream: true,
  })

  return new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(new TextEncoder().encode(event.delta.text))
        }
        if (event.type === 'message_stop') {
          controller.close()
        }
      }
    },
  })
}

export function extractCanvasFromResponse(text: string): Record<string, unknown> | null {
  const match = text.match(/<canvas>([\s\S]*?)<\/canvas>/)
  if (!match) return null
  try {
    return JSON.parse(match[1].trim())
  } catch {
    return null
  }
}

export function isPhaseComplete(text: string): boolean {
  return text.includes('[PHASE_COMPLETE]')
}
