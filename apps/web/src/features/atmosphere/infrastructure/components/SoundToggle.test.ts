import { describe, expect, it } from 'vitest'
import { playerViewOf } from '@/features/match/application/MatchGateway.fixtures'
import { mountMatchView } from '@/features/match/infrastructure/mountMatchView.fixtures'
import { soundSettingsDefaults } from '../../domain/soundSettings'
import SoundToggle from './SoundToggle.vue'

describe('SoundToggle', () => {
  it('offers to turn sound on at the first visit and plays nothing', async () => {
    const { wrapper, atmosphere } = await mountMatchView(SoundToggle, { view: playerViewOf() })
    expect(wrapper.find('button').attributes('aria-label')).toBe('Turn sound on')
    expect(wrapper.text()).toBe('')
    expect(atmosphere.engine.calls).toEqual([])
  })

  it('unlocks audio and starts the ambient loop of the phase when tapped', async () => {
    const { wrapper, atmosphere } = await mountMatchView(SoundToggle, { view: playerViewOf({ phase: 'day' }) })
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('button').attributes('aria-label')).toBe('Turn sound off')
    expect(atmosphere.engine.calls[0]).toEqual({ kind: 'unlock' })
    expect(atmosphere.engine.lastAmbient()?.id).toBe('day')
  })

  it('shows Tap for sound while a remembered on is still locked', async () => {
    const { wrapper, atmosphere } = await mountMatchView(SoundToggle, {
      atmosphereSettings: { ...soundSettingsDefaults(false), soundOn: true }
    })
    expect(wrapper.text()).toBe('Tap for sound')
    expect(atmosphere.engine.calls).toEqual([])
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toBe('')
    expect(wrapper.find('button').attributes('aria-pressed')).toBe('true')
  })

  it('silences everything when tapped again', async () => {
    const { wrapper, atmosphere } = await mountMatchView(SoundToggle)
    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('button').attributes('aria-label')).toBe('Turn sound on')
    expect(atmosphere.engine.calls.at(-1)).toEqual({ kind: 'stop' })
  })
})
