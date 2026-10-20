import type { BotPersonality } from '@luna/contracts'

export interface PersonalityTempo {
  readonly opening: number
  readonly dawn: number
  readonly explainVote: number
  readonly delay: readonly [number, number]
}

export const PERSONALITY_TEMPO: Readonly<Record<BotPersonality, PersonalityTempo>> = {
  paranoid: { opening: 0.9, dawn: 0.6, explainVote: 0.6, delay: [2, 6] },
  chaos: { opening: 0.8, dawn: 0.5, explainVote: 0.5, delay: [4, 12] },
  detective: { opening: 0.8, dawn: 0.15, explainVote: 0.5, delay: [12, 25] },
  follower: { opening: 0.3, dawn: 0.5, explainVote: 0.2, delay: [8, 20] },
  quiet: { opening: 0.25, dawn: 0.05, explainVote: 0.1, delay: [20, 40] }
}

export const FLOOR_GAP_SECONDS = [4, 8] as const

export const DAWN_REACTION_CAP = 2

export const tempoDelayOf = (personality: BotPersonality, random: { next(): number }): number => {
  const [minimum, maximum] = PERSONALITY_TEMPO[personality].delay
  return Math.round((minimum + (maximum - minimum) * random.next()) * 1000)
}
