import { ROLE_CATALOG, type DawnPreview } from '@luna/contracts'
import type { HuntPick, Night } from './Night'
import type { Seat } from './Seat'

export interface SpentPotions {
  readonly heal: boolean
  readonly poison: boolean
}

export const NO_SPENT_POTIONS: SpentPotions = { heal: false, poison: false }

export interface DawnResolution extends DawnPreview {
  readonly healedBy: readonly string[]
  readonly poisonedBy: readonly string[]
  readonly nextBlocked: ReadonlyMap<string, string>
}

export const packVictimOf = (huntPicks: readonly HuntPick[]): string | null => {
  const votes = new Map<string, number>()
  for (const pick of huntPicks) votes.set(pick.targetId, (votes.get(pick.targetId) ?? 0) + 1)
  const most = Math.max(0, ...votes.values())
  const latestTied = [...huntPicks].reverse().find((pick) => votes.get(pick.targetId) === most)
  return latestTied?.targetId ?? null
}

const livingIdsOf = (seats: readonly Seat[]): ReadonlySet<string> =>
  new Set(seats.filter((seat) => seat.alive).map((seat) => seat.memberId))

export const livingPackVictimOf = (night: Night, seats: readonly Seat[]): string | null => {
  const living = livingIdsOf(seats)
  const wolves = new Set(
    seats.filter((seat) => ROLE_CATALOG[seat.role].team === 'wolves').map((seat) => seat.memberId)
  )
  return packVictimOf(night.huntPicks.filter((pick) => wolves.has(pick.wolfId) && living.has(pick.wolfId) && living.has(pick.targetId)))
}

export const resolveDawn = (
  night: Night,
  seats: readonly Seat[],
  spent: ReadonlyMap<string, SpentPotions>
): DawnResolution => {
  const living = livingIdsOf(seats)
  const victimId = livingPackVictimOf(night, seats)
  const witches = [...night.potions].filter(([witchId]) => living.has(witchId))
  const healedBy = witches
    .filter(([witchId, choice]) => choice.heal && victimId !== null && !(spent.get(witchId) ?? NO_SPENT_POTIONS).heal)
    .map(([witchId]) => witchId)
  const poisons = witches.flatMap(([witchId, choice]) =>
    choice.poisonTargetId !== null && !(spent.get(witchId) ?? NO_SPENT_POTIONS).poison
      ? [{ witchId, targetId: choice.poisonTargetId }]
      : []
  )
  const protections = [...night.protections].filter(([doctorId]) => living.has(doctorId))
  const protectedIds = protections.map(([, targetId]) => targetId)
  const saved = victimId !== null && (healedBy.length > 0 || protectedIds.includes(victimId))
  const killed = [...(victimId === null || saved ? [] : [victimId]), ...poisons.map((poison) => poison.targetId)]
  return {
    victimId,
    protectedId: protectedIds[0] ?? null,
    healing: healedBy.length > 0,
    poisonTargetId: poisons[0]?.targetId ?? null,
    deaths: [...new Set(killed)].filter((memberId) => living.has(memberId)),
    healedBy,
    poisonedBy: poisons.map((poison) => poison.witchId),
    nextBlocked: new Map(protections)
  }
}
