import { createServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { FeedbackForm } from '@/components/hcd/FeedbackForm'

interface Props {
  params: Promise<{ token: string }>
}

export default async function PublicFeedbackPage({ params }: Props) {
  const { token } = await params

  const supabase = await createServiceClient()

  const { data: link } = await supabase
    .from('feedback_links')
    .select('*, projects(title)')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (!link) notFound()

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">This link has expired</h1>
          <p className="text-gray-600">The feedback period for this project has ended.</p>
        </div>
      </div>
    )
  }

  const modelSnapshot = link.model_snapshot as Record<string, unknown>
  const questions = (modelSnapshot?.feedback_questions as { question: string; type: 'likert' | 'open' | 'multiple_choice'; options?: string[] }[]) ?? [
    { question: 'How well does this solution address the core challenge?', type: 'likert' },
    { question: 'How feasible is this solution in your context?', type: 'likert' },
    { question: 'What aspects of this solution work best for your community or context?', type: 'open' },
    { question: 'What aspects would need to change to work in your context?', type: 'open' },
    { question: 'Are there important perspectives or needs this solution misses?', type: 'open' },
  ]

  const projectTitle = (link.projects as { title: string } | null)?.title ?? 'Design Feedback'
  const modelSummary = (modelSnapshot?.summary_for_participants as string) ??
    (modelSnapshot?.model_summary_for_participants as string) ??
    JSON.stringify(modelSnapshot, null, 2)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="py-6 mb-4 text-center">
          <span className="text-blue-600 font-bold text-lg">Compass</span>
          <p className="text-xs text-gray-500 mt-0.5">Human-Centered Design Platform</p>
        </div>
        <FeedbackForm
          token={token}
          projectTitle={projectTitle}
          modelSummary={modelSummary}
          questions={questions}
        />
      </div>
    </div>
  )
}
