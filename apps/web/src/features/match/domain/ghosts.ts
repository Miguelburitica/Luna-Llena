import { GHOST_LIMITS, type HauntEffect } from '@luna/contracts'
import type { Target } from './night'
import type { Seat } from './seating'

export const FLICKER_MS = 2_400
export const GHOST_TOAST_MS = 4_000

export type WhisperProblem = 'empty' | 'too-long' | 'spaces'

export interface HauntLine {
  readonly key: string
  readonly params: {
    readonly ghost: string
    readonly target: string
    readonly word: string
  }
}

export const whisperProblem = (word: string): WhisperProblem | null => {
  const trimmed = word.trim()
  if (trimmed.length === 0) return 'empty'
  if (trimmed.length > GHOST_LIMITS.maxWhisperLength) return 'too-long'
  if (/\s/.test(trimmed)) return 'spaces'
  return null
}

export const hauntLine = (effect: HauntEffect, nameOf: (memberId: string | null) => string): HauntLine => ({
  key: `match.ghost.feed.${effect.kind}`,
  params: { ghost: nameOf(effect.ghostId), target: nameOf(effect.targetId), word: effect.word ?? '' }
})

export const whisperTargetsFor = (seats: readonly Seat[]): Target[] =>
  seats.filter((seat) => seat.alive && !seat.isYou).map((seat) => ({ seat, blocked: null }))
