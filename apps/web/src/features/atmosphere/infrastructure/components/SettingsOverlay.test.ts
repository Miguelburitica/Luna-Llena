import { readFileSync } from 'node:fs'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { playerViewOf } from '@/features/match/application/MatchGateway.fixtures'
import { mountMatchView } from '@/features/match/infrastructure/mountMatchView.fixtures'
import { useAtmosphereStore } from '../../application/useAtmosphereStore'
import SettingsOverlay from './SettingsOverlay.vue'

const openSettings = async (options: Parameters<typeof mountMatchView>[1] = {}) => {
  const mounted = await mountMatchView(SettingsOverlay, { view: playerViewOf(), ...options })
  await mounted.wrapper.find('[aria-label="Settings"]').trigger('click')
  return mounted
}

describe('SettingsOverlay', () => {
  it('stays closed until the settings button is pressed', async () => {
    const { wrapper } = await mountMatchView(SettingsOverlay)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    await wrapper.find('[aria-label="Settings"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('shows the three sliders at their defaults', async () => {
    const { wrapper } = await openSettings()
    const sliders = wrapper.findAll('input[type="range"]')
    expect(sliders.map((slider) => (slider.element as HTMLInputElement).value)).toEqual(['80', '55', '100'])
    expect(wrapper.text()).toContain('Master volume')
    expect(wrapper.text()).toContain('Music & ambience')
    expect(wrapper.text()).toContain('Sound effects')
  })

  it('remembers quieter music on the device and plays the loop at a fifth of the master', async () => {
    const { wrapper, atmosphere, pinia } = await openSettings()
    useAtmosphereStore(pinia).toggleSound()
    await wrapper.find('#atmosphere-music').setValue('20')
    await flushPromises()
    expect(wrapper.text()).toContain('20%')
    expect(atmosphere.settings.saved?.music).toBe(20)
    expect(atmosphere.engine.lastAmbient()).toEqual({ id: 'night', volume: 0.16 })
  })

  it('turns reduced motion on and applies it app-wide', async () => {
    const { wrapper, atmosphere } = await openSettings()
    await wrapper.find('[aria-label="Reduced motion"]').trigger('click')
    await flushPromises()
    expect(atmosphere.settings.saved?.reducedMotion).toBe(true)
    expect(atmosphere.motion.applied).toBe(true)
  })

  it('switches the menus to the light look as soon as Light is picked', async () => {
    const { wrapper, atmosphere } = await openSettings()
    const appearance = wrapper.find('[role="radiogroup"][aria-label="Appearance"]')
    expect(appearance.findAll('[role="radio"]').map((option) => option.text())).toEqual(['System', 'Light', 'Dark'])
    expect(appearance.find('[aria-checked="true"]').text()).toBe('System')
    await appearance.findAll('[role="radio"]').find((option) => option.text() === 'Light')?.trigger('click')
    await flushPromises()
    expect(atmosphere.colorMode.applied).toBe('light')
    expect(atmosphere.settings.saved?.colorMode).toBe('light')
  })

  it('draws the leave button in its own label colour', () => {
    const styles = readFileSync('src/features/atmosphere/infrastructure/components/SettingsOverlay.vue', 'utf8').replace(/\s+/g, ' ')
    expect(styles).toContain('.settings-leave { flex: none; margin-top: 8px; }')
  })

  it('puts the appearance choices below their label at full width', () => {
    const styles = readFileSync('src/features/atmosphere/infrastructure/components/SettingsOverlay.vue', 'utf8').replace(/\s+/g, ' ')
    expect(styles).toContain('.settings-appearance { flex-direction: column; align-items: stretch;')
    expect(styles).toContain('.settings-appearance .seg { width: 100%; }')
  })

  it('scrolls only the options and keeps the head in place', () => {
    const styles = readFileSync('src/features/atmosphere/infrastructure/components/SettingsOverlay.vue', 'utf8').replace(/\s+/g, ' ')
    expect(styles).toContain('.settings-sheet { position: fixed; z-index: 71; max-width: 480px; max-height: 90dvh; margin: 0 auto; overflow: hidden; }')
    expect(styles).toContain('.settings-head { flex: none;')
    expect(styles).toContain('.settings-body { flex: 1 1 auto; min-height: 0; overflow-x: hidden; overflow-y: auto;')
    expect(styles).toContain('.settings-body > * { flex-shrink: 0; min-width: 0; max-width: 100%; }')
  })

  it('switches the language', async () => {
    const { wrapper } = await openSettings()
    const spanish = wrapper.findAll('.language-switch button').find((button) => button.text() === 'ES')
    await spanish?.trigger('click')
    expect(wrapper.text()).toContain('Volumen general')
    localStorage.clear()
  })

  it('shows a short How to play', async () => {
    const { wrapper } = await openSettings()
    expect(wrapper.find('.settings-rules').exists()).toBe(false)
    await wrapper.find('[aria-label="Open how to play"]').trigger('click')
    expect(wrapper.findAll('.settings-rules li')).toHaveLength(3)
  })

  it('sends a player home mid-game without giving up the seat', async () => {
    const { wrapper, rooms, router } = await openSettings()
    expect(wrapper.find('.settings-leave').text()).toContain('your seat is kept')
    await wrapper.find('.settings-leave').trigger('click')
    await flushPromises()
    expect(rooms.calls.map((call) => call.command)).not.toContain('leave')
    expect(router.currentRoute.value.name).toBe('home')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('lets the narrator leave, which closes the room', async () => {
    const { wrapper, rooms, router } = await openSettings({ memberId: 'id-Nico' })
    expect(wrapper.find('.settings-leave').text()).toContain('Leave the village')
    await wrapper.find('.settings-leave').trigger('click')
    await flushPromises()
    expect(rooms.calls.map((call) => call.command)).toContain('leave')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('closes with the close button', async () => {
    const { wrapper } = await openSettings()
    await wrapper.find('[aria-label="Close"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})
