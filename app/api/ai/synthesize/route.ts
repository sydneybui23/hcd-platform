import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { synthesizeFeedback } from '@/lib/claude/synthesizer'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, feedbackLinkId } = await request.json()

  // Get base model from phase 4 canvas
  const { data: phase4 } = await supabase
    .from('phase_sessions')
    .select('canvas')
    .eq('project_id', projectId)
    .eq('phase', 4)
    .single()

  if (!phase4?.canvas) {
    return NextResponse.json({ error: 'Phase 4 must be completed first' }, { status: 400 })
  }

  // Get all feedback responses for this link
  const { data: responses } = await supabase
    .from('feedback_responses')
    .select('*')
    .eq('link_id', feedbackLinkId)

  if (!responses?.length) {
    return NextResponse.json({ error: 'No feedback responses found' }, { status: 400 })
  }

  const synthesizedModel = await synthesizeFeedback(phase4.canvas, responses)

  // Get current iteration count
  const { count } = await supabase
    .from('model_iterations')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const iterationNumber = (count ?? 0) + 1

  const { data: iteration, error } = await supabase
    .from('model_iterations')
    .insert({
      id: uuidv4(),
      project_id: projectId,
      iteration_number: iterationNumber,
      source_responses: responses.map((r) => r.id),
      synthesized_model: synthesizedModel,
      conflicts: synthesizedModel.conflicts ?? [],
      consensus: synthesizedModel.consensus_elements ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ iteration })
}
