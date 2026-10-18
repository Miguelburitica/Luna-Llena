import { describe, expect, it } from 'vitest'
import { memberView, snapshotOf } from '../../domain/snapshot.fixtures'
import { mountRoomView } from '../mountRoomView.fixtures'
import NarratorLobby from './NarratorLobby.vue'

const players = ['Ana', 'Juan', 'Marta', 'Luis', 'Sofi', 'Caro', 'Tato'].map((name) => memberView(name, { ready: true }))

describe('NarratorLobby', () => {
  it('lists the unmet start conditions and keeps Start disabled', async () => {
    const snapshot = snapshotOf({
      members: [memberView('Nico', { isNarrator: true }), ...players],
      startReadiness: {
        canStart: false,
        unmet: ['deck-mismatch', 'players-not-ready'],
        notReadyMemberIds: ['id-Marta', 'id-Tato'],
        playerCount: 7,
        deckSize: 8
      }
    })
    const { wrapper } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    expect(wrapper.text()).toContain('Mismatch')
    expect(wrapper.text()).toContain('Deck has 8 roles for 7 players.')
    expect(wrapper.text()).toContain('Everyone is ready (Marta, Tato)')
    const start = wrapper.findAll('button').find((button) => button.text().includes('Start game'))
    expect(start?.attributes('disabled')).toBeDefined()
  })

  it('starts the game when the room can start', async () => {
    const snapshot = snapshotOf({
      members: [memberView('Nico', { isNarrator: true }), ...players],
      startReadiness: { canStart: true, unmet: [], notReadyMemberIds: [], playerCount: 7, deckSize: 7 }
    })
    const { wrapper, gateway } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    expect(wrapper.text()).toContain('Match')
    await wrapper.findAll('button').find((button) => button.text().includes('Start game'))?.trigger('click')
    expect(gateway.commands()).toContain('start')
  })

  it('asks before kicking a player', async () => {
    const snapshot = snapshotOf()
    const { wrapper, gateway } = await mountRoomView(NarratorLobby, { props: { snapshot, memberId: 'id-Nico' } })
    await wrapper.find('[aria-label="Kick Ana"]').trigger('click')
    expect(wrapper.text()).toContain('Kick Ana from the village?')
    expect(gateway.commands()).not.toContain('kick')
    const confirm = wrapper.findAll('.modal button').find((button) => button.text() === 'Kick Ana')
    await confirm?.trigger('click')
    expect(gateway.calls.at(-1)).toEqual({ command: 'kick', input: 'id-Ana' })
  })
})
