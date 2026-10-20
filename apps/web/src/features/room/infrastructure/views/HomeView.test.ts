import { ok } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { sessionFor } from '../../application/RoomGateway.fixtures'
import { mountRoomView } from '../mountRoomView.fixtures'
import { journalWith } from '@/features/table/domain/tableJournal.fixtures'
import HomeView from './HomeView.vue'

const caroSeat = { code: 'LUNA42', memberId: 'id-Caro', token: 'token-id-Caro' }
const stubs = { SettingsOverlay: true }

describe('HomeView', () => {
  it('offers the saved seat and takes the player back to that room', async () => {
    const { wrapper, gateway, router } = await mountRoomView(HomeView, { stored: caroSeat, stubs })
    gateway.answer('resume', ok(sessionFor('id-Caro')))
    const offer = wrapper.find('.home-return')
    expect(offer.text()).toContain('Return to your seat')
    expect(offer.text()).toContain('Room LUNA42')
    await offer.trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/room/LUNA42'))
  })

  it('tells the player the seat is gone and drops the offer', async () => {
    const { wrapper, router } = await mountRoomView(HomeView, { stored: caroSeat, stubs })
    await wrapper.find('.home-return').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Your seat is gone. Join again with the code.')
    expect(wrapper.find('.home-return').exists()).toBe(false)
    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('offers no seat when the device holds none', async () => {
    const { wrapper } = await mountRoomView(HomeView, { stubs })
    expect(wrapper.find('.home-return').exists()).toBe(false)
  })

  it('offers no seat after leaving the lobby on purpose', async () => {
    const { wrapper, store } = await mountRoomView(HomeView, {
      stubs,
      seed: async ({ store: seeded }) => {
        await seeded.join('LUNA42', 'Caro')
      }
    })
    expect(wrapper.find('.home-return').exists()).toBe(true)
    await store.leave()
    await flushPromises()
    expect(wrapper.find('.home-return').exists()).toBe(false)
  })

  it('opens on the dripping wordmark under the gross moon', async () => {
    const { wrapper } = await mountRoomView(HomeView, { stubs })
    expect(wrapper.find('h1').text()).toBe('Luna Llena')
    expect(wrapper.find('h1 .wordmark-drips').exists()).toBe(true)
    expect(wrapper.find('.home-moon').attributes('role')).toBe('img')
    expect(wrapper.find('.home-moon').classes()).toContain('f-logo')
  })

  it('offers to play in person', async () => {
    const { wrapper, router } = await mountRoomView(HomeView, { stubs })
    const link = wrapper.findAll('a').find((anchor) => anchor.text() === 'Play in person')
    expect(link).toBeDefined()
    expect(wrapper.text()).not.toContain('Resume table game')
    await link?.trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('table-setup'))
  })

  it('offers to resume a saved table game', async () => {
    const { wrapper } = await mountRoomView(HomeView, { stubs, tableJournal: journalWith() })
    expect(wrapper.text()).toContain('Resume table game')
  })

  it('offers Find a game, which opens the public games screen', async () => {
    const { wrapper, router } = await mountRoomView(HomeView, { stubs })
    const link = wrapper.findAll('a').find((anchor) => anchor.text() === 'Find a game')
    expect(link?.attributes('href')).toBe('/games')
    await link?.trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('public-games'))
  })
})
