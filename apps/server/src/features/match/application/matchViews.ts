import {
  ROLE_CATALOG,
  type MatchPlayerView,
  type MatchView,
  type NarratorMatchView,
  type PlayerMatchView
} from '@luna/contracts'
import type { Match } from '../domain/Match'
import type { Seat } from '../domain/Seat'
import type { MemberMatchView } from './ports'

const toPlayerView = (match: Match, seat: Seat): MatchPlayerView => ({
  id: seat.memberId,
  alive: seat.alive,
  revealedRole: (!seat.alive && match.revealRoleOnDeath) || match.outcome !== null ? seat.role : null
})

const commonOf = (match: Match, now: number) => ({
  code: match.code,
  phase: match.phase,
  round: match.round,
  phaseEndsAt: match.phaseEndsAt,
  serverNow: now,
  players: match.seats.map((seat) => toPlayerView(match, seat)),
  outcome: match.outcome
})

const toNarratorView = (match: Match, now: number): NarratorMatchView => ({
  ...commonOf(match, now),
  perspective: 'narrator',
  roles: Object.fromEntries(match.seats.map((seat) => [seat.memberId, seat.role])),
  pendingWinner: match.pendingWinner
})

const packOf = (match: Match, seat: Seat): string[] =>
  seat.role === 'werewolf'
    ? match.seats
        .filter((other) => other.role === 'werewolf' && other.memberId !== seat.memberId)
        .map((other) => other.memberId)
    : []

const toSeatView = (match: Match, seat: Seat, now: number): PlayerMatchView => {
  const perceivedRole = ROLE_CATALOG[seat.role].appearsAs
  return {
    ...commonOf(match, now),
    perspective: 'player',
    you: { role: perceivedRole, team: ROLE_CATALOG[perceivedRole].team, packIds: packOf(match, seat) }
  }
}

export const toMatchViewFor = (match: Match, memberId: string, now: number): MatchView | undefined => {
  if (memberId === match.narratorId) return toNarratorView(match, now)
  const seat = match.seats.find((candidate) => candidate.memberId === memberId)
  return seat === undefined ? undefined : toSeatView(match, seat, now)
}

export const toMatchViews = (match: Match, now: number): MemberMatchView[] => [
  { memberId: match.narratorId, view: toNarratorView(match, now) },
  ...match.seats.map((seat) => ({ memberId: seat.memberId, view: toSeatView(match, seat, now) }))
]
