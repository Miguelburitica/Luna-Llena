import { beforeEach, describe, expect, it } from 'vitest'
import { soundSettingsDefaults } from '../domain/soundSettings'
import { ATMOSPHERE_SETTINGS_KEY, LocalAtmosphereSettingsStore } from './LocalAtmosphereSettingsStore'

beforeEach(() => localStorage.clear())

describe('LocalAtmosphereSettingsStore', () => {
  it('has nothing on a first visit', () => {
    expect(new LocalAtmosphereSettingsStore().load()).toBeNull()
  })

  it('remembers settings on the device', () => {
    const settings = { ...soundSettingsDefaults(false), music: 20 }
    new LocalAtmosphereSettingsStore().save(settings)
    expect(new LocalAtmosphereSettingsStore().load()).toEqual(settings)
  })

  it('ignores damaged or out-of-range storage', () => {
    localStorage.setItem(ATMOSPHERE_SETTINGS_KEY, JSON.stringify({ ...soundSettingsDefaults(false), master: 400 }))
    expect(new LocalAtmosphereSettingsStore().load()).toBeNull()
    localStorage.setItem(ATMOSPHERE_SETTINGS_KEY, '{nope')
    expect(new LocalAtmosphereSettingsStore().load()).toBeNull()
  })

  it('keeps older saved settings and gives them the system appearance', () => {
    const older = { soundOn: false, ambientOn: true, master: 80, music: 20, effects: 100, reducedMotion: true }
    localStorage.setItem(ATMOSPHERE_SETTINGS_KEY, JSON.stringify(older))
    expect(new LocalAtmosphereSettingsStore().load()).toEqual({ ...older, colorMode: 'system' })
  })

  it('falls back to the system appearance for an unknown one', () => {
    localStorage.setItem(ATMOSPHERE_SETTINGS_KEY, JSON.stringify({ ...soundSettingsDefaults(false), colorMode: 'sepia' }))
    expect(new LocalAtmosphereSettingsStore().load()?.colorMode).toBe('system')
  })
})
