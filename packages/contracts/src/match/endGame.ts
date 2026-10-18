import type { HauntKind } from './ghosts'
import type { Verdict } from './voting'

export interface TimelineVision {
  readonly seerId: string
  readonly targetId: string
  readonly isWolf: boolean
  readonly fromDrunk: boolean
}

export type TimelineEntry =
  | {
      readonly kind: 'night'
      readonly round: number
      readonly victimId: string | null
      readonly protectedId: string | null
      readonly healed: boolean
      readonly poisonedId: string | null
      readonly visions: readonly TimelineVision[]
      readonly deaths: readonly string[]
    }
  | { readonly kind: 'vote'; readonly round: number; readonly verdict: Verdict }
  | { readonly kind: 'revenge'; readonly round: number; readonly hunterId: string; readonly targetId: string | null }
  | { readonly kind: 'narrator'; readonly round: number; readonly memberId: string; readonly alive: boolean }
  | {
      readonly kind: 'haunt'
      readonly round: number
      readonly ghostId: string
      readonly haunt: HauntKind
      readonly targetId: string | null
      readonly word: string | null
    }

export const SERVER_AWARD_IDS = ['most-suspicious', 'worst-liar', 'betrayed-own-team', 'silent-assassin'] as const
export const AWARD_IDS = [...SERVER_AWARD_IDS, 'chatterbox'] as const
export type AwardId = (typeof AWARD_IDS)[number]

export interface Award {
  readonly award: AwardId
  readonly memberId: string
  readonly count: number | null
}
