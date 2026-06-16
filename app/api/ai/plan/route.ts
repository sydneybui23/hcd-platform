import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExecutionPlan } from '@/lib/claude/planner'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, iterationId } = await request.json()

  const [{ data: iteration }, { data: phase1 }] = await Promise.all([
    supabase.from('model_iterations').select('*').eq('id', iterationId).single(),
    supabase.from('phase_sessions').select('canvas').eq('project_id', projectId).eq('phase', 1).single(),
  ])

  if (!iteration) return NextResponse.json({ error: 'Iteration not found' }, { status: 404 })
  if (!phase1?.canvas) return NextResponse.json({ error: 'Phase 1 must be completed' }, { status: 400 })

  const plan = await generateExecutionPlan(iteration.synthesized_model, phase1.canvas)

  const { data: executionPlan, error } = await supabase
    .from('execution_plans')
    .insert({
      id: uuidv4(),
      project_id: projectId,
      iteration_id: iterationId,
      plan: plan.execution_phases ?? plan,
      kpis: plan.kpis ?? [],
      timeline: plan.execution_phases ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ executionPlan })
}
