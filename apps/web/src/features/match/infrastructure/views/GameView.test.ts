import { beforeEach, describe, expect, it, vi } from 'vitest'
import { messageOf } from '@/features/chat/application/ChatGateway.fixtures'
import { snapshotOf } from '@/features/room/domain/snapshot.fixtures'
import { narratorViewOf, outcomeOf, playerViewOf } from '../../application/MatchGateway.fixtures'
import { matchPlayers, mountMatchView } from '../mountMatchView.fixtures'
import GameView from './GameView.vue'

const REVEALED_KEY = 'luna-llena.revealed.LUNA42'

const everyRole = {
  'id-Ana': 'villager',
  'id-Juan': 'doctor',
  'id-Marta': 'seer',
  'id-Luis': 'werewolf',
  'id-Sofi': 'fool',
  'id-Caro': 'drunk',
  'id-Tato': 'werewolf',
  'id-Pipe': 'witch'
} as const

beforeEach(() => sessionStorage.clear())

describe('GameView', () => {
  it('opens on the face-down card, flips to the role and then shows the table', async () => {
    const view = playerViewOf({ players: matchPlayers(), you: { role: 'seer', team: 'village', packIds: [], night: null, visions: [], vote: null, haunt: null } })
    const { wrapper } = await mountMatchView(GameView, { view, preload: false })
    expect(wrapper.find('.rcard-back').exists()).toBe(true)
    await wrapper.find('[aria-label="Reveal your role"]').trigger('click')
    expect(wrapper.find('.rcard-name').text()).toBe('Seer')
    await wrapper.findAll('button').find((button) => button.text() === 'Got it')?.trigger('click')
    expect(wrapper.find('.table').exists()).toBe(true)
    expect(sessionStorage.getItem(REVEALED_KEY)).toBe('true')
  })

  it('shows a Drunk the Seer card', async () => {
    const view = playerViewOf({ players: matchPlayers(), you: { role: 'seer', team: 'village', packIds: [], night: null, visions: [], vote: null, haunt: null } })
    const { wrapper } = await mountMatchView(GameView, { view, preload: false })
    await wrapper.find('[aria-label="Reveal your role"]').trigger('click')
    expect(wrapper.text()).toContain('Seer')
    expect(wrapper.text()).not.toContain('Drunk')
    expect(wrapper.find('.rcard-sticker').text()).toBe('Goo-Eyed Gail')
    expect(wrapper.text()).not.toContain('Hiccup Hugo')
  })

  it('goes straight to the table when this tab already saw the role', async () => {
    sessionStorage.setItem(REVEALED_KEY, 'true')
    const view = playerViewOf({ players: matchPlayers() })
    const { wrapper } = await mountMatchView(GameView, { view, preload: false })
    expect(wrapper.find('.table').exists()).toBe(true)
    expect(wrapper.find('.rcard-back').exists()).toBe(false)
  })

  it('syncs the match once the seat is resumed and follows live views', async () => {
    sessionStorage.setItem(REVEALED_KEY, 'true')
    const view = playerViewOf({ players: matchPlayers(), phase: 'night' })
    const { wrapper, matches } = await mountMatchView(GameView, { view, preload: false })
    expect(matches.commands()).toEqual(['sync'])
    matches.pushView(playerViewOf({ players: matchPlayers(), phase: 'day', round: 1 }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ph-name').text()).toBe('Day')
  })

  it('resumes the stored seat after a reload, then syncs the match and keeps the same role', async () => {
    sessionStorage.setItem(REVEALED_KEY, 'true')
    const view = playerViewOf({ players: matchPlayers(), round: 2, you: { role: 'seer', team: 'village', packIds: [], night: null, visions: [], vote: null, haunt: null } })
    const { wrapper, rooms, matches } = await mountMatchView(GameView, { view, resume: true, preload: false })
    expect(rooms.commands()).toEqual(['resume'])
    expect(matches.commands()).toEqual(['sync'])
    expect(wrapper.find('.ph-sub').text()).toContain('Night 2')
    await wrapper.find('[aria-label="Hold to peek at your role"]').trigger('pointerdown')
    expect(wrapper.find('.rcard-mini small').text()).toBe('Seer')
  })

  it('shows the narrator the dashboard without a role reveal', async () => {
    const view = narratorViewOf({ players: matchPlayers(), roles: everyRole })
    const { wrapper } = await mountMatchView(GameView, { view, memberId: 'id-Nico', preload: false })
    expect(wrapper.find('.dashboard').exists()).toBe(true)
    expect(wrapper.find('.rcard-back').exists()).toBe(false)
  })

  it('shows every role when the game is over, the Drunk included', async () => {
    const view = narratorViewOf({
      players: matchPlayers(),
      roles: everyRole,
      outcome: outcomeOf({ winner: 'village' })
    })
    const { wrapper } = await mountMatchView(GameView, { view, memberId: 'id-Nico', preload: false })
    expect(wrapper.text()).toContain('Village wins!')
    const tiles = wrapper.findAll('.over-tile')
    expect(tiles).toHaveLength(8)
    expect(tiles.find((tile) => tile.text().includes('Caro'))?.text()).toContain('Drunk')
    expect(tiles.find((tile) => tile.text().includes('Luis'))?.text()).toContain('Werewolf')
  })

  it('shows players the roles revealed at the end, even before they saw their own card', async () => {
    const revealed = Object.fromEntries(Object.entries(everyRole).map(([id, role]) => [id, { revealedRole: role }]))
    const view = playerViewOf({
      players: matchPlayers(revealed),
      outcome: outcomeOf({ winner: 'wolves' })
    })
    const { wrapper } = await mountMatchView(GameView, { view, preload: false })
    expect(wrapper.text()).toContain('Wolves win!')
    expect(wrapper.findAll('.over-tile').find((tile) => tile.text().includes('Caro'))?.text()).toContain('Drunk')
    expect(wrapper.find('.rcard-back').exists()).toBe(false)
  })

  it('sends the player back to the lobby when there is no match yet', async () => {
    const { router } = await mountMatchView(GameView, {
      preload: false,
      configure: ({ matches }) => matches.failWith('sync', 'match-not-found')
    })
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/room/LUNA42'))
  })

  it('returns to the lobby when the room reopens and forgets the game', async () => {
    sessionStorage.setItem(REVEALED_KEY, 'true')
    sessionStorage.setItem('luna-llena.fool.LUNA42.2', 'true')
    const view = playerViewOf({ players: matchPlayers(), outcome: outcomeOf({ winner: 'village' }) })
    const { rooms, router, match, chats } = await mountMatchView(GameView, {
      view,
      preload: false,
      configure: ({ chats: gateway }) => gateway.withHistory([messageOf({ text: 'old game' })])
    })
    await vi.waitFor(() => expect(match.view).not.toBeNull())
    rooms.pushSnapshot(snapshotOf({ status: 'lobby' }))
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/room/LUNA42'))
    expect(match.view).toBeNull()
    expect(sessionStorage.getItem(REVEALED_KEY)).toBeNull()
    expect(sessionStorage.getItem('luna-llena.fool.LUNA42.2')).toBeNull()
    expect(chats.commands()).toContain('history')
  })

  it('offers a retry when the village is unreachable', async () => {
    sessionStorage.setItem(REVEALED_KEY, 'true')
    const { wrapper, matches } = await mountMatchView(GameView, {
      view: playerViewOf({ players: matchPlayers() }),
      preload: false,
      configure: ({ matches: gateway }) => gateway.failWith('sync', 'unreachable')
    })
    expect(wrapper.text()).toContain('Lost in the fog')
    matches.responses = {}
    await wrapper.findAll('button').find((button) => button.text() === 'Try again')?.trigger('click')
    await vi.waitFor(() => expect(wrapper.find('.table').exists()).toBe(true))
  })
})
