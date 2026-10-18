import type { PlayerNightView, RoleId, TeamId, Vision } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { playerViewOf, youOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import PlayerTable from './PlayerTable.vue'

interface Setup {
  role: RoleId
  team?: TeamId
  night: PlayerNightView | null
  packIds?: readonly string[]
  visions?: Vision[]
  dead?: string[]
  round?: number
}

const mountNight = ({ role, team = 'village', night, packIds = [], visions = [], dead = [], round = 2 }: Setup) => {
  const overrides = Object.fromEntries(dead.map((id) => [id, { alive: false }]))
  const view = playerViewOf({
    round,
    players: matchPlayers(overrides),
    you: youOf({ role, team, packIds, night, visions })
  })
  return mountMatchView(PlayerTable, { view, props: { view } })
}

const pickNames = (wrapper: Awaited<ReturnType<typeof mountNight>>['wrapper']) =>
  wrapper.findAll('.pick').map((pick) => pick.find('.pick-name').text())

const pickOf = (wrapper: Awaited<ReturnType<typeof mountNight>>['wrapper'], name: string) =>
  wrapper.findAll('.pick').find((pick) => pick.find('.pick-name').text() === name)

const potions = (overrides: Partial<Extract<PlayerNightView, { action: 'potions' }>> = {}): PlayerNightView => ({
  action: 'potions',
  acted: false,
  victimId: null,
  heal: false,
  poisonTargetId: null,
  healAvailable: true,
  poisonAvailable: true,
  ...overrides
})

const buttonText = (wrapper: Awaited<ReturnType<typeof mountNight>>['wrapper'], text: string) =>
  wrapper.findAll('button').find((button) => button.text().includes(text))

describe('wolf dock', () => {
  const hunt = (overrides = {}): PlayerNightView => ({
    action: 'hunt',
    targetId: null,
    packPicks: {},
    packVictimId: null,
    ...overrides
  })
  const wolf = { role: 'werewolf', team: 'wolves', packIds: ['id-Tato'] } as const

  it('offers every living player but the pack and marks the other wolf’s pick', async () => {
    const { wrapper } = await mountNight({
      ...wolf,
      night: hunt({ packPicks: { 'id-Tato': 'id-Juan' }, packVictimId: 'id-Juan' })
    })
    expect(pickNames(wrapper)).toEqual(['Juan', 'Marta', 'Luis', 'Sofi', 'Caro', 'Pipe'])
    expect(pickOf(wrapper, 'Juan')?.find('.mini').exists()).toBe(true)
    expect(pickOf(wrapper, 'Marta')?.find('.mini').exists()).toBe(false)
    expect(wrapper.text()).toContain('Pack is split')
  })

  it('says the pack agrees when every wolf picked the same player', async () => {
    const { wrapper } = await mountNight({
      ...wolf,
      night: hunt({ targetId: 'id-Juan', packPicks: { 'id-Ana': 'id-Juan', 'id-Tato': 'id-Juan' }, packVictimId: 'id-Juan' })
    })
    expect(wrapper.text()).toContain('Pack agrees on Juan')
    expect(pickOf(wrapper, 'Juan')?.classes()).toContain('is-sel')
  })

  it('sends the pick', async () => {
    const { wrapper, matches } = await mountNight({ ...wolf, night: hunt() })
    await pickOf(wrapper, 'Marta')?.trigger('click')
    expect(matches.calls).toEqual([{ command: 'act', input: { kind: 'hunt', targetId: 'id-Marta' } }])
  })

  it('shows the failure of an action', async () => {
    const { wrapper, matches } = await mountNight({ ...wolf, night: hunt() })
    matches.failWith('act', 'target-invalid')
    await pickOf(wrapper, 'Marta')?.trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.night-dock .err').text()).toBe('You can’t pick that player.')
  })
})

describe('seer dock', () => {
  const inspect = (overrides = {}): PlayerNightView => ({ action: 'inspect', targetId: null, vision: null, ...overrides })

  it('offers a picker until the player has inspected', async () => {
    const { wrapper, matches } = await mountNight({ role: 'seer', night: inspect() })
    expect(pickNames(wrapper)).not.toContain('You')
    await pickOf(wrapper, 'Luis')?.trigger('click')
    expect(matches.calls).toEqual([{ command: 'act', input: { kind: 'inspect', targetId: 'id-Luis' } }])
  })

  it('shows the vision and no picker after inspecting', async () => {
    const { wrapper } = await mountNight({
      role: 'seer',
      night: inspect({ targetId: 'id-Luis', vision: { round: 2, targetId: 'id-Luis', isWolf: true } })
    })
    expect(wrapper.find('.pick').exists()).toBe(false)
    expect(wrapper.find('.result').text()).toContain('The crystal ball says…')
    expect(wrapper.find('.result').text()).toContain('Luis is a Werewolf')
  })

  it('words a clean vision', async () => {
    const { wrapper } = await mountNight({
      role: 'seer',
      night: inspect({ targetId: 'id-Luis', vision: { round: 2, targetId: 'id-Luis', isWolf: false } })
    })
    expect(wrapper.find('.result').text()).toContain('Luis is not a Werewolf')
  })

  it('lists past visions', async () => {
    const { wrapper } = await mountNight({
      role: 'seer',
      night: inspect(),
      visions: [{ round: 1, targetId: 'id-Sofi', isWolf: false }]
    })
    expect(wrapper.text()).toContain('Past visions')
    expect(wrapper.text()).toContain('Night 1 · Sofi')
    expect(wrapper.text()).toContain('not a Werewolf')
  })
})

describe('doctor dock', () => {
  const protect = (overrides = {}): PlayerNightView => ({ action: 'protect', targetId: null, blockedTargetId: 'id-Luis', ...overrides })

  it('disables last night’s patient and says why', async () => {
    const { wrapper, matches } = await mountNight({ role: 'doctor', night: protect() })
    const blocked = pickOf(wrapper, 'Luis')
    expect(blocked?.attributes('disabled')).toBeDefined()
    expect(blocked?.find('.why').text()).toBe('last night')
    expect(wrapper.text()).toContain('You protected Luis last night.')
    await blocked?.trigger('click')
    expect(matches.calls).toEqual([])
  })

  it('lets the Doctor protect themselves and shows the choice', async () => {
    const { wrapper, matches } = await mountNight({ role: 'doctor', night: protect({ targetId: 'id-Pipe' }) })
    expect(wrapper.text()).toContain('Pipe is protected')
    await pickOf(wrapper, 'You')?.trigger('click')
    expect(matches.calls).toEqual([{ command: 'act', input: { kind: 'protect', targetId: 'id-Ana' } }])
  })
})

describe('witch dock', () => {
  it('shows the wolves’ target', async () => {
    const { wrapper } = await mountNight({ role: 'witch', night: potions({ victimId: 'id-Juan' }) })
    expect(wrapper.find('.result').text()).toContain('The wolves are coming for…')
    expect(wrapper.find('.result').text()).toContain('Juan')
  })

  it('says when the wolves have not chosen', async () => {
    const { wrapper } = await mountNight({ role: 'witch', night: potions() })
    expect(wrapper.find('.result').text()).toContain('The wolves haven’t chosen yet')
    expect(buttonText(wrapper, 'Heal')?.attributes('disabled')).toBeDefined()
  })

  it('toggles the heal', async () => {
    const { wrapper, matches } = await mountNight({ role: 'witch', night: potions({ victimId: 'id-Juan' }) })
    await buttonText(wrapper, 'Heal')?.trigger('click')
    expect(matches.calls).toEqual([{ command: 'act', input: { kind: 'potions', heal: true, poisonTargetId: null } }])
  })

  it('disables spent potions', async () => {
    const { wrapper } = await mountNight({
      role: 'witch',
      night: potions({ victimId: 'id-Juan', healAvailable: false, poisonAvailable: false })
    })
    expect(buttonText(wrapper, 'Heal')?.attributes('disabled')).toBeDefined()
    expect(buttonText(wrapper, 'Poison…')?.attributes('disabled')).toBeDefined()
  })

  it('picks a poison target after Poison…', async () => {
    const { wrapper, matches } = await mountNight({ role: 'witch', night: potions({ victimId: 'id-Juan', heal: true }) })
    expect(wrapper.find('.pick').exists()).toBe(false)
    await buttonText(wrapper, 'Poison…')?.trigger('click')
    expect(pickNames(wrapper)).not.toContain('You')
    await pickOf(wrapper, 'Luis')?.trigger('click')
    expect(matches.calls).toEqual([{ command: 'act', input: { kind: 'potions', heal: true, poisonTargetId: 'id-Luis' } }])
  })

  it('does nothing tonight with both potions untouched', async () => {
    const { wrapper, matches } = await mountNight({
      role: 'witch',
      night: potions({ victimId: 'id-Juan', heal: true, poisonTargetId: 'id-Luis', acted: true })
    })
    await buttonText(wrapper, 'Do nothing tonight')?.trigger('click')
    expect(matches.calls).toEqual([{ command: 'act', input: { kind: 'potions', heal: false, poisonTargetId: null } }])
  })

  it('shows the current choice when nothing was chosen', async () => {
    const { wrapper } = await mountNight({ role: 'witch', night: potions({ acted: true }) })
    expect(wrapper.text()).toContain('You chose to do nothing tonight.')
  })
})

describe('decoy dock', () => {
  const suspect = (targetId: string | null): PlayerNightView => ({ action: 'suspect', targetId })

  it('asks who you suspect and sends the pick', async () => {
    const { wrapper, matches } = await mountNight({ role: 'villager', night: suspect(null) })
    expect(wrapper.text()).toContain('Who do you suspect?')
    await pickOf(wrapper, 'Tato')?.trigger('click')
    expect(matches.calls).toEqual([{ command: 'act', input: { kind: 'suspect', targetId: 'id-Tato' } }])
  })

  it('shows the pick and lets the player change it', async () => {
    const { wrapper } = await mountNight({ role: 'hunter', night: suspect('id-Tato') })
    expect(wrapper.text()).toContain('You suspect Tato')
    expect(wrapper.find('.pick').exists()).toBe(false)
    await buttonText(wrapper, 'Change my pick')?.trigger('click')
    expect(wrapper.find('.pick.is-sel').text()).toContain('Tato')
  })
})

describe('night dock presence', () => {
  it('is hidden by day and for the dead', async () => {
    const day = playerViewOf({ phase: 'day', players: matchPlayers() })
    const { wrapper } = await mountMatchView(PlayerTable, { view: day, props: { view: day } })
    expect(wrapper.find('.dock').exists()).toBe(false)
    const { wrapper: ghost } = await mountNight({ role: 'villager', night: null })
    expect(ghost.find('.dock').exists()).toBe(false)
  })
})
