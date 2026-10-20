import type { ChatAccess } from '../chat/views'
import type { RoleId, TeamId } from '../roles/catalog'
import type { Award, TimelineEntry } from './endGame'
import type { DawnReport, NarratorNightView, PlayerNightView, Vision } from './night'
import type { GhostPowerView, HauntRecord } from './ghosts'
import type { Phase } from './vocabulary'
import type { CastVote, RevengeView, Verdict, VotingProgress } from './voting'

export interface MatchPlayerView {
  readonly id: string
  readonly alive: boolean
  readonly revealedRole: RoleId | null
}

export interface MatchOutcome {
  readonly winner: TeamId
  readonly timeline: readonly TimelineEntry[]
  readonly awards: readonly Award[]
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
  readonly voting: VotingProgress | null
  readonly verdict: Verdict | null
  readonly revenge: RevengeView | null
  readonly soloWinnerIds: readonly string[]
  readonly chat: ChatAccess
}

export interface PlayerMatchView extends MatchViewCommon {
  readonly perspective: 'player'
  readonly you: {
    readonly role: RoleId
    readonly team: TeamId
    readonly packIds: readonly string[]
    readonly night: PlayerNightView | null
    readonly visions: readonly Vision[]
    readonly vote: CastVote | null
    readonly haunt: GhostPowerView | null
  }
}

export interface NarratorMatchView extends MatchViewCommon {
  readonly perspective: 'narrator'
  readonly roles: Readonly<Record<string, RoleId>>
  readonly pendingWinner: TeamId | null
  readonly foolClaimIds: readonly string[]
  readonly night: NarratorNightView | null
  readonly votes: Readonly<Record<string, CastVote>> | null
  readonly haunts: readonly HauntRecord[]
}

export type MatchView = PlayerMatchView | NarratorMatchView
