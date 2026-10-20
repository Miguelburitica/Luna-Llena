import { err } from '@luna/contracts'
import { flushPromises } from '@vue/test-utils'
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

  it('shows the round on every step of the stepper', async () => {
    const { wrapper } = await mountDashboard({ phase: 'vote', round: 2 })
    const steps = wrapper.findAll('.stepper .step').slice(1)
    expect(steps.map((step) => step.text())).toEqual(['Night 2', 'Dawn 2', 'Day 2', 'Vote 2', 'Execution 2'])
    expect(wrapper.findAll('.stepper .is-now').map((step) => step.text())).toEqual(['Vote 2'])
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

  describe('Solo winners', () => {
    it('calls the Fool\'s win for a Fool killed by hand', async () => {
      const { wrapper, matches } = await mountDashboard({
        phase: 'execution',
        players: matchPlayers({ 'id-Sofi': { alive: false } }),
        foolClaimIds: ['id-Sofi']
      })
      expect(wrapper.find('.dashboard-solo').text()).toContain('Sofi, the Fool, died by your hand')
      await buttonLabelled(wrapper, 'Call the Fool’s win for Sofi').trigger('click')
      expect(matches.calls).toEqual([{ command: 'declareFoolWin', input: { memberId: 'id-Sofi' } }])
    })

    it('keeps showing a solo winner in later rounds', async () => {
      const { wrapper } = await mountDashboard({
        phase: 'night',
        round: 2,
        verdict: null,
        players: matchPlayers({ 'id-Sofi': { alive: false, revealedRole: 'fool' } }),
        soloWinnerIds: ['id-Sofi']
      })
      expect(wrapper.find('.dashboard-solo-winner').text()).toContain('Sofi won as the Fool')
      expect(wrapper.find('.dashboard-solo-call').exists()).toBe(false)
    })

    it('shows nothing while nobody has won alone', async () => {
      const { wrapper } = await mountDashboard()
      expect(wrapper.find('.dashboard-solo').exists()).toBe(false)
    })
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

  describe('during the vote', () => {
    const voting = { voted: 2, locked: 1, voters: 8 }
    const votes = {
      'id-Ana': { targetId: 'id-Tato', locked: true },
      'id-Luis': { targetId: 'id-Marta', locked: false }
    }

    it('shows every living voter’s target and lock live', async () => {
      const { wrapper } = await mountDashboard({ phase: 'vote', voting, votes })
      const panel = wrapper.find('.dashboard-votes')
      expect(panel.find('.panel-h .sbadge').text()).toBe('2 of 8 voted · 1 locked')
      const lines = panel.findAll('.dashboard-vote')
      expect(lines).toHaveLength(8)
      expect(lines[0]?.text()).toContain('Ana')
      expect(lines[0]?.text()).toContain('→ Tato')
      expect(lines[0]?.text()).toContain('Locked')
      expect(lines[3]?.text()).toContain('→ Marta')
      expect(lines[3]?.text()).not.toContain('Locked')
      expect(lines[1]?.text()).toContain('Hasn’t voted')
    })

    it('has no votes panel outside the vote', async () => {
      const { wrapper } = await mountDashboard({ phase: 'day' })
      expect(wrapper.find('.dashboard-votes').exists()).toBe(false)
    })
  })

  describe('after the vote', () => {
    const verdict = {
      round: 2,
      tally: [
        { targetId: 'id-Luis', votes: 2, voterIds: ['id-Ana', 'id-Juan'] },
        { targetId: 'id-Tato', votes: 1, voterIds: ['id-Marta'] }
      ],
      executedId: 'id-Luis',
      tie: false,
      foolWins: false
    }

    it('summarises the tally and who is executed', async () => {
      const { wrapper } = await mountDashboard({ phase: 'execution', verdict })
      const panel = wrapper.find('.dashboard-verdict')
      expect(panel.text()).toContain('Luis: 2 votes')
      expect(panel.text()).toContain('by Ana, Juan')
      expect(panel.text()).toContain('Tato: 1 vote')
      expect(panel.text()).toContain('Luis is executed')
    })

    it('summarises a tie, nobody voting and the Fool’s win', async () => {
      const tie = await mountDashboard({ phase: 'execution', verdict: { ...verdict, executedId: null, tie: true } })
      expect(tie.wrapper.find('.dashboard-verdict').text()).toContain('Tie: nobody is executed')
      const nobody = await mountDashboard({ phase: 'execution', verdict: { ...verdict, tally: [], executedId: null } })
      expect(nobody.wrapper.find('.dashboard-verdict').text()).toContain('Nobody voted: nobody is executed')
      const fool = await mountDashboard({ phase: 'execution', verdict: { ...verdict, foolWins: true } })
      expect(fool.wrapper.find('.dashboard-verdict .team-solo').text()).toBe('The Fool wins!')
    })
  })

  describe('with a Hunter’s shot', () => {
    const pending = { hunterId: 'id-Sofi', targetId: null, pending: true }

    it('names the Hunter, skips the shot and blocks Next while it is pending', async () => {
      const { wrapper, matches } = await mountDashboard({ phase: 'dawn', revenge: pending })
      const panel = wrapper.find('.dashboard-revenge')
      expect(panel.text()).toContain('Sofi is taking aim')
      const next = wrapper.findAll('button').find((button) => button.text().includes('Next:'))
      expect(next?.attributes('disabled')).toBeDefined()
      await panel.findAll('button').find((button) => button.text() === 'Skip the shot')?.trigger('click')
      expect(matches.commands()).toEqual(['skipRevenge'])
    })

    it('lets the narrator advance once the shot is resolved and shows the result', async () => {
      const { wrapper } = await mountDashboard({ phase: 'dawn', revenge: { ...pending, targetId: 'id-Tato', pending: false } })
      const panel = wrapper.find('.dashboard-revenge')
      expect(panel.text()).toContain('Sofi took Tato down')
      expect(panel.find('button').exists()).toBe(false)
      const next = wrapper.findAll('button').find((button) => button.text().includes('Next:'))
      expect(next?.attributes('disabled')).toBeUndefined()
    })

    it('says the Hunter held their fire after a skip', async () => {
      const { wrapper } = await mountDashboard({ phase: 'dawn', revenge: { ...pending, pending: false } })
      expect(wrapper.find('.dashboard-revenge').text()).toContain('Sofi held their fire')
    })

    it('has no revenge panel without a shot', async () => {
      const { wrapper } = await mountDashboard()
      expect(wrapper.find('.dashboard-revenge').exists()).toBe(false)
    })
  })
})

describe('NarratorDashboard voice call', () => {
  const mountWithCall = (voiceCallUrl: string | null) => {
    const view = dashboardOf()
    return mountMatchView(NarratorDashboard, { view, props: { view }, memberId: 'id-Nico', voiceCallUrl })
  }

  it('prompts the narrator to add a call when there is none', async () => {
    const { wrapper } = await mountWithCall(null)
    expect(wrapper.find('a.join-call').exists()).toBe(false)
    expect(wrapper.text()).toContain('Add a voice call')
  })

  it('shows the join button by provider', async () => {
    const { wrapper } = await mountWithCall('https://zoom.us/j/123')
    expect(wrapper.find('a.join-call').text()).toBe('Join on Zoom')
    expect(wrapper.text()).not.toContain('Add a voice call')
  })

  it('changes the link mid-game through the room store', async () => {
    const { wrapper, rooms } = await mountWithCall('https://zoom.us/j/123')
    await wrapper.find('[aria-label="Change the call"]').trigger('click')
    await wrapper.find('.dashboard-call-panel input').setValue('https://meet.google.com/abc-defg-hij')
    await wrapper.find('.dashboard-call-panel form').trigger('submit')
    await flushPromises()
    expect(rooms.calls.at(-1)).toEqual({ command: 'setVoiceCall', input: 'https://meet.google.com/abc-defg-hij' })
    expect(wrapper.find('.dashboard-call-panel').exists()).toBe(false)
  })

  it('adds a free call from the empty state', async () => {
    const { wrapper, rooms } = await mountWithCall(null)
    await wrapper.findAll('button').find((button) => button.text() === 'Add a voice call')?.trigger('click')
    await wrapper.findAll('.dashboard-call-panel button').find((button) => button.text() === 'Create a free call')?.trigger('click')
    expect((wrapper.find('.dashboard-call-panel input').element as HTMLInputElement).value).toBe('https://meet.jit.si/LunaLlena-LUNA42')
    await wrapper.find('.dashboard-call-panel form').trigger('submit')
    expect(rooms.calls.at(-1)).toEqual({ command: 'setVoiceCall', input: 'https://meet.jit.si/LunaLlena-LUNA42' })
  })

  it('keeps the editor open and explains a rejected link', async () => {
    const { wrapper, rooms } = await mountWithCall('https://zoom.us/j/123')
    rooms.answer('setVoiceCall', err({ code: 'voice-call-invalid' }))
    await wrapper.find('[aria-label="Change the call"]').trigger('click')
    await wrapper.find('.dashboard-call-panel input').setValue('nope')
    await wrapper.find('.dashboard-call-panel form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.dashboard-call-panel [role="alert"]').text()).toContain('secure link')
  })
})
