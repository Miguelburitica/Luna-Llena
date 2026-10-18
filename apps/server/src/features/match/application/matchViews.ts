import {
  ROLE_CATALOG,
  type ChatAccess,
  type GhostPowerView,
  type MatchPlayerView,
  type MatchView,
  type NarratorActionView,
  type NarratorMatchView,
  type NarratorNightView,
  type PlayerMatchView,
  type PlayerNightView,
  type Vision
} from '@luna/contracts'
import { chatPermissionsOf } from '../domain/chatPermissionsOf'
import type { Match } from '../domain/Match'
import type { Seat } from '../domain/Seat'
import type { MemberMatchView } from './ports'

const isRevealed = (match: Match, seat: Seat): boolean =>
  (!seat.alive && match.revealRoleOnDeath) || match.outcome !== null || match.soloWinnerIds.includes(seat.memberId)

const toPlayerView = (match: Match, seat: Seat): MatchPlayerView => ({
  id: seat.memberId,
  alive: seat.alive,
  revealedRole: isRevealed(match, seat) ? seat.role : null
})

const chatAccessFor = (match: Match, memberId: string, now: number): ChatAccess => {
  const { read, write, lastWordsUntil, villagePaused } = chatPermissionsOf(match, memberId, now)
  return { read, write, lastWordsUntil, villagePaused }
}

const commonOf = (match: Match, memberId: string, now: number) => ({
  code: match.code,
  phase: match.phase,
  round: match.round,
  phaseEndsAt: match.phaseEndsAt,
  serverNow: now,
  players: match.seats.map((seat) => toPlayerView(match, seat)),
  outcome: match.outcome,
  dawn: match.dawn,
  voting: match.votingProgress(),
  verdict: match.verdict,
  revenge: match.revenge,
  soloWinnerIds: match.soloWinnerIds,
  chat: chatAccessFor(match, memberId, now)
})

const toNarratorAction = (match: Match, seat: Seat): NarratorActionView => {
  const action = ROLE_CATALOG[seat.role].nightAction
  const { night } = match
  const inspection = night.inspections.get(seat.memberId)
  const potions = night.potions.get(seat.memberId)
  return {
    action,
    acted: night.hasActed(seat.memberId, action),
    targetId: night.targetOf(seat.memberId, action),
    visionIsWolf: inspection?.isWolf ?? null,
    fromDrunk: inspection?.fromDrunk ?? false,
    heal: potions?.heal ?? false,
    poisonTargetId: potions?.poisonTargetId ?? null
  }
}

const toNarratorNight = (match: Match): NarratorNightView | null => {
  if (match.phase !== 'night') return null
  const living = match.seats.filter((seat) => seat.alive)
  const actions = Object.fromEntries(living.map((seat) => [seat.memberId, toNarratorAction(match, seat)]))
  const { deaths, victimId, protectedId, healing, poisonTargetId } = match.previewDawn()
  return {
    actions,
    waitingOn: living.filter((seat) => actions[seat.memberId]?.acted === false).map((seat) => seat.memberId),
    preview: { victimId, protectedId, healing, poisonTargetId, deaths }
  }
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

const toNarratorVotes = (match: Match): NarratorMatchView['votes'] =>
  match.phase === 'vote'
    ? Object.fromEntries(match.seats.filter((seat) => seat.alive).map((seat) => [seat.memberId, match.voteOf(seat.memberId)]))
    : null

const toNarratorView = (match: Match, now: number): NarratorMatchView => ({
  ...commonOf(match, match.narratorId, now),
  perspective: 'narrator',
  roles: Object.fromEntries(match.seats.map((seat) => [seat.memberId, seat.role])),
  pendingWinner: match.pendingWinner,
  night: toNarratorNight(match),
  votes: toNarratorVotes(match),
  haunts: match.haunts
})

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
    ...commonOf(match, seat.memberId, now),
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
