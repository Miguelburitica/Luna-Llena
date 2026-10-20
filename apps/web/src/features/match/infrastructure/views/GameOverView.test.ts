import type { Award, TimelineEntry } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { messageOf } from '@/features/chat/application/ChatGateway.fixtures'
import { useChatStore } from '@/features/chat/application/useChatStore'
import { narratorViewOf, outcomeOf, playerViewOf, youOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import GameView from './GameView.vue'

const night: TimelineEntry = {
  kind: 'night',
  round: 1,
  victimId: 'id-Ana',
  protectedId: 'id-Ana',
  healed: false,
  poisonedId: null,
  visions: [{ seerId: 'id-Marta', targetId: 'id-Sofi', isWolf: false, fromDrunk: false }],
  deaths: []
}

const vote: TimelineEntry = {
  kind: 'vote',
  round: 1,
  verdict: {
    round: 1,
    tally: [{ targetId: 'id-Luis', votes: 2, voterIds: ['id-Ana', 'id-Juan'] }],
    executedId: 'id-Luis',
    tie: false,
    foolWins: false
  }
}

const finished = (soloWinnerIds: string[]) =>
  playerViewOf({
    players: matchPlayers({ 'id-Marta': { alive: false, revealedRole: 'fool' }, 'id-Luis': { revealedRole: 'werewolf' } }),
    outcome: outcomeOf({ winner: 'wolves' }),
    soloWinnerIds
  })

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

const revealedPlayers = (overrides: Record<string, string> = {}) =>
  matchPlayers(Object.fromEntries(Object.entries({ ...roles, ...overrides }).map(([id, role]) => [id, { revealedRole: role as never }])))

const button = (wrapper: { findAll: (selector: string) => Array<{ text: () => string; trigger: (event: string) => Promise<void> }> }, label: string) =>
  wrapper.findAll('button').find((candidate) => candidate.text().includes(label))

describe('GameOverView', () => {
  it('shows the winning team with its flavor line and the solo winners under it', async () => {
    const { wrapper } = await mountMatchView(GameView, { view: finished(['id-Marta']), preload: false })
    expect(wrapper.find('.over-banner').text()).toBe('Wolves win!')
    expect(wrapper.find('.over-flavor').text()).toBe('The pack has the village to itself. Nobody sleeps tonight.')
    const winners = wrapper.findAll('.over-solo-winner')
    expect(winners).toHaveLength(1)
    expect(winners[0]?.text()).toContain('Marta')
    expect(winners[0]?.text()).toContain('The Fool also won')
  })

  it('lists no solo winners when nobody won alone', async () => {
    const { wrapper } = await mountMatchView(GameView, { view: finished([]), preload: false })
    expect(wrapper.find('.over-solo').exists()).toBe(false)
  })

  it('shows the narrator every true role and no plot twist', async () => {
    const view = narratorViewOf({ players: matchPlayers(), roles, outcome: outcomeOf({ winner: 'village' }), soloWinnerIds: ['id-Sofi'] })
    const { wrapper } = await mountMatchView(GameView, { view, preload: false, memberId: 'id-Nico' })
    expect(wrapper.find('.over-solo-winner').text()).toContain('The Fool also won')
    const tiles = wrapper.findAll('.over-tile')
    expect(tiles).toHaveLength(8)
    expect(tiles.find((tile) => tile.text().includes('Caro'))?.text()).toContain('Drunk')
    expect(tiles.find((tile) => tile.text().includes('Luis'))?.text()).toContain('Werewolf')
    expect(wrapper.find('.over-twist').exists()).toBe(false)
  })

  it('shows players the roles revealed at the end and marks their own seat', async () => {
    const view = playerViewOf({ players: revealedPlayers(), you: youOf({ role: 'villager' }), outcome: outcomeOf({ winner: 'wolves' }) })
    const { wrapper } = await mountMatchView(GameView, { view, preload: false })
    const tiles = wrapper.findAll('.over-tile')
    expect(tiles.find((tile) => tile.text().includes('Caro'))?.text()).toContain('Drunk')
    expect(tiles.filter((tile) => tile.classes('is-you'))).toHaveLength(1)
    expect(tiles.find((tile) => tile.classes('is-you'))?.find('b').text()).toBe('Ana (you)')
    expect(tiles.find((tile) => tile.classes('is-you'))?.find('.over-role').text()).toBe('Villager')
    expect(wrapper.find('.rcard-back').exists()).toBe(false)
  })

  it('sums up the game in numbers', async () => {
    const players = matchPlayers({ 'id-Luis': { alive: false }, 'id-Tato': { alive: false }, 'id-Juan': { alive: false } })
    const view = playerViewOf({ players, round: 3, outcome: outcomeOf({ winner: 'village' }) })
    const { wrapper } = await mountMatchView(GameView, { view, preload: false })
    expect(wrapper.findAll('.over-summary li').map((item) => item.text())).toEqual(['8 players', '5 survivors', '3 days'])
  })

  it('groups who was who by team and marks the dead', async () => {
    const view = playerViewOf({
      players: revealedPlayers().map((player) => (player.id === 'id-Luis' ? { ...player, alive: false } : player)),
      outcome: outcomeOf({ winner: 'village' })
    })
    const { wrapper } = await mountMatchView(GameView, { view, preload: false })
    const teams = wrapper.findAll('.over-team')
    expect(teams.map((team) => team.find('.over-team-name').text())).toEqual(['Wolves', 'Village', 'Solo'])
    expect(teams[0]?.findAll('.over-name').map((name) => name.text())).toEqual(['Luis', 'Tato'])
    expect(teams[2]?.findAll('.over-name').map((name) => name.text())).toEqual(['Sofi'])
    const luis = teams[0]?.findAll('.over-tile').find((tile) => tile.text().includes('Luis'))
    expect(luis?.classes()).toContain('is-fallen')
    expect(luis?.find('.over-fallen').text()).toBe('Dead')
    expect(teams[0]?.findAll('.over-fallen')).toHaveLength(1)
  })

  describe('Plot twist', () => {
    it('tells the Drunk what they really were', async () => {
      const view = playerViewOf({ players: revealedPlayers(), you: youOf({ role: 'seer' }), outcome: outcomeOf() })
      const { wrapper } = await mountMatchView(GameView, { view, preload: false, memberId: 'id-Caro' })
      expect(wrapper.find('.over-twist').text()).toContain('You were the Drunk all along')
      expect(wrapper.find('.over-twist').text()).toContain('Your card said Seer')
    })

    it('stays hidden for a player whose card told the truth', async () => {
      const view = playerViewOf({ players: revealedPlayers(), you: youOf({ role: 'doctor' }), outcome: outcomeOf() })
      const { wrapper } = await mountMatchView(GameView, { view, preload: false, memberId: 'id-Juan' })
      expect(wrapper.text()).not.toContain('all along')
    })
  })

  describe('Reading the story', () => {
    const story = async () => {
      const view = playerViewOf({
        players: revealedPlayers(),
        you: youOf({ role: 'villager' }),
        outcome: outcomeOf({ timeline: [night, vote] })
      })
      return mountMatchView(GameView, { view, preload: false })
    }

    const toggles = (wrapper: Awaited<ReturnType<typeof story>>['wrapper']) => wrapper.findAll('.story-toggle')

    it('lists a night and a day entry, closed at first', async () => {
      const { wrapper } = await story()
      expect(toggles(wrapper).map((toggle) => toggle.text())).toEqual(['Night 1', 'Day 1'])
      expect(toggles(wrapper).map((toggle) => toggle.attributes('aria-expanded'))).toEqual(['false', 'false'])
      expect(wrapper.findAll('.story-facts').every((facts) => facts.attributes('style')?.includes('display: none'))).toBe(true)
    })

    it('opens one entry and reads it fact by fact', async () => {
      const { wrapper } = await story()
      await toggles(wrapper)[0]?.trigger('click')
      expect(wrapper.findAll('.story-fact').slice(0, 4).map((fact) => fact.text())).toEqual([
        'The wolves targeted Ana.',
        'The Doctor saved Ana.',
        'The Seer inspected Sofi: not a Werewolf.',
        'Nobody died.'
      ])
    })

    it('opens every entry at once with Expand all, and closes them again', async () => {
      const { wrapper } = await story()
      await button(wrapper, 'Expand all')?.trigger('click')
      expect(toggles(wrapper).map((toggle) => toggle.attributes('aria-expanded'))).toEqual(['true', 'true'])
      expect(wrapper.text()).toContain('Ana and Juan voted for Luis.')
      expect(wrapper.text()).toContain('Luis was a Werewolf.')
      await button(wrapper, 'Collapse all')?.trigger('click')
      expect(toggles(wrapper).map((toggle) => toggle.attributes('aria-expanded'))).toEqual(['false', 'false'])
    })
  })

  describe('Awards', () => {
    const award = (id: Award['award'], memberId: string, count: number | null): Award => ({ award: id, memberId, count })

    it('shows the server awards and Chatterbox from the village chat, in award order', async () => {
      const view = playerViewOf({
        players: revealedPlayers(),
        outcome: outcomeOf({ awards: [award('most-suspicious', 'id-Tato', 9), award('worst-liar', 'id-Luis', 2)] })
      })
      const { wrapper } = await mountMatchView(GameView, {
        view,
        preload: false,
        configure: ({ chats }) =>
          chats.withHistory([
            messageOf({ authorId: 'id-Marta' }),
            messageOf({ authorId: 'id-Marta', kind: 'last-words' }),
            messageOf({ authorId: 'id-Pipe' })
          ])
      })
      await useChatStore().loadHistory()
      await wrapper.vm.$nextTick()
      const cards = wrapper.findAll('.award')
      expect(cards.map((card) => card.find('.h3').text())).toEqual(['Most Suspicious', 'Worst Liar', 'Chatterbox'])
      expect(cards[0]?.text()).toContain('9 votes received')
      expect(cards[0]?.text()).toContain('Tato')
      expect(cards[1]?.text()).toContain('Wolf, caught on Day 2')
      expect(cards[2]?.text()).toContain('2 messages')
      expect(cards[2]?.text()).toContain('Marta')
    })

    it('leaves out awards nobody earned, and the section when there are none', async () => {
      const view = playerViewOf({ players: revealedPlayers(), outcome: outcomeOf({ awards: [award('silent-assassin', 'id-Tato', null)] }) })
      const { wrapper } = await mountMatchView(GameView, { view, preload: false })
      expect(wrapper.findAll('.award').map((card) => card.find('.h3').text())).toEqual(['Silent Assassin'])
      const empty = await mountMatchView(GameView, { view: playerViewOf({ players: revealedPlayers(), outcome: outcomeOf() }), preload: false })
      expect(empty.wrapper.find('.awards').exists()).toBe(false)
    })
  })

  describe('Play again', () => {
    const narratorOver = () => narratorViewOf({ players: matchPlayers(), roles, outcome: outcomeOf() })

    it('asks the room to play again when the narrator presses it', async () => {
      const { wrapper, rooms } = await mountMatchView(GameView, { view: narratorOver(), preload: false, memberId: 'id-Nico' })
      await button(wrapper, 'Play again')?.trigger('click')
      expect(rooms.commands()).toContain('playAgain')
    })

    it('is offered to the narrator only', async () => {
      const { wrapper } = await mountMatchView(GameView, { view: playerViewOf({ players: revealedPlayers(), outcome: outcomeOf() }), preload: false })
      expect(button(wrapper, 'Play again')).toBeUndefined()
      expect(wrapper.find('a.btn-secondary').text()).toBe('Leave')
    })

    it('says why it did not work', async () => {
      const { wrapper, rooms } = await mountMatchView(GameView, {
        view: narratorOver(),
        preload: false,
        memberId: 'id-Nico',
        configure: ({ rooms: gateway }) => gateway.answer('playAgain', { ok: false, error: { code: 'game-not-over' } })
      })
      await button(wrapper, 'Play again')?.trigger('click')
      await wrapper.vm.$nextTick()
      expect(rooms.commands()).toContain('playAgain')
      expect(wrapper.find('.err').text()).toContain('The game is still going')
    })
  })
})
