import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { soundSettingsDefaults } from '@/features/atmosphere/domain/soundSettings'
import type { TableJournal } from '../../domain/tableJournal'
import {
  advance,
  ANA,
  CARO,
  journalWith,
  JUAN,
  logged,
  LUIS,
  MARTA,
  PIPE,
  SOFI,
  START,
  TATO
} from '../../domain/tableJournal.fixtures'
import { buttonNamed, mountTableView, pickNamed, pickNames, press } from '../mountTableView.fixtures'
import LogbookView from './LogbookView.vue'

afterEach(() => vi.useRealTimers())

const mountLogbook = (journal: TableJournal = journalWith()) => mountTableView(LogbookView, { journal })

type Wrapper = Awaited<ReturnType<typeof mountLogbook>>['wrapper']

const step = (wrapper: Wrapper, power: string) => {
  const found = wrapper.findAll('.script-step').find((candidate) => candidate.find('.script-step-title b').text() === power)
  if (found === undefined) throw new Error(`No step ${power}`)
  return found
}

const openStep = async (wrapper: Wrapper, power: string) => {
  if (!step(wrapper, power).find('.script-step-body').exists()) await step(wrapper, power).find('.script-step-head').trigger('click')
  await flushPromises()
  return step(wrapper, power)
}

const chips = (wrapper: Wrapper, row: number) => wrapper.findAll('.votes-chips')[row]?.findAll('.chip') ?? []
const chip = async (wrapper: Wrapper, row: number, name: string) => {
  await chips(wrapper, row).find((candidate) => candidate.find('.votes-name').text() === name)?.trigger('click')
  await flushPromises()
}

