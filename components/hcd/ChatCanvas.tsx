'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatCanvasProps {
  projectId: string
  phase: number
  initialMessages?: Message[]
  canvas?: Record<string, unknown> | null
  isPhaseComplete?: boolean
  onMessagesUpdate?: (messages: Message[], canvas: Record<string, unknown> | null, isComplete: boolean) => void
  onAdvancePhase?: () => void
  projectContext?: string
}

export function ChatCanvas({
  projectId,
  phase,
  initialMessages = [],
  canvas,
  isPhaseComplete = false,
  onMessagesUpdate,
  onAdvancePhase,
  projectContext,
}: ChatCanvasProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.length > 0
      ? initialMessages
      : [{ role: 'assistant', content: getWelcomeMessage(phase) }]
  )
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentCanvas, setCurrentCanvas] = useState(canvas ?? null)
  const [phaseComplete, setPhaseComplete] = useState(isPhaseComplete)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)

    const assistantMessage: Message = { role: 'assistant', content: '' }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, phase, messages: newMessages, projectContext }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: fullText }
          return updated
        })
      }

      // Extract canvas and check completion
      const canvasMatch = fullText.match(/<canvas>([\s\S]*?)<\/canvas>/)
      let extractedCanvas = currentCanvas
      if (canvasMatch) {
        try {
          extractedCanvas = JSON.parse(canvasMatch[1].trim())
          setCurrentCanvas(extractedCanvas)
        } catch {}
      }

      const complete = fullText.includes('[PHASE_COMPLETE]')
      if (complete) setPhaseComplete(true)

      const finalMessages = [...newMessages, { role: 'assistant' as const, content: fullText }]
      onMessagesUpdate?.(finalMessages, extractedCanvas, complete)
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }, [input, isStreaming, messages, projectId, phase, projectContext, currentCanvas, onMessagesUpdate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Chat panel */}
      <div className="flex flex-col flex-1 border-r">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm'
                )}
              >
                {msg.content.replace('[PHASE_COMPLETE]', '').replace(/<canvas>[\s\S]*?<\/canvas>/g, '').trim()}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-4 space-y-3">
          {phaseComplete && onAdvancePhase && (
            <Button onClick={onAdvancePhase} className="w-full" variant="outline">
              Advance to next phase <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="resize-none min-h-[44px] max-h-32"
              rows={1}
              disabled={isStreaming}
            />
            <Button onClick={sendMessage} disabled={isStreaming || !input.trim()} size="icon">
              {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas panel */}
      <div className="w-96 shrink-0 overflow-y-auto p-4 bg-muted/10">
        <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
          Phase Artifact
        </h3>
        {currentCanvas ? (
          <CanvasRenderer canvas={currentCanvas} />
        ) : (
          <div className="text-sm text-muted-foreground text-center mt-16">
            <p>Your phase artifact will appear here</p>
            <p className="text-xs mt-1">Complete the conversation to generate it</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CanvasRenderer({ canvas }: { canvas: Record<string, unknown> }) {
  return (
    <div className="space-y-4">
      {Object.entries(canvas).map(([key, value]) => (
        <div key={key} className="rounded-lg border bg-background p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            {key.replace(/_/g, ' ')}
          </h4>
          <CanvasValue value={value} />
        </div>
      ))}
    </div>
  )
}

function CanvasValue({ value }: { value: unknown }) {
  if (typeof value === 'string') return <p className="text-sm">{value}</p>
  if (typeof value === 'number') return <p className="text-sm font-medium">{value}</p>
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((item, i) => (
          <li key={i} className="text-sm">
            {typeof item === 'object' ? (
              <div className="border rounded p-2 mt-1 space-y-1">
                {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-xs font-medium text-muted-foreground">{k}: </span>
                    <span className="text-xs">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="flex gap-2"><span className="text-muted-foreground">•</span>{String(item)}</span>
            )}
          </li>
        ))}
      </ul>
    )
  }
  if (typeof value === 'object' && value !== null) {
    return (
      <div className="space-y-1">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <span className="text-xs font-medium text-muted-foreground">{k.replace(/_/g, ' ')}: </span>
            <CanvasValue value={v} />
          </div>
        ))}
      </div>
    )
  }
  return <p className="text-sm">{String(value)}</p>
}

function getWelcomeMessage(phase: number): string {
  const messages: Record<number, string> = {
    1: "Welcome! I'm your HCD facilitator. Let's start by understanding the challenge you're trying to solve.\n\nCan you describe the problem or opportunity you're working on? Don't worry about having it perfectly framed yet — that's what we're here to do together.",
    2: "Great work on framing your challenge! Now let's go deeper into the people at the heart of this work.\n\nTell me about the people most affected by this challenge. What do you know about their daily lives and experiences?",
    3: "Now it's time to generate ideas — lots of them! There are no bad ideas in this phase.\n\nLet's start with some \"How Might We\" questions based on what you've learned. Which of the design opportunities from your research feels most important to address?",
    4: "Let's turn your best ideas into a concrete concept that stakeholders can react to.\n\nWhich of your top concepts from the ideation phase feels most promising? Let's develop it into a full solution model.",
    5: "Your concept is ready for stakeholder feedback! Let's prepare how to share it.\n\nWho are the key groups of people whose input would most strengthen this model?",
    6: "Time to make sense of what you've heard. Let me analyze the feedback and synthesize a stronger model.",
    7: "Let's turn your refined model into a concrete execution plan with clear metrics.\n\nWhat's your timeline for implementation? And who are the key people or roles who would own different parts of this work?",
    8: "Welcome to the evaluation phase. This is where we learn, adapt, and improve.\n\nWhat data have you collected so far, and how is the implementation going?",
  }
  return messages[phase] ?? messages[1]
}
