import type { CastVote } from '@luna/contracts'

const NO_VOTE: CastVote = { targetId: null, locked: false }

export class Ballot {
  private readonly votes = new Map<string, CastVote>()

  voteOf(voterId: string): CastVote {
    return this.votes.get(voterId) ?? NO_VOTE
  }

  cast(voterId: string, targetId: string | null): void {
    if (targetId === null) this.votes.delete(voterId)
    else this.votes.set(voterId, { targetId, locked: false })
  }

  lock(voterId: string): void {
    this.votes.set(voterId, { ...this.voteOf(voterId), locked: true })
  }
}
