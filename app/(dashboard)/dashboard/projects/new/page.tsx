'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowRight } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const SECTORS = [
  'Public Health', 'Education', 'Economic Development', 'Environment & Climate',
  'Housing & Urban', 'Food Security', 'Water & Sanitation', 'Governance & Civic',
  'Technology & Innovation', 'Social Services', 'Other',
]

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    sector: '',
    challenge: '',
    targetPopulation: '',
    geography: '',
    existingAttempts: '',
    constraints: '',
    successDefinition: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.challenge) {
      setError('Project title and challenge description are required.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const projectId = uuidv4()

    const { error: projectError } = await supabase.from('projects').insert({
      id: projectId,
      title: form.title,
      sector: form.sector,
      current_phase: 1,
      status: 'active',
    })

    if (projectError) { setError(projectError.message); setLoading(false); return }

    // Save scope of work as initial context for phase 1
    await supabase.from('phase_sessions').insert({
      id: uuidv4(),
      project_id: projectId,
      phase: 1,
      messages: [],
      canvas: {
        scope_of_work: {
          challenge: form.challenge,
          target_population: form.targetPopulation,
          geography: form.geography,
          existing_attempts: form.existingAttempts,
          constraints: form.constraints,
          success_definition: form.successDefinition,
        }
      },
    })

    router.push(`/projects/${projectId}/phases/1`)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Start a new project</h1>
        <p className="text-gray-600 mt-1">
          Fill out this scope of work — your answers will help Claude facilitate the HCD process.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm font-medium">Project title *</label>
          <Input value={form.title} onChange={set('title')} placeholder="e.g., Improving maternal health access in rural areas" className="mt-1" required />
        </div>

        <div>
          <label className="text-sm font-medium">Sector</label>
          <select value={form.sector} onChange={set('sector')} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Select a sector...</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Describe the challenge *</label>
          <p className="text-xs text-gray-500 mt-0.5 mb-1">What problem are you trying to solve? Who is affected and how?</p>
          <Textarea value={form.challenge} onChange={set('challenge')} placeholder="In our community, many residents struggle to access..." rows={4} required />
        </div>

        <div>
          <label className="text-sm font-medium">Who is most affected?</label>
          <Input value={form.targetPopulation} onChange={set('targetPopulation')} placeholder="e.g., Rural women aged 18-45, smallholder farmers..." className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium">Where does this challenge exist?</label>
          <Input value={form.geography} onChange={set('geography')} placeholder="e.g., Northern Ghana, urban neighborhoods in Chicago..." className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium">What has already been tried?</label>
          <Textarea value={form.existingAttempts} onChange={set('existingAttempts')} placeholder="Previous programs, policies, or solutions that have been attempted..." rows={3} />
        </div>

        <div>
          <label className="text-sm font-medium">Key constraints</label>
          <Textarea value={form.constraints} onChange={set('constraints')} placeholder="Budget, timeline, political, cultural, or logistical constraints..." rows={2} />
        </div>

        <div>
          <label className="text-sm font-medium">How will you know you succeeded?</label>
          <Textarea value={form.successDefinition} onChange={set('successDefinition')} placeholder="What does success look like? What would change for the people affected?" rows={3} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Start Phase 1: Frame the Challenge <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
    </div>
  )
}
