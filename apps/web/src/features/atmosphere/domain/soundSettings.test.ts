import { describe, expect, it } from 'vitest'
import { clampVolume, effectiveVolume, soundSettingsDefaults } from './soundSettings'

describe('soundSettingsDefaults', () => {
  it('starts with sound off and the documented volumes', () => {
    expect(soundSettingsDefaults(false)).toEqual({
      soundOn: false,
      ambientOn: true,
      master: 80,
      music: 55,
      effects: 100,
      reducedMotion: false,
      colorMode: 'system'
    })
  })

  it('follows the system appearance until the player picks one', () => {
    expect(soundSettingsDefaults(true).colorMode).toBe('system')
  })

  it('follows the operating system motion preference', () => {
    expect(soundSettingsDefaults(true).reducedMotion).toBe(true)
  })
})

describe('effectiveVolume', () => {
  it('multiplies the master by the music volume', () => {
    expect(effectiveVolume({ ...soundSettingsDefaults(false), music: 20 }, 'music')).toBe(0.16)
  })

  it('keeps stings at the effects volume times the master', () => {
    expect(effectiveVolume({ ...soundSettingsDefaults(false), music: 20 }, 'effects')).toBe(0.8)
  })

  it('is silent when the master is zero', () => {
    expect(effectiveVolume({ ...soundSettingsDefaults(false), master: 0 }, 'effects')).toBe(0)
  })

  it('stays within zero and one', () => {
    expect(effectiveVolume({ ...soundSettingsDefaults(false), master: 400, effects: 400 }, 'effects')).toBe(1)
  })
})

describe('clampVolume', () => {
  it.each([
    [-5, 0],
    [42.4, 42],
    [180, 100]
  ])('turns %s into %s', (input, expected) => {
    expect(clampVolume(input)).toBe(expected)
  })
})
