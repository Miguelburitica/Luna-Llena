export interface VoteTally {
  readonly targetId: string
  readonly votes: number
  readonly voterIds: readonly string[] | null
}

export interface Verdict {
  readonly round: number
  readonly tally: readonly VoteTally[]
  readonly executedId: string | null
  readonly tie: boolean
  readonly foolWins: boolean
}

export interface VotingProgress {
  readonly voted: number
  readonly locked: number
  readonly voters: number
}

export interface CastVote {
  readonly targetId: string | null
  readonly locked: boolean
}

export interface RevengeView {
  readonly hunterId: string
  readonly targetId: string | null
  readonly pending: boolean
}
