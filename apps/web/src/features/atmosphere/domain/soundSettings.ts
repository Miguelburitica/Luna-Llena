export const VOLUME_CHANNELS = ['music', 'effects'] as const
export type VolumeChannel = (typeof VOLUME_CHANNELS)[number]

export const MAX_VOLUME = 100

export interface AtmosphereSettings {
  readonly soundOn: boolean
  readonly ambientOn: boolean
  readonly master: number
  readonly music: number
  readonly effects: number
  readonly reducedMotion: boolean
}

export const soundSettingsDefaults = (prefersReducedMotion: boolean): AtmosphereSettings => ({
  soundOn: false,
  ambientOn: true,
  master: 80,
  music: 55,
  effects: 100,
  reducedMotion: prefersReducedMotion
})

export const clampVolume = (percent: number): number => Math.min(MAX_VOLUME, Math.max(0, Math.round(percent)))

export const effectiveVolume = (settings: AtmosphereSettings, channel: VolumeChannel): number =>
  Math.min(1, Math.max(0, (settings.master * settings[channel]) / (MAX_VOLUME * MAX_VOLUME)))
