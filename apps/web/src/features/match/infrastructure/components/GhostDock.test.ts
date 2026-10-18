import { describe, expect, it } from 'vitest'
import { playerViewOf, youOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import PlayerTable from './PlayerTable.vue'

const ghostView = (available = true, overrides = {}) =>
  playerViewOf({
    phase: 'day',
    players: matchPlayers({ 'id-Ana': { alive: false }, 'id-Luis': { alive: false } }),
    you: youOf({ haunt: { available } }),
    ...overrides
  })

const mountGhost = (available = true, overrides = {}) => {
  const view = ghostView(available, overrides)
  return mountMatchView(PlayerTable, { view, props: { view } })
}

const sendButton = (wrapper: Awaited<ReturnType<typeof mountGhost>>['wrapper']) => wrapper.find('.ghost-dock .btn-primary')

describe('GhostDock', () => {
  it('offers a dead player the haunt once per game', async () => {
    const { wrapper } = await mountGhost()
    const dock = wrapper.find('.ghost-dock')
    expect(dock.text()).toContain('Haunt the living')
    expect(dock.text()).toContain('once per game')
    const choices = dock.findAll('.ghost-choice')
    expect(choices).toHaveLength(2)
    expect(choices[0]?.text()).toContain('Flicker')
    expect(choices[0]?.text()).toContain('blink every screen')
    expect(choices[1]?.text()).toContain('Whisper')
    expect(choices[1]?.text()).toContain('one word, one player')
    expect(choices[1]?.attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('.dock-head').exists()).toBe(true)
  })

  it('replaces the night and vote docks and stays away from the living', async () => {
    const living = playerViewOf({ players: matchPlayers() })
    const { wrapper } = await mountMatchView(PlayerTable, { view: living, props: { view: living } })
    expect(wrapper.find('.ghost').exists()).toBe(false)
    const { wrapper: ghost } = await mountGhost(true, { phase: 'night' })
    expect(ghost.find('.ghost-dock').exists()).toBe(true)
  })

  it('shows Your haunting power is spent after the haunt', async () => {
    const { wrapper } = await mountGhost(false)
    expect(wrapper.find('.ghost').text()).toBe('Your haunting power is spent')
    expect(wrapper.find('.ghost-dock').exists()).toBe(false)
  })

  it('disables the whisper button until there is a valid word and a player', async () => {
    const { wrapper, matches } = await mountGhost()
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
    expect(sendButton(wrapper).text()).toBe('Choose a word and a player')
    await wrapper.find('.ghost-word').setValue('bakery')
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
    await wrapper.findAll('.ghost .pick')[1]?.trigger('click')
    expect(sendButton(wrapper).attributes('disabled')).toBeUndefined()
    expect(sendButton(wrapper).text()).toBe('Whisper “bakery” to Marta')
    await sendButton(wrapper).trigger('click')
    expect(matches.calls).toEqual([{ command: 'haunt', input: { kind: 'whisper', targetId: 'id-Marta', word: 'bakery' } }])
  })

  it('offers only the living other than you as targets', async () => {
    const { wrapper } = await mountGhost()
    expect(wrapper.findAll('.ghost .pick').map((pick) => pick.find('.pick-name').text())).toEqual([
      'Juan',
      'Marta',
      'Sofi',
      'Caro',
      'Tato',
      'Pipe'
    ])
  })

  it('explains why a word cannot be sent and keeps the button off', async () => {
    const { wrapper } = await mountGhost()
    await wrapper.findAll('.ghost .pick')[0]?.trigger('click')
    expect(wrapper.find('.ghost-dock .err').exists()).toBe(false)
    await wrapper.find('.ghost-word').setValue('two words')
    expect(wrapper.find('.ghost-dock .err').text()).toBe('One word only, no spaces.')
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
    await wrapper.find('.ghost-word').setValue('   ')
    expect(wrapper.find('.ghost-dock .err').text()).toBe('Type one word.')
    expect(sendButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('caps the word at the whisper limit', async () => {
    const { wrapper } = await mountGhost()
    expect(wrapper.find('.ghost-word').attributes('maxlength')).toBe('20')
  })

  it('flickers the lights without a word or a target', async () => {
    const { wrapper, matches } = await mountGhost()
    await wrapper.findAll('.ghost-choice')[0]?.trigger('click')
    expect(wrapper.find('.ghost-word').exists()).toBe(false)
    expect(sendButton(wrapper).text()).toBe('Flicker the lights')
    await sendButton(wrapper).trigger('click')
    expect(matches.calls).toEqual([{ command: 'haunt', input: { kind: 'flicker' } }])
  })

  it.each([
    ['not-a-ghost', 'Only ghosts can haunt.'],
    ['haunt-used', 'Your haunting power is already spent.'],
    ['ghost-powers-off', 'Ghost powers are off in this game.'],
    ['whisper-invalid', 'A whisper is one word and a living player.'],
    ['match-over', 'The game is over.'],
    ['unreachable', 'We can’t reach the village. Check your connection.']
  ] as const)('shows a rejected haunt: %s', async (code, text) => {
    const { wrapper, matches } = await mountGhost()
    matches.failWith('haunt', code)
    await wrapper.findAll('.ghost-choice')[0]?.trigger('click')
    await sendButton(wrapper).trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ghost .err').text()).toBe(text)
  })
})
