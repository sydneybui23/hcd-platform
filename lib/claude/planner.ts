import Anthropic from '@anthropic-ai/sdk'
import { phase7SystemPrompt } from './prompts/phase7'

export async function generateExecutionPlan(
  synthesizedModel: Record<string, unknown>,
  projectBrief: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const client = new Anthropic()

  const userMessage = `
Project Brief:
${JSON.stringify(projectBrief, null, 2)}

Final Synthesized Model:
${JSON.stringify(synthesizedModel, null, 2)}

Please generate a comprehensive execution plan with phased actions, KPIs, data collection framework, and risk assessment.
`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: phase7SystemPrompt,
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
