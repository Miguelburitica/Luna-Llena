import type { HauntEffect } from '@luna/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { playerViewOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import FlickerOverlay from './FlickerOverlay.vue'

const flicker = (id = 'haunt-1'): HauntEffect => ({ id, kind: 'flicker', word: null, ghostId: null, targetId: null, sentAt: 1_000 })

const mountOverlay = () => {
  const view = playerViewOf({ players: matchPlayers() })
  return mountMatchView(FlickerOverlay, { view })
}

const preferReducedMotion = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce'), media: query }))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.classList.remove('reduced')
})

describe('FlickerOverlay', () => {
  it('shows nothing until a flicker arrives', async () => {
    const { wrapper } = await mountOverlay()
    expect(wrapper.find('.flicker').exists()).toBe(false)
    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('flickers the whole screen for about two and a half seconds', async () => {
    preferReducedMotion(false)
    const { wrapper, matches } = await mountOverlay()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    matches.pushHaunt(flicker())
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.flicker').exists()).toBe(true)
    expect(wrapper.find('.toast').exists()).toBe(false)
    vi.advanceTimersByTime(2_399)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.flicker').exists()).toBe(true)
    vi.advanceTimersByTime(1)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.flicker').exists()).toBe(false)
  })

  it('flickers again for each new flicker', async () => {
    preferReducedMotion(false)
    const { wrapper, matches } = await mountOverlay()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    matches.pushHaunt(flicker())
    await wrapper.vm.$nextTick()
    vi.advanceTimersByTime(2_400)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.flicker').exists()).toBe(false)
    matches.pushHaunt(flicker('haunt-2'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.flicker').exists()).toBe(true)
  })

  it('shows a gentle toast and no flashing when the player prefers reduced motion', async () => {
    preferReducedMotion(true)
    const { wrapper, matches } = await mountOverlay()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    matches.pushHaunt(flicker())
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.flicker').exists()).toBe(false)
    expect(wrapper.find('.toast').text()).toBe('A ghost flickered the lights')
    vi.advanceTimersByTime(4_000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('shows the toast when the reduced setting is on', async () => {
    preferReducedMotion(false)
    document.body.classList.add('reduced')
    const { wrapper, matches } = await mountOverlay()
    matches.pushHaunt(flicker())
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.flicker').exists()).toBe(false)
    expect(wrapper.find('.toast').exists()).toBe(true)
  })

  it('ignores whispers', async () => {
    const { wrapper, matches } = await mountOverlay()
    matches.pushHaunt({ ...flicker(), kind: 'whisper', word: 'bakery', targetId: 'id-Ana' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.flicker').exists()).toBe(false)
    expect(wrapper.find('.toast').exists()).toBe(false)
  })
})
