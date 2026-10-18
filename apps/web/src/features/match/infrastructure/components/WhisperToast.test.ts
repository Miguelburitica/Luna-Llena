import type { HauntEffect } from '@luna/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { playerViewOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import WhisperToast from './WhisperToast.vue'

const whisper = (targetId: string | null, word = 'bakery'): HauntEffect => ({
  id: `haunt-${targetId}`,
  kind: 'whisper',
  word,
  ghostId: null,
  targetId,
  sentAt: 1_000
})

const mountToast = () => mountMatchView(WhisperToast, { view: playerViewOf({ players: matchPlayers() }) })

afterEach(() => vi.useRealTimers())

describe('WhisperToast', () => {
  it('shows the whispered word as a ghost toast for four seconds without saying who', async () => {
    const { wrapper, matches } = await mountToast()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    expect(wrapper.find('.toast').exists()).toBe(false)
    matches.pushHaunt(whisper('id-Ana'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast').classes()).toContain('is-ghost')
    expect(wrapper.find('.toast').text()).toBe('A ghost whispers to you: “bakery”')
    vi.advanceTimersByTime(3_999)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast').exists()).toBe(true)
    vi.advanceTimersByTime(1)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('stays quiet for a whisper meant for someone else', async () => {
    const { wrapper, matches } = await mountToast()
    matches.pushHaunt(whisper('id-Marta'))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('stays quiet for a flicker', async () => {
    const { wrapper, matches } = await mountToast()
    matches.pushHaunt({ id: 'haunt-9', kind: 'flicker', word: null, ghostId: null, targetId: null, sentAt: 1_000 })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toast').exists()).toBe(false)
  })
})
