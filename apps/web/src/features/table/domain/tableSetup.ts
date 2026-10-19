import { DEFAULT_ROOM_SETTINGS, ROLE_IDS, ROOM_LIMITS, type RoleId, type StartCondition, type TimerPhase } from '@luna/contracts'
import { suggestedDeckFor, type Deck } from '@/features/room/domain/deckAdvice'
import { deckSizeOf } from '@/features/room/domain/lobby'

export type SeatNameError = 'name-invalid' | 'name-taken'

export type DealCondition = Extract<StartCondition, 'deck-mismatch' | 'no-wolves'>

export interface TableSetup {
  readonly names: readonly string[]
  readonly timers: Readonly<Record<TimerPhase, number>>
  readonly revealRoleOnDeath: boolean
  readonly deck: Deck
}

export const DEFAULT_TABLE_SEATS = 8

export const clampSeatCount = (count: number): number =>
  Math.min(ROOM_LIMITS.maxPlayers, Math.max(ROOM_LIMITS.minPlayersToStart, Math.round(count)))

export const defaultTableSetup = (): TableSetup => ({
  names: Array.from({ length: DEFAULT_TABLE_SEATS }, () => ''),
  timers: DEFAULT_ROOM_SETTINGS.timers,
  revealRoleOnDeath: DEFAULT_ROOM_SETTINGS.houseRules.revealRoleOnDeath,
  deck: suggestedDeckFor(DEFAULT_TABLE_SEATS)
})

export const withSeatCount = (setup: TableSetup, count: number): TableSetup => {
  const seats = clampSeatCount(count)
  return { ...setup, names: Array.from({ length: seats }, (_, index) => setup.names[index] ?? '') }
}

export const seatNameOf = (setup: TableSetup, index: number): string | null => {
  const name = setup.names[index]?.trim() ?? ''
  return name.length === 0 ? null : name
}

export const nameErrorsOf = (setup: TableSetup): (SeatNameError | null)[] => {
  const seen = new Set<string>()
  return setup.names.map((raw) => {
    const name = raw.trim()
    if (name.length === 0) return null
    if (name.length > ROOM_LIMITS.maxNameLength) return 'name-invalid'
    const key = name.toLowerCase()
    if (seen.has(key)) return 'name-taken'
    seen.add(key)
    return null
  })
}

export const unmetDealConditionsOf = (setup: TableSetup): DealCondition[] => [
  ...(deckSizeOf(setup.deck) === setup.names.length ? [] : ['deck-mismatch' as const]),
  ...(setup.deck.werewolf > 0 ? [] : ['no-wolves' as const])
]

export const canDeal = (setup: TableSetup): boolean =>
  unmetDealConditionsOf(setup).length === 0 && nameErrorsOf(setup).every((error) => error === null)

export const isTableSetup = (value: unknown): value is TableSetup => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  const deck = candidate.deck as Record<RoleId, unknown> | undefined
  return (
    Array.isArray(candidate.names) &&
    candidate.names.every((name) => typeof name === 'string') &&
    typeof candidate.revealRoleOnDeath === 'boolean' &&
    typeof candidate.timers === 'object' &&
    candidate.timers !== null &&
    typeof deck === 'object' &&
    ROLE_IDS.every((role) => typeof deck[role] === 'number')
  )
}
