import { DEFAULT_ROOM_SETTINGS, ok } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { sessionFor } from '../../application/RoomGateway.fixtures'
import { suggestedDeckFor } from '../../domain/deckAdvice'
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

  it('creates a room with the optional voice call link', async () => {
    const { wrapper, gateway } = await mountRoomView(RoomSetupView, { path: '/host' })
    const [roomName, narratorName, voiceCall] = wrapper.findAll('input.input')
    expect(wrapper.text()).toContain('Voice call (optional)')
    expect(wrapper.text()).not.toContain('Create a free call')
    await roomName?.setValue('Los Primos')
    await narratorName?.setValue('Nico')
    await voiceCall?.setValue(' https://discord.gg/abc123 ')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(gateway.calls.at(-1)).toMatchObject({
      command: 'createRoom',
      input: { roomName: 'Los Primos', narratorName: 'Nico', voiceCallUrl: 'https://discord.gg/abc123' }
    })
  })

  it('does not show the voice call field when editing settings', async () => {
    const { wrapper } = await mountRoomView(RoomSetupView, {
      path: '/room/LUNA42/settings',
      seed: async ({ store, gateway: fake }) => {
        fake.answer('join', ok(sessionFor('id-Nico', snapshotOf({ name: 'Los Primos' }))))
        await store.join('LUNA42', 'Nico')
      }
    })
    expect(wrapper.text()).not.toContain('Voice call (optional)')
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

  it('shows the balance verdict for the expected players', async () => {
    const { wrapper } = await mountRoomView(RoomSetupView, { path: '/host' })
    expect(wrapper.find('.setup-balance-title').text()).toContain('Balanced')
    await wrapper.find('[aria-label="Fewer Werewolf"]').trigger('click')
    await wrapper.find('[aria-label="Fewer Werewolf"]').trigger('click')
    expect(wrapper.find('.setup-balance-title').text()).toContain('No wolves')
    for (let step = 0; step < 4; step += 1) await wrapper.find('[aria-label="More Werewolf"]').trigger('click')
    expect(wrapper.find('.setup-balance-title').text()).toContain('Too many wolves')
  })

  it('caps each role at its catalog limit and at the cards left', async () => {
    const { wrapper } = await mountRoomView(RoomSetupView, { path: '/host' })
    expect(wrapper.find('[aria-label="More Seer"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[aria-label="More Villager"]').attributes('disabled')).toBeUndefined()
    for (let step = 0; step < 4; step += 1) await wrapper.find('[aria-label="More Werewolf"]').trigger('click')
    expect(wrapper.find('[aria-label="More Werewolf"]').attributes('disabled')).toBeDefined()
  })

  it('fills in the suggested deck for the expected players', async () => {
    const { wrapper, gateway } = await mountRoomView(RoomSetupView, { path: '/host' })
    const [roomName, narratorName] = wrapper.findAll('input.input')
    await roomName?.setValue('Los Primos')
    await narratorName?.setValue('Nico')
    await wrapper.find('[aria-label="Fewer players"]').trigger('click')
    await wrapper.find('[aria-label="Fewer players"]').trigger('click')
    const suggest = wrapper.findAll('button').find((button) => button.text() === 'Suggested deck for 6')
    await suggest?.trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(gateway.calls.at(-1)).toMatchObject({
      command: 'createRoom',
      input: { settings: { deck: suggestedDeckFor(6) } }
    })
  })
})
