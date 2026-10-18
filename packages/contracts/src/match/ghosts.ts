export const HAUNT_KINDS = ['flicker', 'whisper'] as const
export type HauntKind = (typeof HAUNT_KINDS)[number]

export const GHOST_LIMITS = { maxWhisperLength: 20 } as const

export type HauntInput =
  | { readonly kind: 'flicker' }
  | { readonly kind: 'whisper'; readonly targetId: string; readonly word: string }

export interface HauntEffect {
  readonly id: string
  readonly kind: HauntKind
  readonly word: string | null
  readonly ghostId: string | null
  readonly targetId: string | null
  readonly sentAt: number
}

export interface GhostPowerView {
  readonly available: boolean
}
