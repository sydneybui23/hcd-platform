import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamPhaseChat, type Message } from '@/lib/claude/facilitator'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, phase, messages, projectContext } = await request.json()

  if (!projectId || !phase || !messages) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify user owns/belongs to this project
  const { data: project } = await supabase
    .from('projects')
    .select('id, org_id')
    .eq('id', projectId)
    .single()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const stream = await streamPhaseChat(phase, messages as Message[], projectContext)

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
