import type { CueEffect, HauntEffect, MatchView, RoleId, TimerPhase } from '@luna/contracts'
import type { Match } from '@luna/rules'

export interface MatchRepository {
  find(code: string): Promise<Match | undefined>
  save(match: Match): Promise<void>
  remove(code: string): Promise<void>
}

export interface MemberMatchView {
  readonly memberId: string
  readonly view: MatchView
}

export interface HauntDelivery {
  readonly memberId: string
  readonly effect: HauntEffect
}

export interface MatchPublisher {
  publish(code: string, views: readonly MemberMatchView[]): void
  haunt(code: string, deliveries: readonly HauntDelivery[]): void
  cue(code: string, memberIds: readonly string[], effect: CueEffect): void
}

export interface Actor {
  readonly code: string
  readonly memberId: string
}

export interface MatchOpening {
  readonly code: string
  readonly narratorId: string
  readonly playerIds: readonly string[]
  readonly deck: Readonly<Record<RoleId, number>>
  readonly timers: Readonly<Record<TimerPhase, number>>
  readonly revealRoleOnDeath: boolean
  readonly anonymousVotes: boolean
  readonly lastWords: boolean
  readonly ghostPowers: boolean
}
