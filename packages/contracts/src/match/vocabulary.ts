import type { TimerPhase } from '../room/vocabulary'

export const PHASES = ['night', 'dawn', 'day', 'vote', 'execution'] as const
export type Phase = (typeof PHASES)[number]

export const PHASE_TIMERS: Readonly<Partial<Record<Phase, TimerPhase>>> = { night: 'night', day: 'day', vote: 'vote' }

export const TIMER_EXTENSION_SECONDS = 30

export const MATCH_ERROR_CODES = [
  'match-not-found',
  'session-invalid',
  'not-narrator',
  'member-not-found',
  'timer-not-running',
  'no-winner-yet',
  'match-over'
] as const
export type MatchErrorCode = (typeof MATCH_ERROR_CODES)[number]

export interface MatchError {
  readonly code: MatchErrorCode
}

export const matchError = (code: MatchErrorCode): MatchError => ({ code })
