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

  describe('at night', () => {
    const action = {
      action: 'hunt',
      acted: true,
      targetId: 'id-Juan',
      visionIsWolf: null,
      fromDrunk: false,
      heal: false,
      poisonTargetId: null
    } as const
    const preview = { victimId: 'id-Juan', protectedId: 'id-Pipe', healing: false, poisonTargetId: null, deaths: ['id-Juan'] }
    const night = (overrides = {}) => ({
      actions: {
        'id-Ana': { ...action, action: 'suspect', targetId: 'id-Tato' },
        'id-Luis': action,
        'id-Marta': { ...action, action: 'inspect', targetId: 'id-Luis', visionIsWolf: true },
        'id-Caro': { ...action, action: 'inspect', targetId: 'id-Ana', visionIsWolf: true, fromDrunk: true },
        'id-Pipe': { ...action, action: 'potions', targetId: null, heal: true, poisonTargetId: 'id-Luis' },
        'id-Juan': { ...action, action: 'protect', targetId: 'id-Pipe' },
        'id-Sofi': { ...action, action: 'suspect', acted: false, targetId: null }
      },
      waitingOn: ['id-Sofi', 'id-Tato'],
      preview,
      ...overrides
    })

    const lineOf = (wrapper: Awaited<ReturnType<typeof mountDashboard>>['wrapper'], name: string) =>
      wrapper.findAll('.prow').find((row) => row.find('b').text() === name)?.find('.act')

    it('shows each player’s action line', async () => {
      const { wrapper } = await mountDashboard({ night: night() })
      expect(lineOf(wrapper, 'Ana')?.text()).toBe('Suspects Tato · decoy')
      expect(lineOf(wrapper, 'Luis')?.text()).toBe('Picked Juan')
      expect(lineOf(wrapper, 'Marta')?.text()).toBe('Inspected Luis → Wolf')
      expect(lineOf(wrapper, 'Caro')?.text()).toBe('“Inspected” Ana → told Wolf')
      expect(lineOf(wrapper, 'Caro')?.find('.i-beer').exists()).toBe(true)
      expect(lineOf(wrapper, 'Juan')?.text()).toBe('Protecting Pipe')
      expect(lineOf(wrapper, 'Pipe')?.text()).toBe('Heal + poison Luis')
      expect(lineOf(wrapper, 'Sofi')?.text()).toBe('Hasn’t acted yet')
      expect(lineOf(wrapper, 'Sofi')?.classes()).toContain('is-wait')
    })

    it('shows who the dawn waits on', async () => {
      const { wrapper } = await mountDashboard({ night: night() })
      expect(wrapper.find('.dashboard-dawn .sbadge.is-warn').text()).toBe('Waiting on Sofi, Tato')
    })

    it('previews the dawn outcome', async () => {
      const { wrapper } = await mountDashboard({ night: night() })
      const panel = wrapper.find('.dashboard-dawn')
      expect(panel.text()).toContain('What happens at dawn')
      expect(panel.text()).toContain('Wolves chose Juan')
      expect(panel.text()).toContain('Doctor protected Pipe')
      expect(panel.text()).toContain('Witch does not heal')
      expect(panel.text()).toContain('Juan dies')
    })

    it('previews a quiet night', async () => {
      const quiet = { victimId: null, protectedId: null, healing: false, poisonTargetId: null, deaths: [] }
      const { wrapper } = await mountDashboard({ night: night({ waitingOn: [], preview: quiet }) })
      const panel = wrapper.find('.dashboard-dawn')
      expect(panel.text()).toContain('Nobody dies')
      expect(panel.find('.is-warn').exists()).toBe(false)
    })

    it('has no action lines or dawn panel by day', async () => {
      const { wrapper } = await mountDashboard({ phase: 'day' })
      expect(wrapper.find('.act').exists()).toBe(false)
      expect(wrapper.find('.dashboard-dawn').exists()).toBe(false)
    })
  })
})
