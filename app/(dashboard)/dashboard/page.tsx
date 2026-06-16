import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowRight } from 'lucide-react'
import { HCD_PHASES } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-gray-600 mt-1">Your human-centered design projects</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="h-4 w-4" /> New project
          </Link>
        </Button>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {projects.map((project) => {
            const phase = HCD_PHASES.find((p) => p.number === project.current_phase)
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{project.title}</CardTitle>
                    <Badge variant={project.status === 'active' ? 'success' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                  {project.sector && <p className="text-xs text-gray-500">{project.sector}</p>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Current phase</p>
                      <p className="text-sm font-medium">
                        {phase ? `${phase.number}. ${phase.name}` : 'Not started'}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/projects/${project.id}/phases/${project.current_phase ?? 1}`}>
                        Continue <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                  {/* Phase progress bar */}
                  <div className="mt-3 flex gap-0.5">
                    {HCD_PHASES.map((p) => (
                      <div
                        key={p.number}
                        className={`h-1 flex-1 rounded-full ${
                          p.number < (project.current_phase ?? 1)
                            ? 'bg-blue-600'
                            : p.number === project.current_phase
                            ? 'bg-blue-300'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-xl p-16 text-center">
          <h3 className="font-semibold text-lg mb-2">Start your first project</h3>
          <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
            Compass will guide you through an 8-phase human-centered design process — from challenge framing to execution plan.
          </p>
          <Button asChild>
            <Link href="/dashboard/projects/new">
              <Plus className="h-4 w-4" /> Create a project
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
