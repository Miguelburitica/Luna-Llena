import { err, ok, type CueEffect, type CueInput, type Result, type SoundCue } from '@luna/contracts'
import type { App } from 'vue'
import type { MatchFailure } from '@/features/match/application/ports'
import type { AmbientId } from '../domain/ambience'
import type { MenuLook } from '../domain/colorMode'
import type { AtmosphereSettings } from '../domain/soundSettings'
import {
  ATMOSPHERE_SETTINGS_STORE,
  COLOR_MODE_PREFERENCE,
  CUE_GATEWAY,
  MOTION_PREFERENCE,
  SOUND_ENGINE,
  type AtmosphereSettingsStore,
  type ColorModePreference,
  type CueGateway,
  type MotionPreference,
  type SoundEngine
} from './ports'

export type EngineCall =
  | { readonly kind: 'unlock' }
  | { readonly kind: 'ambient'; readonly id: AmbientId; readonly volume: number }
  | { readonly kind: 'play'; readonly sound: SoundCue; readonly volume: number }
  | { readonly kind: 'alert'; readonly volume: number }
  | { readonly kind: 'stop' }

export class FakeSoundEngine implements SoundEngine {
  readonly calls: EngineCall[] = []

  unlock() {
    this.calls.push({ kind: 'unlock' })
  }

  setAmbient(id: AmbientId, volume: number) {
    this.calls.push({ kind: 'ambient', id, volume })
  }

  play(sound: SoundCue, volume: number) {
    this.calls.push({ kind: 'play', sound, volume })
  }

  playAlert(volume: number) {
    this.calls.push({ kind: 'alert', volume })
  }

  stopAll() {
    this.calls.push({ kind: 'stop' })
  }

  played(): SoundCue[] {
    return this.calls.flatMap((call) => (call.kind === 'play' ? [call.sound] : []))
  }

  lastAmbient(): { readonly id: AmbientId; readonly volume: number } | null {
    const ambient = this.calls.filter((call) => call.kind === 'ambient').at(-1)
    return ambient?.kind === 'ambient' ? { id: ambient.id, volume: ambient.volume } : null
  }
}

export class MemoryAtmosphereSettings implements AtmosphereSettingsStore {
  saved: AtmosphereSettings | null

  constructor(initial: AtmosphereSettings | null = null) {
    this.saved = initial
  }

  load() {
    return this.saved
  }

  save(settings: AtmosphereSettings) {
    this.saved = settings
  }
}

export class FakeCueGateway implements CueGateway {
  readonly sent: CueInput[] = []
  private readonly listeners: Array<(effect: CueEffect) => void> = []
  private answer: Result<void, MatchFailure> = ok(undefined)

  failWith(code: MatchFailure['code']): this {
    this.answer = err({ code } as MatchFailure)
    return this
  }

  cue(input: CueInput) {
    this.sent.push(input)
    return Promise.resolve(this.answer)
  }

  onCue(listener: (effect: CueEffect) => void) {
    this.listeners.push(listener)
  }

  emit(input: CueInput, id = `cue-${this.sent.length + 1}-${Math.random()}`) {
    for (const listener of this.listeners) listener({ ...input, id, sentAt: 1_000 })
  }
}

export class FakeMotionPreference implements MotionPreference {
  applied: boolean | null = null

  constructor(private readonly systemPrefersReduced = false) {}

  prefersReducedMotion() {
    return this.systemPrefersReduced
  }

  apply(reduced: boolean) {
    this.applied = reduced
  }
}

export class FakeColorModePreference implements ColorModePreference {
  applied: MenuLook | null = null
  private readonly listeners: Array<(prefersLight: boolean) => void> = []

  constructor(private systemPrefersLight = false) {}

  prefersLight() {
    return this.systemPrefersLight
  }

  onChange(listener: (prefersLight: boolean) => void) {
    this.listeners.push(listener)
  }

  apply(look: MenuLook) {
    this.applied = look
  }

  switchSystemTo(look: MenuLook) {
    this.systemPrefersLight = look === 'light'
    for (const listener of this.listeners) listener(this.systemPrefersLight)
  }
}

export interface AtmosphereKit {
  readonly engine: FakeSoundEngine
  readonly settings: MemoryAtmosphereSettings
  readonly cues: FakeCueGateway
  readonly motion: FakeMotionPreference
  readonly colorMode: FakeColorModePreference
}

export const createAtmosphereKit = (
  initial: AtmosphereSettings | null = null,
  systemPrefersReduced = false,
  systemPrefersLight = false
): AtmosphereKit => ({
  engine: new FakeSoundEngine(),
  settings: new MemoryAtmosphereSettings(initial),
  cues: new FakeCueGateway(),
  motion: new FakeMotionPreference(systemPrefersReduced),
  colorMode: new FakeColorModePreference(systemPrefersLight)
})

export const atmosphereProvides = (kit: AtmosphereKit): Record<symbol, unknown> => ({
  [SOUND_ENGINE as symbol]: kit.engine,
  [ATMOSPHERE_SETTINGS_STORE as symbol]: kit.settings,
  [CUE_GATEWAY as symbol]: kit.cues,
  [MOTION_PREFERENCE as symbol]: kit.motion,
  [COLOR_MODE_PREFERENCE as symbol]: kit.colorMode
})

export const provideAtmosphere = (app: App, kit: AtmosphereKit): void => {
  const provides = atmosphereProvides(kit)
  for (const key of Object.getOwnPropertySymbols(provides)) app.provide(key, provides[key])
}
