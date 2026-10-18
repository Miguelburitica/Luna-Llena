import { ROLE_IDS, SPECIAL_ROLE_ORDER, type RoleId } from '@luna/contracts'

export type Deck = Readonly<Record<RoleId, number>>

export type BalanceVerdict = 'no-wolves' | 'too-few-wolves' | 'too-many-wolves' | 'balanced'

const WOLVES_TOLERANCE = 1

export const recommendedWolves = (players: number): number => Math.max(1, Math.floor((players + 1) / 4))

export const balanceVerdictOf = (deck: Deck, players: number): BalanceVerdict => {
  const wolves = deck.werewolf
  const recommended = recommendedWolves(players)
  if (wolves === 0) return 'no-wolves'
  if (wolves < recommended - WOLVES_TOLERANCE) return 'too-few-wolves'
  if (wolves > recommended + WOLVES_TOLERANCE) return 'too-many-wolves'
  return 'balanced'
}

export const suggestedDeckFor = (players: number): Deck => {
  const wolves = recommendedWolves(players)
  const deck = Object.fromEntries(ROLE_IDS.map((role) => [role, 0])) as Record<RoleId, number>
  deck.werewolf = wolves
  const specials = SPECIAL_ROLE_ORDER.slice(0, Math.max(0, players - wolves))
  for (const role of specials) deck[role] = 1
  deck.villager = Math.max(0, players - wolves - specials.length)
  return deck
}
