import { readStored, writeStored } from '@/shared/infrastructure/storage/deviceStorage'
import type { AtmosphereSettingsStore } from '../application/ports'
import { DEFAULT_COLOR_MODE, isColorMode } from '../domain/colorMode'
import { MAX_VOLUME, type AtmosphereSettings } from '../domain/soundSettings'

export const ATMOSPHERE_SETTINGS_KEY = 'luna-llena.atmosphere'

const isVolume = (value: unknown): value is number => typeof value === 'number' && value >= 0 && value <= MAX_VOLUME

type StoredSettings = Omit<AtmosphereSettings, 'colorMode'> & { readonly colorMode?: unknown }

const isStoredSettings = (value: unknown): value is StoredSettings => {
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
    const stored = readStored(ATMOSPHERE_SETTINGS_KEY, isStoredSettings)
    if (stored === null) return null
    return { ...stored, colorMode: isColorMode(stored.colorMode) ? stored.colorMode : DEFAULT_COLOR_MODE }
  }

  save(settings: AtmosphereSettings): void {
    writeStored(ATMOSPHERE_SETTINGS_KEY, settings)
  }
}
