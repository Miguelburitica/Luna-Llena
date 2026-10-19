import { ROLE_CATALOG, SERVER_AWARD_IDS, type Award, type TimelineEntry } from '@luna/contracts'
import type { Seat } from './Seat'

type VoteEntry = Extract<TimelineEntry, { kind: 'vote' }>

interface Contender {
  readonly memberId: string
  readonly count: number
}

const teamOf = (seat: Seat) => ROLE_CATALOG[seat.role].team

const votesIn = (timeline: readonly TimelineEntry[]): VoteEntry[] =>
  timeline.filter((entry): entry is VoteEntry => entry.kind === 'vote')

const castVotes = (votes: readonly VoteEntry[]): Array<{ voterId: string; targetId: string }> =>
  votes.flatMap((entry) =>
    entry.verdict.tally.flatMap((tally) => (tally.voterIds ?? []).map((voterId) => ({ voterId, targetId: tally.targetId })))
  )

const leaderOf = (seats: readonly Seat[], countOf: (seat: Seat) => number): Contender | undefined => {
  let leader: Contender | undefined
  for (const seat of seats) {
    const count = countOf(seat)
    if (count >= 1 && (leader === undefined || count > leader.count)) leader = { memberId: seat.memberId, count }
  }
  return leader
}

const countWhere = <T>(items: readonly T[], matches: (item: T) => boolean): number => items.filter(matches).length

export const awardsOf = (timeline: readonly TimelineEntry[], seats: readonly Seat[]): Award[] => {
  const votes = votesIn(timeline)
  const casts = castVotes(votes)
  const seatOf = (memberId: string) => seats.find((seat) => seat.memberId === memberId)
  const received = (seat: Seat) => countWhere(casts, (cast) => cast.targetId === seat.memberId)
  const executedWolf = votes
    .filter((entry) => entry.verdict.executedId !== null)
    .find((entry) => {
      const executed = seatOf(entry.verdict.executedId as string)
      return executed !== undefined && teamOf(executed) === 'wolves'
    })
  const betrayals = (voter: Seat) =>
    teamOf(voter) === 'village'
      ? countWhere(casts, (cast) => {
          const target = seatOf(cast.targetId)
          return cast.voterId === voter.memberId && target !== undefined && teamOf(target) === 'village'
        })
      : 0
  const mostSuspicious = leaderOf(seats, received)
  const betrayer = leaderOf(seats, betrayals)
  const silent = seats.find((seat) => teamOf(seat) === 'wolves' && received(seat) === 0)
  const found: Record<(typeof SERVER_AWARD_IDS)[number], Award | undefined> = {
    'most-suspicious':
      mostSuspicious && { award: 'most-suspicious', memberId: mostSuspicious.memberId, count: mostSuspicious.count },
    'worst-liar':
      executedWolf && {
        award: 'worst-liar',
        memberId: executedWolf.verdict.executedId as string,
        count: executedWolf.round
      },
    'betrayed-own-team': betrayer && { award: 'betrayed-own-team', memberId: betrayer.memberId, count: betrayer.count },
    'silent-assassin': silent && { award: 'silent-assassin', memberId: silent.memberId, count: null }
  }
  return SERVER_AWARD_IDS.flatMap((award) => found[award] ?? [])
}
