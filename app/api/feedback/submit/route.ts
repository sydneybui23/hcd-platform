import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  // Uses service role — no auth required for public feedback submission
  const supabase = await createServiceClient()

  const { token, respondentName, respondentRole, responses, adaptations } = await request.json()

  if (!token || !respondentName || !respondentRole || !responses) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate link exists and is active
  const { data: link } = await supabase
    .from('feedback_links')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (!link) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This feedback link has expired' }, { status: 410 })
  }

  const { error } = await supabase.from('feedback_responses').insert({
    id: uuidv4(),
    link_id: link.id,
    respondent_name: respondentName,
    respondent_role: respondentRole,
    responses,
    adaptations: adaptations ?? {},
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
