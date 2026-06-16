import Anthropic from '@anthropic-ai/sdk'
import { phase6SystemPrompt } from './prompts/phase6'

export interface FeedbackResponse {
  respondent_name: string
  respondent_role: string
  responses: Record<string, unknown>
  adaptations: Record<string, unknown>
}

export async function synthesizeFeedback(
  baseModel: Record<string, unknown>,
  feedbackResponses: FeedbackResponse[]
): Promise<Record<string, unknown>> {
  const client = new Anthropic()

  const userMessage = `
Here is the base model developed during Phase 4:
${JSON.stringify(baseModel, null, 2)}

Here are ${feedbackResponses.length} stakeholder feedback responses:
${feedbackResponses.map((r, i) => `
--- Respondent ${i + 1}: ${r.respondent_name} (${r.respondent_role}) ---
Feedback: ${JSON.stringify(r.responses, null, 2)}
Adaptations proposed: ${JSON.stringify(r.adaptations, null, 2)}
`).join('\n')}

Please synthesize all of this feedback into a unified model iteration. Identify consensus, surface conflicts, note localization needs, and produce the unified model.
`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: phase6SystemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const canvasMatch = text.match(/<canvas>([\s\S]*?)<\/canvas>/)

  if (canvasMatch) {
    try {
      return JSON.parse(canvasMatch[1].trim())
    } catch {
      return { raw: text }
    }
  }

  return { raw: text }
}
