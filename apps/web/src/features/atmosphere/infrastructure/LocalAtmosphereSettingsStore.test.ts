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
})
