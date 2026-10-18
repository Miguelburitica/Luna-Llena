import type { RoleId, TeamId } from '../roles/catalog'
import type { DawnReport, NarratorNightView, PlayerNightView, Vision } from './night'
import type { Phase } from './vocabulary'

export interface MatchPlayerView {
  readonly id: string
  readonly alive: boolean
  readonly revealedRole: RoleId | null
}

export interface MatchOutcome {
  readonly winner: TeamId
}

interface MatchViewCommon {
  readonly code: string
  readonly phase: Phase
  readonly round: number
  readonly phaseEndsAt: number | null
  readonly serverNow: number
  readonly players: readonly MatchPlayerView[]
  readonly outcome: MatchOutcome | null
  readonly dawn: DawnReport | null
}

export interface PlayerMatchView extends MatchViewCommon {
  readonly perspective: 'player'
  readonly you: {
    readonly role: RoleId
    readonly team: TeamId
    readonly packIds: readonly string[]
    readonly night: PlayerNightView | null
    readonly visions: readonly Vision[]
  }
}

export interface NarratorMatchView extends MatchViewCommon {
  readonly perspective: 'narrator'
  readonly roles: Readonly<Record<string, RoleId>>
  readonly pendingWinner: TeamId | null
  readonly night: NarratorNightView | null
}

export type MatchView = PlayerMatchView | NarratorMatchView
