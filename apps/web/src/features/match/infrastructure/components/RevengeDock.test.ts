import { describe, expect, it } from 'vitest'
import { playerViewOf, youOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import PlayerTable from './PlayerTable.vue'

const shot = (overrides = {}) => ({ hunterId: 'id-Ana', targetId: null, pending: true, ...overrides })

const mountRevenge = (revenge: ReturnType<typeof shot> | null, memberId = 'id-Ana', phase = 'dawn' as const) => {
  const view = playerViewOf({
    phase,
    players: matchPlayers({ 'id-Ana': { alive: false, revealedRole: 'hunter' } }),
    you: youOf({ role: 'hunter' }),
    revenge
  })
  return mountMatchView(PlayerTable, { view, props: { view }, memberId })
}

describe('Hunter revenge', () => {
  it('gives the dead Hunter a picker of living players while the shot is pending', async () => {
    const { wrapper } = await mountRevenge(shot())
    expect(wrapper.find('.revenge').text()).toContain('You were the Hunter.')
    expect(wrapper.find('.revenge').text()).toContain('Everyone sees: The Hunter takes aim…')
    const names = wrapper.findAll('.revenge .pick').map((pick) => pick.find('.pick-name').text())
    expect(names).toEqual(['Juan', 'Marta', 'Luis', 'Sofi', 'Caro', 'Tato', 'Pipe'])
    expect(wrapper.find('.hunter-banner').exists()).toBe(false)
  })

  it('takes the picked player down', async () => {
    const { wrapper, matches } = await mountRevenge(shot())
    const take = () => wrapper.find('.revenge .btn-danger')
    expect(take().text()).toBe('Choose your target')
    expect(take().attributes('disabled')).toBeDefined()
    await wrapper.findAll('.revenge .pick')[5]?.trigger('click')
    expect(take().text()).toBe('Take Tato down')
    await take().trigger('click')
    expect(matches.calls).toEqual([{ command: 'avenge', input: { targetId: 'id-Tato' } }])
  })

  it('shows a rejected shot', async () => {
    const { wrapper, matches } = await mountRevenge(shot())
    matches.failWith('avenge', 'target-invalid')
    await wrapper.findAll('.revenge .pick')[0]?.trigger('click')
    await wrapper.find('.revenge .btn-danger').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.revenge .err').text()).toBe('You can’t pick that player.')
  })

  it('shows everyone else The Hunter takes aim and no picker', async () => {
    const { wrapper } = await mountRevenge(shot({ hunterId: 'id-Tato' }))
    expect(wrapper.find('.hunter-banner').text()).toBe('The Hunter takes aim…')
    expect(wrapper.find('.revenge').exists()).toBe(false)
    expect(wrapper.find('.pick').exists()).toBe(false)
  })

  it('shows the result to everyone once the shot is taken', async () => {
    const settled = shot({ targetId: 'id-Tato', pending: false })
    const { wrapper } = await mountRevenge(settled)
    expect(wrapper.find('.hunter-banner').text()).toBe('The Hunter took Tato down')
    expect(wrapper.find('.revenge').exists()).toBe(false)
    const { wrapper: other } = await mountRevenge(shot({ hunterId: 'id-Tato', targetId: 'id-Luis', pending: false }))
    expect(other.find('.hunter-banner').text()).toBe('The Hunter took Luis down')
  })

  it('says the Hunter held their fire when the narrator skipped the shot', async () => {
    const { wrapper } = await mountRevenge(shot({ pending: false }))
    expect(wrapper.find('.hunter-banner').text()).toBe('The Hunter held their fire')
  })

  it('shows nothing without a revenge shot', async () => {
    const { wrapper } = await mountRevenge(null)
    expect(wrapper.find('.hunter-banner').exists()).toBe(false)
    expect(wrapper.find('.revenge').exists()).toBe(false)
  })
})
