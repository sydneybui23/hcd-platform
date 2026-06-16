'use client'

import { cn, HCD_PHASES } from '@/lib/utils'
import { CheckCircle, Circle, Lock } from 'lucide-react'
import Link from 'next/link'

interface PhaseNavProps {
  projectId: string
  currentPhase: number
  completedPhases: number[]
}

export function PhaseNav({ projectId, currentPhase, completedPhases }: PhaseNavProps) {
  return (
    <nav className="w-64 shrink-0 border-r bg-muted/20 p-4 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        HCD Process
      </p>
      {HCD_PHASES.map((phase) => {
        const isCompleted = completedPhases.includes(phase.number)
        const isCurrent = currentPhase === phase.number
        const isLocked = phase.number > Math.max(...completedPhases, 1) + 1 && !isCurrent

        return (
          <Link
            key={phase.number}
            href={isLocked ? '#' : `/projects/${projectId}/phases/${phase.number}`}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isCurrent && 'bg-primary text-primary-foreground',
              !isCurrent && isCompleted && 'text-foreground hover:bg-accent',
              !isCurrent && !isCompleted && !isLocked && 'text-muted-foreground hover:bg-accent',
              isLocked && 'text-muted-foreground/40 cursor-not-allowed'
            )}
          >
            <span className="shrink-0">
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              ) : isLocked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </span>
            <span className="flex-1 leading-tight">
              <span className="block text-xs opacity-60">Phase {phase.number}</span>
              {phase.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
