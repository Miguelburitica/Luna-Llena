import { BOT_PERSONALITIES, type BotPersonality } from '@luna/contracts'

export const SURPRISE_WEIGHTS = {
  base: { paranoid: 1, follower: 1, detective: 1, chaos: 1, quiet: 0.6 } as Readonly<Record<BotPersonality, number>>,
  repeatFactor: 0.25
} as const

export const surpriseWeightsOf = (existing: readonly BotPersonality[]): ReadonlyArray<readonly [BotPersonality, number]> =>
  BOT_PERSONALITIES.map((personality) => [
    personality,
    SURPRISE_WEIGHTS.base[personality] *
      SURPRISE_WEIGHTS.repeatFactor ** existing.filter((other) => other === personality).length
  ])

export const surprisePersonalityOf = (existing: readonly BotPersonality[], roll: number): BotPersonality => {
  const weights = surpriseWeightsOf(existing)
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0)
  let remaining = roll * total
  for (const [personality, weight] of weights) {
    if (remaining < weight) return personality
    remaining -= weight
  }
  return weights.at(-1)?.[0] ?? 'detective'
}
