import { describe, expect, it } from 'vitest'
import { narratorViewOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import NarratorDashboard from './NarratorDashboard.vue'

const roles = {
  'id-Ana': 'villager',
  'id-Juan': 'doctor',
  'id-Marta': 'seer',
  'id-Luis': 'werewolf',
  'id-Sofi': 'fool',
  'id-Caro': 'drunk',
  'id-Tato': 'werewolf',
  'id-Pipe': 'witch'
} as const

const dashboardOf = (overrides = {}) => narratorViewOf({ players: matchPlayers(), roles, round: 2, ...overrides })

const mountDashboard = (overrides = {}) => {
  const view = dashboardOf(overrides)
  return mountMatchView(NarratorDashboard, { view, props: { view }, memberId: 'id-Nico' })
}

const buttonLabelled = (wrapper: Awaited<ReturnType<typeof mountDashboard>>['wrapper'], label: string) =>
  wrapper.find(`[aria-label="${label}"]`)

describe('NarratorDashboard', () => {
  it('marks the current phase in the stepper as Night N', async () => {
    const { wrapper } = await mountDashboard()
    const current = wrapper.find('.step[aria-current="step"]')
    expect(current.text()).toBe('Night 2')
    expect(wrapper.findAll('.stepper .step')).toHaveLength(6)
  })

  it('shows every true role, the Drunk included', async () => {
    const { wrapper } = await mountDashboard()
    const rows = wrapper.findAll('.prow')
    expect(rows).toHaveLength(8)
    expect(rows.find((row) => row.text().includes('Caro'))?.text()).toContain('Drunk')
    expect(rows.find((row) => row.text().includes('Luis'))?.text()).toContain('Werewolf')
  })

  it('advances to the next phase', async () => {
    const { wrapper, matches } = await mountDashboard()
    const next = wrapper.findAll('button').find((button) => button.text().includes('Next: Dawn'))
    await next?.trigger('click')
    expect(matches.commands()).toEqual(['advance'])
  })

  it('names the phase after execution as the next one', async () => {
    const { wrapper } = await mountDashboard({ phase: 'execution' })
    expect(wrapper.text()).toContain('Next: Night')
  })

  it('kills a living player and revives a fallen one', async () => {
    const { wrapper, matches } = await mountDashboard({
      players: matchPlayers({ 'id-Juan': { alive: false } })
    })
    await buttonLabelled(wrapper, 'Kill Ana').trigger('click')
    await buttonLabelled(wrapper, 'Revive Juan').trigger('click')
    expect(matches.calls).toEqual([
      { command: 'setAlive', input: { memberId: 'id-Ana', alive: false } },
      { command: 'setAlive', input: { memberId: 'id-Juan', alive: true } }
    ])
  })

  it('adds 30 seconds only while a timer runs', async () => {
    const manual = await mountDashboard({ phase: 'day', phaseEndsAt: null })
    expect(buttonLabelled(manual.wrapper, 'Add 30 seconds').attributes('disabled')).toBeDefined()
    const timed = await mountDashboard({ phaseEndsAt: 1_040_000, serverNow: 1_000_000 })
    const add = buttonLabelled(timed.wrapper, 'Add 30 seconds')
    expect(add.attributes('disabled')).toBeUndefined()
    await add.trigger('click')
    expect(timed.matches.commands()).toEqual(['extendTimer'])
  })

  it('shows a command failure kept by the store', async () => {
    const { wrapper, matches } = await mountDashboard({ phaseEndsAt: null })
    matches.failWith('advance', 'match-over')
    await wrapper.findAll('button').find((button) => button.text().includes('Next:'))?.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.err').text()).toBe('The game is over.')
  })

  it('shows no win banner while nobody has won', async () => {
    const { wrapper } = await mountDashboard()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('asks to end the game when a team has won', async () => {
    const { wrapper, matches } = await mountDashboard({ pendingWinner: 'village' })
    const banner = wrapper.find('[role="alert"]')
    expect(banner.text()).toContain('Village wins!')
    await banner.findAll('button').find((button) => button.text() === 'End game')?.trigger('click')
    expect(matches.commands()).toEqual(['endGame'])
  })

  it('lets the narrator keep playing after a wolf victory', async () => {
    const { wrapper, matches } = await mountDashboard({ pendingWinner: 'wolves' })
    const banner = wrapper.find('[role="alert"]')
    expect(banner.text()).toContain('Wolves win!')
    await banner.findAll('button').find((button) => button.text() === 'Keep playing')?.trigger('click')
    expect(matches.commands()).toEqual(['keepPlaying'])
  })
})
