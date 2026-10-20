import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { snapshotOf } from '@/features/room/domain/snapshot.fixtures'
import { narratorViewOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import NarratorDashboard from './NarratorDashboard.vue'

const mountDashboard = async () => {
  const view = narratorViewOf({ players: matchPlayers(), round: 2 })
  const mounted = await mountMatchView(NarratorDashboard, { view, props: { view }, memberId: 'id-Nico' })
  return mounted
}

describe('narrator moderation', () => {
  it('mutes a player from their row', async () => {
    const { wrapper, rooms } = await mountDashboard()
    await wrapper.find('[aria-label="Mute Tato"]').trigger('click')
    expect(rooms.calls.at(-1)).toEqual({ command: 'mute', input: { memberId: 'id-Tato', muted: true } })
  })

  it('shows a muted icon and offers to unmute', async () => {
    const { wrapper, rooms, room } = await mountDashboard()
    const snapshot = room.snapshot ?? snapshotOf()
    rooms.pushSnapshot({
      ...snapshot,
      members: snapshot.members.map((member) => (member.id === 'id-Tato' ? { ...member, muted: true } : member))
    })
    await flushPromises()
    const row = wrapper.findAll('.prow').find((candidate) => candidate.text().includes('Tato'))
    expect(row?.find('.dashboard-muted').exists()).toBe(true)
    await wrapper.find('[aria-label="Unmute Tato"]').trigger('click')
    expect(rooms.calls.at(-1)).toEqual({ command: 'mute', input: { memberId: 'id-Tato', muted: false } })
  })

  it('asks before kicking a player mid-game', async () => {
    const { wrapper, rooms } = await mountDashboard()
    await wrapper.find('[aria-label="Kick Tato"]').trigger('click')
    expect(rooms.commands()).not.toContain('kick')
    expect(wrapper.find('[role="dialog"]').text()).toContain('A bot takes the seat with the same role')
    await wrapper.find('.dashboard-kick .btn-danger').trigger('click')
    await flushPromises()
    expect(rooms.calls.at(-1)).toEqual({ command: 'kick', input: 'id-Tato' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})
