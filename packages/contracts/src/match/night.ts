import type { NightAction } from '../roles/catalog'

export type NightActionInput =
  | { readonly kind: 'hunt'; readonly targetId: string }
  | { readonly kind: 'inspect'; readonly targetId: string }
  | { readonly kind: 'protect'; readonly targetId: string }
  | { readonly kind: 'suspect'; readonly targetId: string }
  | { readonly kind: 'potions'; readonly heal: boolean; readonly poisonTargetId: string | null }

export interface Vision {
  readonly round: number
  readonly targetId: string
  readonly isWolf: boolean
}

export type PlayerNightView =
  | {
      readonly action: 'hunt'
      readonly targetId: string | null
      readonly packPicks: Readonly<Record<string, string>>
      readonly packVictimId: string | null
    }
  | { readonly action: 'inspect'; readonly targetId: string | null; readonly vision: Vision | null }
  | { readonly action: 'protect'; readonly targetId: string | null; readonly blockedTargetId: string | null }
  | {
      readonly action: 'potions'
      readonly acted: boolean
      readonly victimId: string | null
      readonly heal: boolean
      readonly poisonTargetId: string | null
      readonly healAvailable: boolean
      readonly poisonAvailable: boolean
    }
  | { readonly action: 'suspect'; readonly targetId: string | null }

export interface NarratorActionView {
  readonly action: NightAction
  readonly acted: boolean
  readonly targetId: string | null
  readonly visionIsWolf: boolean | null
  readonly fromDrunk: boolean
  readonly heal: boolean
  readonly poisonTargetId: string | null
}

export interface DawnPreview {
  readonly victimId: string | null
  readonly protectedId: string | null
  readonly healing: boolean
  readonly poisonTargetId: string | null
  readonly deaths: readonly string[]
}

export interface NarratorNightView {
  readonly actions: Readonly<Record<string, NarratorActionView>>
  readonly waitingOn: readonly string[]
  readonly preview: DawnPreview
}

export interface DawnReport {
  readonly round: number
  readonly deaths: readonly string[]
}
