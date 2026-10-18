import type { HauntEffect } from '@luna/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { narratorViewOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import NarratorDashboard from './NarratorDashboard.vue'

const flicker: HauntEffect = { id: 'haunt-1', kind: 'flicker', word: null, ghostId: 'id-Juan', targetId: null, sentAt: 1_000 }
const whisper: HauntEffect = {
  id: 'haunt-2',
  kind: 'whisper',
  word: 'bakery',
  ghostId: 'id-Juan',
  targetId: 'id-Marta',
  sentAt: 2_000
}

const mountDashboard = () =>
  mountMatchView(NarratorDashboard, {
    view: narratorViewOf({ players: matchPlayers() }),
    props: { view: narratorViewOf({ players: matchPlayers() }) },
    memberId: 'id-Nico'
  })

afterEach(() => vi.useRealTimers())

describe('NarratorHauntFeed', () => {
  it('lists nothing before any haunt', async () => {
    const { wrapper } = await mountDashboard()
    expect(wrapper.find('.haunt-feed').exists()).toBe(false)
  })

  it('lists each haunt with the ghost and target names', async () => {
    const { wrapper, matches } = await mountDashboard()
    matches.pushHaunt(flicker)
    matches.pushHaunt(whisper)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.haunt-feed h2').text()).toBe('Hauntings')
    expect(wrapper.findAll('.haunt-feed-line').map((line) => line.text())).toEqual([
      'Juan’s ghost flickered the lights.',
      'Juan’s ghost whispered “bakery” to Marta.'
    ])
  })

  it('pops a toast for a new haunt and clears it after four seconds', async () => {
    const { wrapper, matches } = await mountDashboard()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    matches.pushHaunt(whisper)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.haunt-feed-toast').text()).toBe('Juan’s ghost whispered “bakery” to Marta.')
    vi.advanceTimersByTime(4_000)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.haunt-feed-toast').exists()).toBe(false)
    expect(wrapper.find('.haunt-feed-line').exists()).toBe(true)
  })
})