describe('LogbookView night', () => {
  it('Script for the default deck: every power by name, in order', async () => {
    const { wrapper } = await mountLogbook()

    expect(wrapper.findAll('.script-step-head').map((head) => head.text())).toEqual([
      expect.stringMatching(/Werewolves.*Wake Luis, Tato.*To log/),
      expect.stringMatching(/Seer.*Wake Marta.*To log/),
      expect.stringMatching(/Drunk.*Wake Caro.*To log/),
      expect.stringMatching(/Doctor.*Wake Juan.*To log/),
      expect.stringMatching(/Witch.*Wake Sofi.*To log/)
    ])
  })

  it('A dead Seer is a pretend step with a countdown', async () => {
    vi.useFakeTimers()
    const { wrapper } = await mountLogbook(logged(journalWith(), { kind: 'set-alive', seatId: MARTA, alive: false, at: START }, ...advance(5)))
    const seer = await openStep(wrapper, 'Seer')

    expect(seer.find('.sbadge').text()).toBe('Pretend')
    expect(seer.findAll('.pick')).toHaveLength(0)
    await press(wrapper, 'Pretend for 8s')
    await vi.advanceTimersByTimeAsync(3000)
    expect(step(wrapper, 'Seer').text()).toContain('5s…')
  })

  it('Wolves cannot eat wolves: the hunt picker leaves the pack out', async () => {
    const { wrapper } = await mountLogbook()
    const wolves = await openStep(wrapper, 'Werewolves')

    expect(pickNames(wolves)).toEqual(['Marta', 'Caro', 'Juan', 'Sofi', 'Pipe', 'Ana'])
  })

  it('The pack points: the preview names the victim', async () => {
    const { wrapper } = await mountLogbook()
    await pickNamed(await openStep(wrapper, 'Werewolves'), 'Juan')

    expect(wrapper.find('.logbook-preview').text()).toContain('Wolves chose Juan')
    expect(wrapper.find('.logbook-preview').text()).toContain('Juan dies')
  })

  it('A true vision: the result card says Werewolf', async () => {
    const { wrapper } = await mountLogbook()
    await pickNamed(await openStep(wrapper, 'Seer'), 'Luis')

    expect(wrapper.find('.vision').text()).toContain('You looked at Luis')
    expect(wrapper.find('.vision').text()).toContain('Werewolf')
  })

  it('The Drunk’s vision: a random result, marked for the narrator', async () => {
    const { wrapper, table } = await mountLogbook()
    await pickNamed(await openStep(wrapper, 'Drunk'), 'Ana')

    expect(wrapper.find('.vision').text()).toContain('Werewolf')
    expect(table.view?.night?.actions[CARO]).toMatchObject({ visionIsWolf: true, fromDrunk: true })
    expect(step(wrapper, 'Drunk').text()).toContain('Caro believes they are the Seer')
  })

  it('Same patient twice: last night’s patient is disabled with the reason', async () => {
    const { wrapper } = await mountLogbook(logged(journalWith(), { kind: 'protect', doctorId: JUAN, targetId: ANA, at: START }, ...advance(5)))
    const doctor = await openStep(wrapper, 'Doctor')
    const ana = doctor.findAll('.pick').find((pick) => pick.find('.pick-name').text() === 'Ana')

    expect(ana?.attributes('disabled')).toBeDefined()
    expect(ana?.text()).toContain('last night')
  })

  it('The Witch sees the target', async () => {
    const { wrapper } = await mountLogbook(logged(journalWith(), { kind: 'hunt', targetId: JUAN, at: START }))
    const witch = await openStep(wrapper, 'Witch')

    expect(witch.text()).toContain('The wolves are coming for… Juan')
  })

  it('Heal already used: the Heal button is disabled', async () => {
    const { wrapper } = await mountLogbook(
      logged(
        journalWith(),
        { kind: 'hunt', targetId: JUAN, at: START },
        { kind: 'potions', witchId: SOFI, heal: true, poisonTargetId: null, at: START },
        ...advance(5),
        { kind: 'hunt', targetId: ANA, at: START }
      )
    )
    const witch = await openStep(wrapper, 'Witch')

    expect(buttonNamed(witch as unknown as Wrapper, /Heal/)?.attributes('disabled')).toBeDefined()
  })

  it('Forgot the Doctor: Next asks to confirm before dawn', async () => {
    const { wrapper, table } = await mountLogbook()
    await press(wrapper, /Next: Dawn/)

    expect(wrapper.find('.logbook-confirm').text()).toContain('Still waiting on: Werewolves, Seer, Drunk, Doctor, Witch')
    expect(table.view?.phase).toBe('night')
    await press(wrapper, 'Go to dawn')
    expect(table.view?.phase).toBe('dawn')
  })

  it('Wrong victim: Undo takes the pick back', async () => {
    const { wrapper, table } = await mountLogbook()
    await pickNamed(await openStep(wrapper, 'Werewolves'), 'Ana')
    await wrapper.find('button[aria-label="Undo"]').trigger('click')
    await flushPromises()

    expect(table.view?.night?.preview.victimId).toBeNull()
  })

  it('Nothing to undo at the start of Night 1', async () => {
    const { wrapper } = await mountLogbook()
    await wrapper.find('button[aria-label="Undo"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('.err').text()).toContain('Nothing to undo yet')
  })
})

describe('LogbookView day', () => {
  it('A death at dawn shows the tombstone and the role', async () => {
    const { wrapper } = await mountLogbook(logged(journalWith(), { kind: 'hunt', targetId: JUAN, at: START }, ...advance()))

    expect(wrapper.text()).toContain('Juan didn’t wake up')
    expect(wrapper.find('.dawn-death').text()).toContain('Doctor')
  })

  it('One last shot and Waiting for the shot', async () => {
    const { wrapper, table } = await mountLogbook(logged(journalWith(), { kind: 'hunt', targetId: PIPE, at: START }, ...advance()))

    expect(wrapper.find('.logbook-revenge').text()).toContain('Pipe takes aim')
    expect(buttonNamed(wrapper, /Next: Day/)?.attributes('disabled')).toBeDefined()
    await pickNamed(wrapper.find('.logbook-revenge'), 'Tato')

    expect(table.view?.players.find((player) => player.id === TATO)?.alive).toBe(false)
    expect(buttonNamed(wrapper, /Next: Day/)?.attributes('disabled')).toBeUndefined()
  })

  it('Hands up: accused first, then every raised hand, with a running tally', async () => {
    const { wrapper } = await mountLogbook(logged(journalWith(), ...advance(3)))
    await chip(wrapper, 0, 'Luis')
    for (const name of ['Ana', 'Caro', 'Pipe', 'Sofi']) await chip(wrapper, 1, name)
    await chip(wrapper, 0, 'Sofi')
    for (const name of ['Juan', 'Tato']) await chip(wrapper, 1, name)

    expect(wrapper.findAll('.votes-row').map((row) => row.text())).toEqual([
      expect.stringContaining('Luis4 votes'),
      expect.stringContaining('Sofi2 votes')
    ])
    await press(wrapper, /Next: Execution/)
    expect(wrapper.text()).toContain('Luis leaves the village')
  })

  it('Changing hands: tapping a voter under another accused moves the vote', async () => {
    const { wrapper, table } = await mountLogbook(logged(journalWith(), ...advance(3), { kind: 'vote', voterId: CARO, targetId: LUIS, at: START }))
    expect(chips(wrapper, 0).find((candidate) => candidate.find('.votes-name').text() === 'Luis')?.find('.votes-count').text()).toBe('1')
    await chip(wrapper, 0, 'Tato')
    expect(chips(wrapper, 1).find((candidate) => candidate.find('.votes-name').text() === 'Caro')?.text()).toContain('now on Luis')
    await chip(wrapper, 1, 'Caro')

    expect(table.view?.votes?.[CARO]?.targetId).toBe(TATO)
  })

  it('A tie executes nobody', async () => {
    const { wrapper } = await mountLogbook(
      logged(
        journalWith(),
        ...advance(3),
        { kind: 'vote', voterId: ANA, targetId: LUIS, at: START },
        { kind: 'vote', voterId: CARO, targetId: TATO, at: START },
        ...advance()
      )
    )

    expect(wrapper.text()).toContain('It’s a tie!')
  })

  it('Fooled you: the Fool wins and the game goes on', async () => {
    const { wrapper, table } = await mountLogbook(logged(journalWith(), ...advance(3)))
    await chip(wrapper, 0, 'Ana')
    await chip(wrapper, 1, 'Luis')
    await press(wrapper, /Next: Execution/)

    expect(wrapper.find('.logbook-fool').text()).toContain('The Fool wins!')
    expect(table.view?.soloWinnerIds).toEqual([ANA])
    expect(table.view?.pendingWinner).toBeNull()
    expect(buttonNamed(wrapper, /Next: Night/)).toBeDefined()
  })

  it('Last wolf falls: the narrator is asked to end the game', async () => {
    const { wrapper, router } = await mountLogbook(logged(journalWith(['werewolf', 'seer', 'doctor', 'villager', 'villager', 'villager']), ...advance(3)))
    await chip(wrapper, 0, 'Luis')
    await chip(wrapper, 1, 'Tato')
    await press(wrapper, /Next: Execution/)

    expect(wrapper.find('.logbook-win').text()).toContain('Village wins!')
    await press(wrapper, 'End the game')
    expect(router.currentRoute.value.name).toBe('table-over')
  })

  it('A player goes home: the narrator marks them dead', async () => {
    const { wrapper, table } = await mountLogbook(logged(journalWith(), ...advance(2)))
    await wrapper.find('button[aria-label="Mark Pipe dead"]').trigger('click')
    await flushPromises()

    expect(table.view?.players.find((player) => player.id === PIPE)?.alive).toBe(false)
    expect(table.match?.timeline.at(-1)).toMatchObject({ kind: 'narrator', memberId: PIPE, alive: false })
  })

  it('Who was Caro again: tapping a seat opens the true card', async () => {
    const { wrapper } = await mountLogbook(logged(journalWith(), ...advance(7)))
    await wrapper.findAll('.seats-consult').find((button) => button.text().startsWith('Caro'))?.trigger('click')
    await flushPromises()

    expect(wrapper.find('.consult').text()).toContain('Caro’s card')
    expect(wrapper.find('.consult .rcard-name').text()).toBe('Drunk')
    expect(wrapper.find('.consult').text()).toContain('Thinks they are the Seer')
    await press(wrapper, 'Close')
    expect(wrapper.find('.consult').exists()).toBe(false)
    expect(wrapper.find('.logbook-phase').text()).toBe('Day 2')
  })
})

describe('LogbookView timers and effects', () => {
  it('Day countdown: the day shows 3:00', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(START)
    const { wrapper } = await mountLogbook(logged(journalWith(), ...advance(2)))

    expect(wrapper.find('.logbook-timer').text()).toContain('3:00')
  })

  it('Time’s up: the alert shows and the alarm plays once, without advancing', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(START)
    const { wrapper, atmosphere, table } = await mountLogbook(logged(journalWith(), ...advance(3)))
    await wrapper.find('button[aria-label="Turn sound on"]').trigger('click')
    await vi.advanceTimersByTimeAsync(61_000)

    expect(wrapper.find('.logbook-timer').text()).toContain('Time’s up')
    expect(atmosphere.engine.calls.filter((call) => call.kind === 'alert')).toHaveLength(1)
    expect(table.view?.phase).toBe('vote')
  })

  it('Thunder at the table: plays on this device only', async () => {
    const { wrapper, atmosphere } = await mountTableView(LogbookView, {
      journal: journalWith(),
      atmosphereSettings: { ...soundSettingsDefaults(false), soundOn: true }
    })
    await wrapper.find('button[aria-label="Tap for sound"]').trigger('click')
    await press(wrapper, /Thunder/)

    expect(atmosphere.engine.played()).toContain('thunder')
    expect(atmosphere.cues.sent).toEqual([])
    expect(wrapper.text()).toContain('Effects on this screen')
  })

  it('Nightfall sting: the howl plays when the night begins', async () => {
    const { wrapper, atmosphere } = await mountLogbook(logged(journalWith(), ...advance(4)))
    await wrapper.find('button[aria-label="Turn sound on"]').trigger('click')
    await press(wrapper, /Next: Night/)

    expect(atmosphere.engine.played()).toContain('howl')
    expect(atmosphere.engine.lastAmbient()?.id).toBe('night')
  })
})
