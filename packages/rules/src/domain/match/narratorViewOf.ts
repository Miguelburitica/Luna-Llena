import {
  ROLE_CATALOG,
  type ChatAccess,
  type MatchPlayerView,
  type NarratorActionView,
  type NarratorMatchView,
  type NarratorNightView
} from '@luna/contracts'
import type { Match } from './Match'
import type { Seat } from './Seat'

const isRevealed = (match: Match, seat: Seat): boolean =>
  (!seat.alive && match.revealRoleOnDeath) || match.outcome !== null || match.soloWinnerIds.includes(seat.memberId)

const toPlayerView = (match: Match, seat: Seat): MatchPlayerView => ({
  id: seat.memberId,
  alive: seat.alive,
  revealedRole: isRevealed(match, seat) ? seat.role : null
})

export const commonViewOf = (match: Match, now: number, chat: ChatAccess) => ({
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
  chat
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

const toNarratorVotes = (match: Match): NarratorMatchView['votes'] =>
  match.phase === 'vote'
    ? Object.fromEntries(match.seats.filter((seat) => seat.alive).map((seat) => [seat.memberId, match.voteOf(seat.memberId)]))
    : null

export const narratorViewOf = (match: Match, now: number, chat: ChatAccess): NarratorMatchView => ({
  ...commonViewOf(match, now, chat),
  perspective: 'narrator',
  roles: Object.fromEntries(match.seats.map((seat) => [seat.memberId, seat.role])),
  pendingWinner: match.pendingWinner,
  night: toNarratorNight(match),
  votes: toNarratorVotes(match),
  haunts: match.haunts
})
