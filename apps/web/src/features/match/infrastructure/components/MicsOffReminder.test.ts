import { beforeEach, describe, expect, it } from 'vitest'
import { playerViewOf } from '../../application/MatchGateway.fixtures'
import { forgetMatchMemory } from '../matchMemory'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import PlayerTable from './PlayerTable.vue'

const MICS_KEY = 'luna-llena.mics.LUNA42.2'
const CALL = 'https://discord.gg/abc123'

const mountTable = (phase: 'night' | 'day', voiceCallUrl: string | null = CALL, round = 2) => {
  const view = playerViewOf({ phase, round, players: matchPlayers() })
  return mountMatchView(PlayerTable, { view, props: { view }, voiceCallUrl })
}

beforeEach(() => sessionStorage.clear())

describe('MicsOffReminder', () => {
  it('tells every player at nightfall when the room has a call', async () => {
    const { wrapper } = await mountTable('night')
    expect(wrapper.find('.mics-off').text()).toContain('Night falls — mics off')
  })

  it('does not appear without a call link', async () => {
    const { wrapper } = await mountTable('night', null)
    expect(wrapper.find('.mics-off').exists()).toBe(false)
  })

  it('goes away when the night ends', async () => {
    const { wrapper } = await mountTable('day')
    expect(wrapper.find('.mics-off').exists()).toBe(false)
  })

  it('is dismissed per tab and round', async () => {
    const { wrapper } = await mountTable('night')
    await wrapper.find('.mics-off button').trigger('click')
    expect(wrapper.find('.mics-off').exists()).toBe(false)
    expect(sessionStorage.getItem(MICS_KEY)).toBe('true')
    const { wrapper: reopened } = await mountTable('night')
    expect(reopened.find('.mics-off').exists()).toBe(false)
    const { wrapper: nextNight } = await mountTable('night', CALL, 3)
    expect(nextNight.find('.mics-off').exists()).toBe(true)
  })

  it('is forgotten by Play again', async () => {
    sessionStorage.setItem(MICS_KEY, 'true')
    forgetMatchMemory('LUNA42')
    expect(sessionStorage.getItem(MICS_KEY)).toBeNull()
  })
})
