import { ok } from '@luna/contracts'
import { describe, expect, it, vi } from 'vitest'
import { sessionFor } from '../../application/RoomGateway.fixtures'
import { snapshotOf } from '../../domain/snapshot.fixtures'
import { mountRoomView } from '../mountRoomView.fixtures'
import LobbyView from './LobbyView.vue'

describe('LobbyView', () => {
  it('opens the game screen once the room is in game', async () => {
    const { router } = await mountRoomView(LobbyView, {
      path: '/room/LUNA42',
      seed: async ({ store, gateway }) => {
        gateway.answer('join', ok(sessionFor('id-Caro', snapshotOf({ status: 'in-game' }))))
        await store.join('LUNA42', 'Caro')
      }
    })
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/room/LUNA42/game'))
  })

  it('follows the lobby into the game when the game starts', async () => {
    const { router, gateway } = await mountRoomView(LobbyView, {
      path: '/room/LUNA42',
      seed: async ({ store }) => {
        await store.join('LUNA42', 'Caro')
      }
    })
    expect(router.currentRoute.value.fullPath).toBe('/room/LUNA42')
    gateway.pushSnapshot(snapshotOf({ status: 'in-game' }))
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/room/LUNA42/game'))
  })
})
