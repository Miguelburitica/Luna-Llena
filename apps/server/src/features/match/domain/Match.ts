import {
  done,
  ROLE_CATALOG,
  err,
  matchError,
  PHASE_TIMERS,
  PHASES,
  TIMER_EXTENSION_SECONDS,
  type DawnReport,
  type MatchError,
  type MatchOutcome,
  type NightAction,
  type Phase,
  type Result,
  type TeamId,
  type TimerPhase,
  type Vision
} from '@luna/contracts'
import { Night } from './Night'
import { livingPackVictimOf, NO_SPENT_POTIONS, resolveDawn, type DawnResolution, type SpentPotions } from './resolveDawn'
import type { Seat } from './Seat'
import { winnerOf } from './winnerOf'

interface RandomNumbers {
  next(): number
}

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
  private currentNight = new Night()
  private currentDawn: DawnReport | null = null
  private readonly visionsBySeer = new Map<string, Vision[]>()
  private readonly blockedPatients = new Map<string, string>()
  private readonly spentPotions = new Map<string, SpentPotions>()

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

  get night(): Night {
    return this.currentNight
  }

  get dawn(): DawnReport | null {
    return this.currentDawn
  }

  visionsOf(memberId: string): readonly Vision[] {
    return this.visionsBySeer.get(memberId) ?? []
  }

  blockedPatientOf(doctorId: string): string | null {
    return this.blockedPatients.get(doctorId) ?? null
  }

  potionsSpentBy(witchId: string): SpentPotions {
    return this.spentPotions.get(witchId) ?? NO_SPENT_POTIONS
  }

  packVictim(): string | null {
    return livingPackVictimOf(this.currentNight, this.seats)
  }

  previewDawn(): DawnResolution {
    return resolveDawn(this.currentNight, this.seats, this.spentPotions)
  }

  hasMember(memberId: string): boolean {
    return memberId === this.narratorId || this.seats.some((seat) => seat.memberId === memberId)
  }

  advance(actorId: string, now: number): Result<void, MatchError> {
    const authority = this.requireRunningNarrator(actorId)
    if (!authority.ok) return authority
    const index = PHASES.indexOf(this.currentPhase)
    if (this.currentPhase === 'night') this.resolveNight()
    if (index === PHASES.length - 1) this.currentRound += 1
    this.currentPhase = PHASES[(index + 1) % PHASES.length] ?? PHASES[0]
    if (this.currentPhase === 'night') this.beginNight()
    this.currentPhaseEndsAt = this.deadlineFor(this.currentPhase, now)
    return done
  }

  act(actorId: string, input: unknown, random: RandomNumbers): Result<void, MatchError> {
    if (this.currentOutcome !== null) return err(matchError('match-over'))
    if (this.currentPhase !== 'night') return err(matchError('not-night'))
    const seat = this.seats.find((candidate) => candidate.memberId === actorId)
    if (seat === undefined) return err(matchError('not-your-action'))
    if (!seat.alive) return err(matchError('player-dead'))
    const action = ROLE_CATALOG[seat.role].nightAction
    const choice = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>
    if (choice.kind !== action) return err(matchError('not-your-action'))
    if (action === 'potions') return this.brew(seat, choice.heal, choice.poisonTargetId)
    const target = this.targetFor(seat, action, choice.targetId)
    if (target === undefined) return err(matchError('target-invalid'))
    switch (action) {
      case 'hunt':
        this.currentNight.pickPrey(actorId, target.memberId)
        return done
      case 'inspect':
        return this.inspect(seat, target, random)
      case 'protect':
        if (this.blockedPatients.get(actorId) === target.memberId) return err(matchError('protected-last-night'))
        this.currentNight.protections.set(actorId, target.memberId)
        return done
      case 'suspect':
        this.currentNight.suspicions.set(actorId, target.memberId)
        return done
    }
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

  private targetFor(actor: Seat, action: NightAction, targetId: unknown): Seat | undefined {
    const target = this.seats.find((candidate) => candidate.memberId === targetId)
    if (target === undefined || !target.alive) return undefined
    if (target === actor && action !== 'protect') return undefined
    if (action === 'hunt' && ROLE_CATALOG[target.role].team === 'wolves') return undefined
    return target
  }

  private inspect(seer: Seat, target: Seat, random: RandomNumbers): Result<void, MatchError> {
    if (this.currentNight.inspections.has(seer.memberId)) return err(matchError('already-inspected'))
    const fromDrunk = ROLE_CATALOG[seer.role].appearsAs !== seer.role
    const isWolf = fromDrunk ? random.next() < 0.5 : ROLE_CATALOG[target.role].team === 'wolves'
    const vision = { round: this.currentRound, targetId: target.memberId, isWolf }
    this.currentNight.inspections.set(seer.memberId, { ...vision, fromDrunk })
    this.visionsBySeer.set(seer.memberId, [...this.visionsOf(seer.memberId), vision])
    return done
  }

  private brew(witch: Seat, heal: unknown, poisonTargetId: unknown): Result<void, MatchError> {
    const poisonTarget = poisonTargetId === null ? null : this.targetFor(witch, 'potions', poisonTargetId)
    if (typeof heal !== 'boolean' || poisonTarget === undefined) return err(matchError('target-invalid'))
    const spent = this.potionsSpentBy(witch.memberId)
    if ((heal && spent.heal) || (poisonTarget !== null && spent.poison)) return err(matchError('potion-used'))
    this.currentNight.potions.set(witch.memberId, { heal, poisonTargetId: poisonTarget?.memberId ?? null })
    return done
  }

  private resolveNight(): void {
    const resolution = this.previewDawn()
    for (const seat of this.seats) if (resolution.deaths.includes(seat.memberId)) seat.alive = false
    for (const witchId of resolution.healedBy) {
      this.spentPotions.set(witchId, { ...this.potionsSpentBy(witchId), heal: true })
    }
    for (const witchId of resolution.poisonedBy) {
      this.spentPotions.set(witchId, { ...this.potionsSpentBy(witchId), poison: true })
    }
    this.blockedPatients.clear()
    for (const [doctorId, targetId] of resolution.nextBlocked) this.blockedPatients.set(doctorId, targetId)
    this.currentDawn = { round: this.currentRound, deaths: resolution.deaths }
    if (resolution.deaths.length > 0) this.currentPendingWinner = winnerOf(this.seats)
  }

  private beginNight(): void {
    this.currentDawn = null
    this.currentNight = new Night()
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
