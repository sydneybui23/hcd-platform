'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'

interface FeedbackQuestion {
  question: string
  type: 'likert' | 'open' | 'multiple_choice'
  options?: string[]
}

interface FeedbackFormProps {
  token: string
  projectTitle: string
  modelSummary: string
  questions: FeedbackQuestion[]
}

export function FeedbackForm({ token, projectTitle, modelSummary, questions }: FeedbackFormProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  const [adaptations, setAdaptations] = useState<Record<string, string>>({})
  const [overallAdaptation, setOverallAdaptation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !role.trim()) {
      setError('Please provide your name and role.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          respondentName: name,
          respondentRole: role,
          responses,
          adaptations: { ...adaptations, overall: overallAdaptation },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Submission failed')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h2 className="text-2xl font-bold">Thank you for your feedback!</h2>
        <p className="text-muted-foreground max-w-md">
          Your input will help shape and strengthen this solution. The project team will review all feedback and synthesize it into an improved model.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold">{projectTitle}</h1>
        <p className="text-muted-foreground mt-1">Share your perspective to help improve this design</p>
      </div>

      {/* Model summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">The Proposed Solution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{modelSummary}</p>
        </CardContent>
      </Card>

      {/* Respondent info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About You</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium">Your name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="mt-1"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Your role or relationship to this issue</label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Community member, Healthcare worker, Policy advisor..."
              className="mt-1"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Dynamic questions */}
      {questions.map((q, i) => (
        <Card key={i}>
          <CardContent className="pt-6 space-y-3">
            <p className="font-medium text-sm">{q.question}</p>
            {q.type === 'likert' && (
              <LikertScale
                value={responses[i] as number}
                onChange={(v) => setResponses((prev) => ({ ...prev, [i]: v }))}
              />
            )}
            {q.type === 'open' && (
              <Textarea
                value={(responses[i] as string) ?? ''}
                onChange={(e) => setResponses((prev) => ({ ...prev, [i]: e.target.value }))}
                placeholder="Your thoughts..."
                rows={3}
              />
            )}
            {q.type === 'multiple_choice' && q.options && (
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={`q-${i}`}
                      value={opt}
                      checked={responses[i] === opt}
                      onChange={() => setResponses((prev) => ({ ...prev, [i]: opt }))}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground">How would you adapt this for your context? (optional)</label>
              <Textarea
                value={adaptations[i] ?? ''}
                onChange={(e) => setAdaptations((prev) => ({ ...prev, [i]: e.target.value }))}
                placeholder="Suggest a change, alternative, or local adaptation..."
                rows={2}
                className="mt-1 text-sm"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Overall adaptation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Adaptation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            If you could change one thing about this solution to make it work better in your community or context, what would it be?
          </p>
          <Textarea
            value={overallAdaptation}
            onChange={(e) => setOverallAdaptation(e.target.value)}
            placeholder="Your most important suggested change..."
            rows={4}
          />
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Feedback'}
      </Button>
    </form>
  )
}

function LikertScale({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-10 rounded-md border text-sm font-medium transition-colors ${
              value === n
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent border-input'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{labels[0]}</span>
        <span>{labels[4]}</span>
      </div>
    </div>
  )
}
