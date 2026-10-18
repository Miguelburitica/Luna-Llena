import { DEFAULT_ROOM_SETTINGS, ok } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { sessionFor } from '../../application/RoomGateway.fixtures'
import { snapshotOf } from '../../domain/snapshot.fixtures'
import { mountRoomView } from '../mountRoomView.fixtures'
import RoomSetupView from './RoomSetupView.vue'

describe('RoomSetupView', () => {
  it('creates a room with the narrator name and the chosen settings', async () => {
    const { wrapper, gateway, router } = await mountRoomView(RoomSetupView, { path: '/host' })
    const [roomName, narratorName] = wrapper.findAll('input.input')
    await roomName?.setValue('Los Primos')
    await narratorName?.setValue('Nico')
    await wrapper.find('[aria-label="Fewer Fool"]').trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(gateway.calls.at(-1)).toEqual({
      command: 'createRoom',
      input: {
        roomName: 'Los Primos',
        narratorName: 'Nico',
        settings: { ...DEFAULT_ROOM_SETTINGS, deck: { ...DEFAULT_ROOM_SETTINGS.deck, fool: 0 } }
      }
    })
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/room/LUNA42'))
  })

  it('opens from the lobby with the room settings already loaded and saves changes', async () => {
    const { wrapper, gateway, router } = await mountRoomView(RoomSetupView, {
      path: '/room/LUNA42/settings',
      seed: async ({ store, gateway: fake }) => {
        fake.answer('join', ok(sessionFor('id-Nico', snapshotOf({ name: 'Los Primos' }))))
        await store.join('LUNA42', 'Nico')
      }
    })
    expect(wrapper.text()).toContain('Village settings')
    expect(wrapper.text()).toContain('8 cards')
    expect(wrapper.find('input.input').exists()).toBe(false)
    await wrapper.find('[aria-label="Fewer Drunk"]').trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(gateway.calls.at(-1)).toEqual({
      command: 'updateSettings',
      input: { ...DEFAULT_ROOM_SETTINGS, deck: { ...DEFAULT_ROOM_SETTINGS.deck, drunk: 0 } }
    })
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/room/LUNA42'))
  })

  it('sends players back to the lobby', async () => {
    const { router } = await mountRoomView(RoomSetupView, {
      path: '/room/LUNA42/settings',
      seed: async ({ store, gateway: fake }) => {
        fake.answer('join', ok(sessionFor('id-Ana')))
        await store.join('LUNA42', 'Ana')
      }
    })
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/room/LUNA42'))
  })
})
