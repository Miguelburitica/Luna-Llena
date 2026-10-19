import {
  ROLE_CATALOG,
  type ChatAccess,
  type GhostPowerView,
  type MatchView,
  type NarratorMatchView,
  type PlayerMatchView,
  type PlayerNightView,
  type Vision
} from '@luna/contracts'
import { commonViewOf, narratorViewOf, type Match, type Seat } from '@luna/rules'
import { chatPermissionsOf } from '../domain/chatPermissionsOf'
import type { MemberMatchView } from './ports'

const chatAccessFor = (match: Match, memberId: string, now: number): ChatAccess => {
  const { read, write, lastWordsUntil, villagePaused } = chatPermissionsOf(match, memberId, now)
  return { read, write, lastWordsUntil, villagePaused }
}

const toPlayerNight = (match: Match, seat: Seat): PlayerNightView | null => {
  if (match.phase !== 'night' || !seat.alive) return null
  const action = ROLE_CATALOG[seat.role].nightAction
  const { night } = match
  const targetId = night.targetOf(seat.memberId, action)
  switch (action) {
    case 'hunt':
      return {
        action,
        targetId,
        packPicks: Object.fromEntries(night.huntPicks.map((pick) => [pick.wolfId, pick.targetId])),
        packVictimId: match.packVictim()
      }
    case 'inspect': {
      const inspection = night.inspections.get(seat.memberId)
      const vision = inspection && { round: inspection.round, targetId: inspection.targetId, isWolf: inspection.isWolf }
      return { action, targetId, vision: vision ?? null }
    }
    case 'protect':
      return { action, targetId, blockedTargetId: match.blockedPatientOf(seat.memberId) }
    case 'potions': {
      const choice = night.potions.get(seat.memberId)
      const spent = match.potionsSpentBy(seat.memberId)
      return {
        action,
        acted: choice !== undefined,
        victimId: match.packVictim(),
        heal: choice?.heal ?? false,
        poisonTargetId: choice?.poisonTargetId ?? null,
        healAvailable: !spent.heal,
        poisonAvailable: !spent.poison
      }
    }
    case 'suspect':
      return { action, targetId }
  }
}

const pastVisionsOf = (match: Match, seat: Seat): readonly Vision[] =>
  match
    .visionsOf(seat.memberId)
    .filter((vision) => match.phase !== 'night' || vision.round !== match.round)

const toNarratorView = (match: Match, now: number): NarratorMatchView =>
  narratorViewOf(match, now, chatAccessFor(match, match.narratorId, now))

const packOf = (match: Match, seat: Seat): string[] =>
  seat.role === 'werewolf'
    ? match.seats
        .filter((other) => other.role === 'werewolf' && other.memberId !== seat.memberId)
        .map((other) => other.memberId)
    : []

const toGhostPower = (match: Match, seat: Seat): GhostPowerView | null => {
  const available = match.hauntAvailableTo(seat.memberId)
  return available === null ? null : { available }
}

const toSeatView = (match: Match, seat: Seat, now: number): PlayerMatchView => {
  const perceivedRole = ROLE_CATALOG[seat.role].appearsAs
  return {
    ...commonViewOf(match, now, chatAccessFor(match, seat.memberId, now)),
    perspective: 'player',
    you: {
      role: perceivedRole,
      team: ROLE_CATALOG[perceivedRole].team,
      packIds: packOf(match, seat),
      night: toPlayerNight(match, seat),
      visions: pastVisionsOf(match, seat),
      vote: match.phase === 'vote' && seat.alive ? match.voteOf(seat.memberId) : null,
      haunt: toGhostPower(match, seat)
    }
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
