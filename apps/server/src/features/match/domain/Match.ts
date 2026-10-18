import {
  done,
  err,
  matchError,
  PHASE_TIMERS,
  PHASES,
  TIMER_EXTENSION_SECONDS,
  type MatchError,
  type MatchOutcome,
  type Phase,
  type Result,
  type TeamId,
  type TimerPhase
} from '@luna/contracts'
import type { Seat } from './Seat'
import { winnerOf } from './winnerOf'

export interface MatchOpening {
  readonly code: string
  readonly narratorId: string
  readonly seats: readonly Seat[]
  readonly timers: Readonly<Record<TimerPhase, number>>
  readonly revealRoleOnDeath: boolean
  readonly now: number
}

export class Match {
  private currentPhase: Phase = PHASES[0]
  private currentRound = 1
  private currentPhaseEndsAt: number | null
  private currentPendingWinner: TeamId | null = null
  private currentOutcome: MatchOutcome | null = null

  private constructor(
    readonly code: string,
    readonly narratorId: string,
    readonly seats: readonly Seat[],
    private readonly timers: Readonly<Record<TimerPhase, number>>,
    readonly revealRoleOnDeath: boolean,
    now: number
  ) {
    this.currentPhaseEndsAt = this.deadlineFor(this.currentPhase, now)
  }

  static begin({ code, narratorId, seats, timers, revealRoleOnDeath, now }: MatchOpening): Match {
    return new Match(code, narratorId, seats, timers, revealRoleOnDeath, now)
  }

  get phase(): Phase {
    return this.currentPhase
  }

  get round(): number {
    return this.currentRound
  }

  get phaseEndsAt(): number | null {
    return this.currentPhaseEndsAt
  }

  get pendingWinner(): TeamId | null {
    return this.currentPendingWinner
  }

  get outcome(): MatchOutcome | null {
    return this.currentOutcome
  }

  hasMember(memberId: string): boolean {
    return memberId === this.narratorId || this.seats.some((seat) => seat.memberId === memberId)
  }

  advance(actorId: string, now: number): Result<void, MatchError> {
    const authority = this.requireRunningNarrator(actorId)
    if (!authority.ok) return authority
    const index = PHASES.indexOf(this.currentPhase)
    if (index === PHASES.length - 1) this.currentRound += 1
    this.currentPhase = PHASES[(index + 1) % PHASES.length] ?? PHASES[0]
    this.currentPhaseEndsAt = this.deadlineFor(this.currentPhase, now)
    return done
  }

  extendTimer(actorId: string): Result<void, MatchError> {
    const authority = this.requireRunningNarrator(actorId)
    if (!authority.ok) return authority
    if (this.currentPhaseEndsAt === null) return err(matchError('timer-not-running'))
    this.currentPhaseEndsAt += TIMER_EXTENSION_SECONDS * 1000
    return done
  }

  setAlive(actorId: string, memberId: unknown, alive: unknown): Result<void, MatchError> {
    const authority = this.requireRunningNarrator(actorId)
    if (!authority.ok) return authority
    const seat = this.seats.find((candidate) => candidate.memberId === memberId)
    if (seat === undefined) return err(matchError('member-not-found'))
    seat.alive = alive === true
    this.currentPendingWinner = winnerOf(this.seats)
    return done
  }

  keepPlaying(actorId: string): Result<void, MatchError> {
    const authority = this.requireRunningNarrator(actorId)
    if (!authority.ok) return authority
    this.currentPendingWinner = null
    return done
  }

  endGame(actorId: string): Result<void, MatchError> {
    const authority = this.requireRunningNarrator(actorId)
    if (!authority.ok) return authority
    if (this.currentPendingWinner === null) return err(matchError('no-winner-yet'))
    this.currentOutcome = { winner: this.currentPendingWinner }
    return done
  }

  private deadlineFor(phase: Phase, now: number): number | null {
    const timerPhase = PHASE_TIMERS[phase]
    const seconds = timerPhase === undefined ? 0 : this.timers[timerPhase]
    return seconds > 0 ? now + seconds * 1000 : null
  }

  private requireRunningNarrator(actorId: string): Result<void, MatchError> {
    if (actorId !== this.narratorId) return err(matchError('not-narrator'))
    return this.currentOutcome === null ? done : err(matchError('match-over'))
  }
}
