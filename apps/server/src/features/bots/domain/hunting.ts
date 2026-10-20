import type { PlayerMatchView, RoleId } from '@luna/contracts'
import type { BotMind, RandomNumbers } from './BotMind'
import { noiseOf } from './suspicion'

export type HuntReason = 'claimed-seer' | 'claimed-role' | 'accused-pack'

export const HUNT_WEIGHTS = {
  claims: { seer: 3, doctor: 2.5, witch: 2, hunter: -1 } as Readonly<Partial<Record<RoleId, number>>>,
  threat: 1,
  threatCap: 3,
  scapegoat: -0.5,
  scapegoatCap: -2,
  survivor: -2,
  baseNoise: 0.3,
  noiseScale: 4
} as const

const claimScoreOf = (mind: BotMind, targetId: string): number => {
  const role = mind.claims.get(targetId)
  return role === undefined ? 0 : (HUNT_WEIGHTS.claims[role] ?? 0)
}

const threatScoreOf = (mind: BotMind, targetId: string): number =>
  Math.min(HUNT_WEIGHTS.threatCap, (mind.threats.get(targetId) ?? 0) * HUNT_WEIGHTS.threat)

const scapegoatScoreOf = (mind: BotMind, targetId: string): number =>
  Math.max(HUNT_WEIGHTS.scapegoatCap, (mind.accusedToday.get(targetId) ?? 0) * HUNT_WEIGHTS.scapegoat)

const survivorScoreOf = (mind: BotMind, view: PlayerMatchView, targetId: string): number =>
  mind.survivors.get(targetId) === view.round - 1 ? HUNT_WEIGHTS.survivor : 0

export const preyScoreOf = (mind: BotMind, view: PlayerMatchView, targetId: string): number =>
  claimScoreOf(mind, targetId) +
  threatScoreOf(mind, targetId) +
  scapegoatScoreOf(mind, targetId) +
  survivorScoreOf(mind, view, targetId)

export const bestPreyOf = (
  mind: BotMind,
  view: PlayerMatchView,
  prey: readonly string[],
  random: RandomNumbers
): string | null => {
  const spread = HUNT_WEIGHTS.baseNoise + HUNT_WEIGHTS.noiseScale * noiseOf(mind)
  const scored = prey.map((targetId) => ({ targetId, score: preyScoreOf(mind, view, targetId) + random.next() * spread }))
  const best = Math.max(...scored.map((entry) => entry.score))
  const top = scored.filter((entry) => entry.score === best)
  return top.length === 0 ? null : (top[Math.floor(random.next() * top.length)]?.targetId ?? null)
}

export const huntReasonOf = (mind: BotMind, targetId: string): HuntReason | null => {
  const claim = claimScoreOf(mind, targetId)
  const threat = threatScoreOf(mind, targetId)
  if (claim > 0 && claim >= threat) return mind.claims.get(targetId) === 'seer' ? 'claimed-seer' : 'claimed-role'
  return threat > 0 ? 'accused-pack' : null
}
