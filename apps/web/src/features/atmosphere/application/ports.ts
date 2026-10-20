import type { CueEffect, CueInput, Result, SoundCue } from '@luna/contracts'
import type { InjectionKey } from 'vue'
import type { MatchFailure } from '@/features/match/application/ports'
import type { AmbientId } from '../domain/ambience'
import type { MenuLook } from '../domain/colorMode'
import type { AtmosphereSettings } from '../domain/soundSettings'

export interface SoundEngine {
  unlock(): void
  setAmbient(id: AmbientId, volume: number): void
  play(sound: SoundCue, volume: number): void
  playAlert(volume: number): void
  stopAll(): void
}

export interface AtmosphereSettingsStore {
  load(): AtmosphereSettings | null
  save(settings: AtmosphereSettings): void
}

export interface CueGateway {
  cue(input: CueInput): Promise<Result<void, MatchFailure>>
  onCue(listener: (effect: CueEffect) => void): void
}

export interface MotionPreference {
  prefersReducedMotion(): boolean
  apply(reduced: boolean): void
}

export interface ColorModePreference {
  prefersLight(): boolean
  onChange(listener: (prefersLight: boolean) => void): void
  apply(look: MenuLook): void
}

export const SOUND_ENGINE: InjectionKey<SoundEngine> = Symbol('SoundEngine')
export const ATMOSPHERE_SETTINGS_STORE: InjectionKey<AtmosphereSettingsStore> = Symbol('AtmosphereSettingsStore')
export const CUE_GATEWAY: InjectionKey<CueGateway> = Symbol('CueGateway')
export const MOTION_PREFERENCE: InjectionKey<MotionPreference> = Symbol('MotionPreference')
export const COLOR_MODE_PREFERENCE: InjectionKey<ColorModePreference> = Symbol('ColorModePreference')
