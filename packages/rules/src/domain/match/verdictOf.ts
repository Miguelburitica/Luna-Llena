import type { Verdict, VoteTally } from '@luna/contracts'
import type { Ballot } from './Ballot'
import type { Seat } from './Seat'

export const verdictOf = (ballot: Ballot, seats: readonly Seat[], anonymous: boolean, round: number): Verdict => {
  const living = new Set(seats.filter((seat) => seat.alive).map((seat) => seat.memberId))
  const voterIdsByTarget = new Map<string, string[]>()
  for (const seat of seats) {
    const { targetId } = ballot.voteOf(seat.memberId)
    if (!seat.alive || targetId === null || !living.has(targetId)) continue
    voterIdsByTarget.set(targetId, [...(voterIdsByTarget.get(targetId) ?? []), seat.memberId])
  }
  const tally: VoteTally[] = seats
    .filter((seat) => voterIdsByTarget.has(seat.memberId))
    .map((seat) => {
      const voterIds = voterIdsByTarget.get(seat.memberId) ?? []
      return { targetId: seat.memberId, votes: voterIds.length, voterIds: anonymous ? null : voterIds }
    })
    .sort((left, right) => right.votes - left.votes)
  const [first, second] = tally
  const tie = first !== undefined && second !== undefined && first.votes === second.votes
  return {
    round,
    tally,
    executedId: first === undefined || tie ? null : first.targetId,
    tie,
    foolWins: false
  }
}
