import { err } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { publicCardOf } from '../../application/RoomGateway.fixtures'
import { mountRoomView } from '../mountRoomView.fixtures'
import PublicGamesView from './PublicGamesView.vue'

const RUNNING = publicCardOf({ code: 'RUNNNN', name: 'Aldea del norte', status: 'in-progress', joinable: false })

describe('PublicGamesView', () => {
  it('opens with both filters on and lists the waiting rooms', async () => {
    const { wrapper, publicGames } = await mountRoomView(PublicGamesView, {
      path: '/games',
      seed: async ({ publicGames: fake }) => {
        fake.rooms = [publicCardOf(), RUNNING]
      }
    })
    expect(publicGames.calls).toEqual(['watch'])
    expect(wrapper.text()).toContain('Find a game')
    const chips = wrapper.findAll('.chip')
    expect(chips.map((chip) => chip.attributes('aria-pressed'))).toEqual(['true', 'true'])
    expect(wrapper.findAll('.games-card').map((card) => card.attributes('data-code'))).toEqual(['LUNA42'])
    expect(wrapper.text()).toContain('Narrated by Nico')
    expect(wrapper.text()).toContain('5 of 15')
    expect(wrapper.text()).toContain('2 bots')
    expect(wrapper.text()).toContain('8 cards')
  })

  it('opens the join screen with the code when a joinable room is tapped', async () => {
    const { wrapper, router } = await mountRoomView(PublicGamesView, { path: '/games' })
    await wrapper.find('[data-code="LUNA42"]').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/join/LUNA42'))
  })

  it('shows rooms in progress greyed out and untappable once Waiting to start is off', async () => {
    const { wrapper, router } = await mountRoomView(PublicGamesView, {
      path: '/games',
      seed: async ({ publicGames: fake }) => {
        fake.rooms = [publicCardOf(), RUNNING]
      }
    })
    await wrapper.findAll('.chip')[0]?.trigger('click')
    const running = wrapper.find('[data-code="RUNNNN"]')
    expect(running.classes()).toContain('is-closed')
    expect(running.attributes('aria-disabled')).toBe('true')
    expect(running.text()).toContain('In progress')
    await running.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/games')
  })

  it('updates live', async () => {
    const { wrapper, publicGames } = await mountRoomView(PublicGamesView, { path: '/games' })
    publicGames.pushRooms([publicCardOf({ playerCount: 9 })])
    await flushPromises()
    expect(wrapper.text()).toContain('9 of 15')
  })

  it('shows an empty state with a create action', async () => {
    const { wrapper } = await mountRoomView(PublicGamesView, {
      path: '/games',
      seed: async ({ publicGames: fake }) => {
        fake.rooms = []
      }
    })
    expect(wrapper.text()).toContain('No open games right now')
    expect(wrapper.find('.games-empty a').attributes('href')).toBe('/host')
  })

  it('asks before reporting a room and marks it reported', async () => {
    const { wrapper, publicGames } = await mountRoomView(PublicGamesView, { path: '/games' })
    await wrapper.find('.games-report').trigger('click')
    expect(publicGames.calls).toEqual(['watch'])
    expect(wrapper.find('[role="dialog"]').text()).toContain('Report “Lobos de medianoche”?')
    await wrapper.find('.games-report-actions .btn-danger').trigger('click')
    await flushPromises()
    expect(publicGames.calls).toEqual(['watch', 'report:LUNA42'])
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.find('.games-report').attributes('disabled')).toBeDefined()
  })

  it('shows why a report failed', async () => {
    const { wrapper, publicGames } = await mountRoomView(PublicGamesView, { path: '/games' })
    publicGames.reportResult = err({ code: 'banned', until: Date.UTC(2026, 9, 20, 15, 0) })
    await wrapper.find('.games-report').trigger('click')
    await wrapper.find('.games-report-actions .btn-danger').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').text()).toContain('You can’t join games until')
  })

  it('stops watching when the screen is left', async () => {
    const { wrapper, publicGames } = await mountRoomView(PublicGamesView, { path: '/games' })
    wrapper.unmount()
    expect(publicGames.calls).toEqual(['watch', 'unwatch'])
  })
})
