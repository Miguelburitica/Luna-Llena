import { describe, expect, it } from 'vitest'
import { snapshotOf } from '../../domain/snapshot.fixtures'
import { mountRoomView } from '../mountRoomView.fixtures'
import PlayerLobby from './PlayerLobby.vue'

describe('PlayerLobby', () => {
  it('offers the call by its provider when the room has a link', async () => {
    const snapshot = snapshotOf({ voiceCallUrl: 'https://discord.gg/abc123' })
    const { wrapper } = await mountRoomView(PlayerLobby, { props: { snapshot, memberId: 'id-Ana' } })
    const call = wrapper.find('a.join-call')
    expect(call.text()).toBe('Join on Discord')
    expect(call.attributes('target')).toBe('_blank')
    expect(call.attributes('rel')).toBe('noopener noreferrer')
  })

  it('shows no call button and no prompt when there is no link', async () => {
    const { wrapper } = await mountRoomView(PlayerLobby, { props: { snapshot: snapshotOf(), memberId: 'id-Ana' } })
    expect(wrapper.find('a.join-call').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Add a voice call')
  })
})
