import type { HauntEffect, HauntRecord } from '@luna/contracts'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { narratorViewOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import NarratorDashboard from './NarratorDashboard.vue'

const whisper: HauntEffect = {
  id: 'haunt-2',
  kind: 'whisper',
  word: 'bakery',
  ghostId: 'id-Juan',
  targetId: 'id-Marta',
  sentAt: 2_000
}

const flickerRecord: HauntRecord = { round: 1, ghostId: 'id-Juan', haunt: 'flicker', targetId: null, word: null }
const whisperRecord: HauntRecord = { round: 2, ghostId: 'id-Juan', haunt: 'whisper', targetId: 'id-Marta', word: 'bakery' }

const mountDashboard = (haunts: HauntRecord[] = []) => {
  const view = narratorViewOf({ players: matchPlayers(), haunts })
  return mountMatchView(NarratorDashboard, { view, props: { view }, memberId: 'id-Nico' })
}

afterEach(() => vi.useRealTimers())

describe('NarratorHauntFeed', () => {
  it('lists nothing before any haunt', async () => {
    const { wrapper } = await mountDashboard()
    expect(wrapper.find('.haunt-feed').exists()).toBe(false)
  })

  it('lists each haunt of the game with its round, the ghost and target names', async () => {
    const { wrapper } = await mountDashboard([flickerRecord, whisperRecord])
    expect(wrapper.find('.haunt-feed h2').text()).toBe('Hauntings')
    expect(wrapper.findAll('.haunt-feed-line').map((line) => line.text())).toEqual([
      'Round 1Juan’s ghost flickered the lights.',
      'Round 2Juan’s ghost whispered “bakery” to Marta.'
    ])
  })

  it('shows the list and no toast when the narrator reloads', async () => {
    const { wrapper } = await mountDashboard([flickerRecord, whisperRecord])
    expect(wrapper.findAll('.haunt-feed-line')).toHaveLength(2)
    expect(wrapper.find('.haunt-feed-toast').exists()).toBe(false)
  })

  it('pops a toast for a live haunt received after mount and clears it after four seconds', async () => {
    const { wrapper, matches } = await mountDashboard([flickerRecord, whisperRecord])
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
