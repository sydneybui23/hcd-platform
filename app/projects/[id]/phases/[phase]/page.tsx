import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { PhaseNav } from '@/components/hcd/PhaseNav'
import { ChatCanvasWrapper } from './ChatCanvasWrapper'
import { HCD_PHASES } from '@/lib/utils'

interface Props {
  params: Promise<{ id: string; phase: string }>
}

export default async function PhasePage({ params }: Props) {
  const { id: projectId, phase: phaseParam } = await params
  const phaseNumber = parseInt(phaseParam, 10)

  if (isNaN(phaseNumber) || phaseNumber < 1 || phaseNumber > 8) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: project }, { data: phaseSession }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('phase_sessions').select('*').eq('project_id', projectId).eq('phase', phaseNumber).maybeSingle(),
  ])

  if (!project) notFound()

  // Get completed phases
  const { data: completedSessions } = await supabase
    .from('phase_sessions')
    .select('phase, canvas')
    .eq('project_id', projectId)
    .not('canvas', 'is', null)

  const completedPhases = (completedSessions ?? [])
    .filter((s) => s.canvas && Object.keys(s.canvas).length > 1) // has more than just scope_of_work
    .map((s) => s.phase as number)

  const phaseInfo = HCD_PHASES.find((p) => p.number === phaseNumber)!

  // Build project context for the AI
  const phase1Session = completedSessions?.find((s) => s.phase === 1)
  const projectContext = phase1Session?.canvas
    ? `Project: ${project.title}\nSector: ${project.sector ?? 'Not specified'}\nScope of work: ${JSON.stringify(phase1Session.canvas, null, 2)}`
    : `Project: ${project.title}\nSector: ${project.sector ?? 'Not specified'}`

  return (
    <div className="flex h-screen overflow-hidden">
      <PhaseNav
        projectId={projectId}
        currentPhase={phaseNumber}
        completedPhases={completedPhases}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Phase header */}
        <div className="border-b px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phase {phaseNumber}</p>
            <h1 className="text-lg font-bold">{phaseInfo.name}</h1>
          </div>
          <p className="text-sm text-gray-500 truncate max-w-sm">{project.title}</p>
        </div>

        <ChatCanvasWrapper
          projectId={projectId}
          phase={phaseNumber}
          initialMessages={phaseSession?.messages ?? []}
          canvas={phaseSession?.canvas ?? null}
          isPhaseComplete={completedPhases.includes(phaseNumber)}
          nextPhase={phaseNumber < 8 ? phaseNumber + 1 : undefined}
          projectContext={projectContext}
        />
      </div>
    </div>
  )
}
