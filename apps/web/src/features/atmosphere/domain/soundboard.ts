import type { ScreenEffect, SoundCue } from '@luna/contracts'

export const SOUND_ICONS: Readonly<Record<SoundCue, string>> = {
  howl: 'howl',
  thunder: 'zap',
  bell: 'church',
  suspense: 'suspense',
  scream: 'scream',
  rooster: 'rooster',
  drumroll: 'drum',
  trombone: 'trombone'
}

export const EFFECT_ICONS: Readonly<Record<ScreenEffect, string>> = {
  lightning: 'zap',
  fog: 'cloud',
  shake: 'vibrate'
}

export const EFFECT_DURATION_MS: Readonly<Record<ScreenEffect, number>> = {
  lightning: 250,
  fog: 6000,
  shake: 600
}

export const REDUCED_FADE_MS = 250

export const SOUND_PLAYING_MS = 1500
