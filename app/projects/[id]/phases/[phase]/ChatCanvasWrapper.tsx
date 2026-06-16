'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChatCanvas } from '@/components/hcd/ChatCanvas'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  projectId: string
  phase: number
  initialMessages: { role: 'user' | 'assistant'; content: string }[]
  canvas: Record<string, unknown> | null
  isPhaseComplete: boolean
  nextPhase?: number
  projectContext?: string
}

export function ChatCanvasWrapper({
  projectId,
  phase,
  initialMessages,
  canvas,
  isPhaseComplete,
  nextPhase,
  projectContext,
}: Props) {
  const router = useRouter()

  const handleMessagesUpdate = useCallback(
    async (
      messages: { role: 'user' | 'assistant'; content: string }[],
      updatedCanvas: Record<string, unknown> | null,
      complete: boolean
    ) => {
      const supabase = createClient()

      // Upsert phase session
      await supabase.from('phase_sessions').upsert(
        {
          id: uuidv4(),
          project_id: projectId,
          phase,
          messages,
          canvas: updatedCanvas ?? canvas,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'project_id,phase', ignoreDuplicates: false }
      )

      // Advance project phase if complete
      if (complete && nextPhase) {
        await supabase
          .from('projects')
          .update({ current_phase: nextPhase })
          .eq('id', projectId)
          .lt('current_phase', nextPhase)
      }
    },
    [projectId, phase, canvas, nextPhase]
  )

  const handleAdvancePhase = useCallback(() => {
    if (nextPhase) {
      router.push(`/projects/${projectId}/phases/${nextPhase}`)
    }
  }, [router, projectId, nextPhase])

  return (
    <ChatCanvas
      projectId={projectId}
      phase={phase}
      initialMessages={initialMessages}
      canvas={canvas}
      isPhaseComplete={isPhaseComplete}
      onMessagesUpdate={handleMessagesUpdate}
      onAdvancePhase={nextPhase ? handleAdvancePhase : undefined}
      projectContext={projectContext}
    />
  )
}
