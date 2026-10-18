export const SOUND_CUES = ['howl', 'thunder', 'bell', 'suspense', 'scream', 'rooster', 'drumroll', 'trombone'] as const
export type SoundCue = (typeof SOUND_CUES)[number]

export const SCREEN_EFFECTS = ['lightning', 'fog', 'shake'] as const
export type ScreenEffect = (typeof SCREEN_EFFECTS)[number]

export type CueInput =
  | { readonly kind: 'sound'; readonly sound: SoundCue }
  | { readonly kind: 'effect'; readonly effect: ScreenEffect }

export type CueEffect = { readonly id: string; readonly sentAt: number } & CueInput
