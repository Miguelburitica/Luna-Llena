import { readStored, writeStored } from '@/shared/infrastructure/storage/deviceStorage'
import type { AtmosphereSettingsStore } from '../application/ports'
import { MAX_VOLUME, type AtmosphereSettings } from '../domain/soundSettings'

export const ATMOSPHERE_SETTINGS_KEY = 'luna-llena.atmosphere'

const isVolume = (value: unknown): value is number => typeof value === 'number' && value >= 0 && value <= MAX_VOLUME

const isSettings = (value: unknown): value is AtmosphereSettings => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.soundOn === 'boolean' &&
    typeof candidate.ambientOn === 'boolean' &&
    typeof candidate.reducedMotion === 'boolean' &&
    isVolume(candidate.master) &&
    isVolume(candidate.music) &&
    isVolume(candidate.effects)
  )
}

export class LocalAtmosphereSettingsStore implements AtmosphereSettingsStore {
  load(): AtmosphereSettings | null {
    return readStored(ATMOSPHERE_SETTINGS_KEY, isSettings)
  }

  save(settings: AtmosphereSettings): void {
    writeStored(ATMOSPHERE_SETTINGS_KEY, settings)
  }
}
