import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const HCD_PHASES = [
  { number: 1, name: 'Frame the Challenge', slug: 'frame' },
  { number: 2, name: 'Empathy & Research', slug: 'empathy' },
  { number: 3, name: 'Ideation', slug: 'ideation' },
  { number: 4, name: 'Concept Development', slug: 'concept' },
  { number: 5, name: 'Feedback Collection', slug: 'feedback-prep' },
  { number: 6, name: 'Synthesis', slug: 'synthesis' },
  { number: 7, name: 'Execution Plan', slug: 'execution' },
  { number: 8, name: 'Evaluation & Adaptation', slug: 'evaluation' },
] as const

export type PhaseNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
