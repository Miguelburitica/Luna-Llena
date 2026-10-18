import type { MatchView, RoleId, TimerPhase } from '@luna/contracts'
import type { Match } from '../domain/Match'

export interface MatchRepository {
  find(code: string): Promise<Match | undefined>
  save(match: Match): Promise<void>
}

export interface MemberMatchView {
  readonly memberId: string
  readonly view: MatchView
}

export interface MatchPublisher {
  publish(code: string, views: readonly MemberMatchView[]): void
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
}
