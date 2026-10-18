import { afterEach, describe, expect, it, vi } from 'vitest'
import { playerViewOf } from '@/features/match/application/MatchGateway.fixtures'
import GameView from '@/features/match/infrastructure/views/GameView.vue'
import { matchPlayers, mountMatchView } from '@/features/match/infrastructure/mountMatchView.fixtures'
import { useAtmosphereStore } from '../../application/useAtmosphereStore'

const mountGame = async () => {
  const mounted = await mountMatchView(GameView, { view: playerViewOf({ phase: 'day', players: matchPlayers() }) })
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  return mounted
}

afterEach(() => vi.useRealTimers())

describe('ScreenEffects', () => {
  it('shows nothing until the narrator triggers an effect', async () => {
    const { wrapper } = await mountGame()
    expect(wrapper.find('.screen-effects').exists()).toBe(false)
  })

  it('flashes white once for about 250 ms on Lightning, even with sound off', async () => {
    const { wrapper, atmosphere } = await mountGame()
    atmosphere.cues.emit({ kind: 'effect', effect: 'lightning' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.screen-lightning').exists()).toBe(true)
    vi.advanceTimersByTime(250)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.screen-effects').exists()).toBe(false)
  })

  it('drifts fog for about six seconds', async () => {
    const { wrapper, atmosphere } = await mountGame()
    atmosphere.cues.emit({ kind: 'effect', effect: 'fog' })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.screen-fog .fog').length).toBeGreaterThan(0)
    vi.advanceTimersByTime(5_999)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.screen-fog').exists()).toBe(true)
    vi.advanceTimersByTime(1)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.screen-fog').exists()).toBe(false)
  })

  it('shakes the game root for about 600 ms', async () => {
    const { wrapper, atmosphere } = await mountGame()
    expect(wrapper.find('.game-root').classes()).not.toContain('a-shake')
    atmosphere.cues.emit({ kind: 'effect', effect: 'shake' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.game-root').classes()).toContain('a-shake')
    vi.advanceTimersByTime(600)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.game-root').classes()).not.toContain('a-shake')
  })

  it('shows a short fade instead of shaking with reduced motion', async () => {
    const { wrapper, atmosphere, pinia } = await mountGame()
    useAtmosphereStore(pinia).setReducedMotion(true)
    atmosphere.cues.emit({ kind: 'effect', effect: 'shake' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.game-root').classes()).not.toContain('a-shake')
    expect(wrapper.find('.screen-fade').exists()).toBe(true)
    vi.advanceTimersByTime(250)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.screen-fade').exists()).toBe(false)
  })

  it('fades instead of flashing or drifting with reduced motion', async () => {
    const { wrapper, atmosphere, pinia } = await mountGame()
    useAtmosphereStore(pinia).setReducedMotion(true)
    atmosphere.cues.emit({ kind: 'effect', effect: 'lightning' })
    atmosphere.cues.emit({ kind: 'effect', effect: 'fog' })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.screen-lightning').exists()).toBe(false)
    expect(wrapper.find('.screen-fog').exists()).toBe(false)
    expect(wrapper.findAll('.screen-fade')).toHaveLength(2)
  })
})
