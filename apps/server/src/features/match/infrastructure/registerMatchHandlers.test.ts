import { ROLE_IDS, type MatchView, type NarratorMatchView, type PlayerMatchView, type RoomSession } from '@luna/contracts'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FixedClock, SeededRandom } from '../../../shared/application/clockAndRandom.fixtures'
import { createSocketKit, type Client } from '../../../shared/infrastructure/socketTestKit.fixtures'
import { FRIENDS, unwrap } from '../../room/domain/Room.fixtures'
import { START_TIME } from '../domain/Match.fixtures'

const kit = createSocketKit()
const NAMES = FRIENDS.slice(0, 6)
const DECK = { werewolf: 2, seer: 1, villager: 3, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0 }

interface Seated {
  readonly client: Client
  readonly session: RoomSession
  readonly views: MatchView[]
}

const watchViews = (client: Client): MatchView[] => {
  const views: MatchView[] = []
  client.on('match:view', (view) => views.push(view))
  return views
}

const nextView = async (views: MatchView[], matches: (view: MatchView) => boolean): Promise<MatchView> => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const found = views.find(matches)
    if (found !== undefined) return found
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error('The expected match view never arrived')
}

const seatedGame = async () => {
  const narratorClient = await kit.newClient()
  const narratorSession = unwrap(
    await narratorClient.emitWithAck('room:create', { roomName: 'Los Primos', narratorName: 'Nico' })
  )
  const narrator: Seated = { client: narratorClient, session: narratorSession, views: watchViews(narratorClient) }
  unwrap(await narratorClient.emitWithAck('room:updateSettings', { settings: { deck: DECK } }))
  const players: Seated[] = []
  for (const name of NAMES) {
    const client = await kit.newClient()
    const views = watchViews(client)
    const session = unwrap(await client.emitWithAck('room:join', { code: narratorSession.code, name }))
    unwrap(await client.emitWithAck('room:setReady', { ready: true }))
    players.push({ client, session, views })
  }
  unwrap(await narratorClient.emitWithAck('room:start', {}))
  await nextView(narrator.views, () => true)
  for (const player of players) await nextView(player.views, () => true)
  const roles = (narrator.views[0] as NarratorMatchView).roles
  const holdersOf = (role: string) => players.filter((player) => roles[player.session.memberId] === role)
  const first = players[0] as Seated
  const caro = players[5] as Seated
  return { narrator, players, first, caro, roles, holdersOf }
}

beforeEach(async () => {
  await kit.start({ clock: new FixedClock(START_TIME), random: new SeededRandom(5) })
})

afterEach(async () => {
  await kit.stop()
})

describe('match socket handlers', () => {
  it('sends every player a private view when the room starts', async () => {
    const { narrator, players, roles } = await seatedGame()
    for (const player of players) {
      const view = player.views[0] as PlayerMatchView
      expect(view.perspective).toBe('player')
      expect(view).toMatchObject({ phase: 'night', round: 1, phaseEndsAt: START_TIME + 60_000, serverNow: START_TIME })
      expect(view.you.role).toBe(roles[player.session.memberId])
      expect(view.players.every((seat) => seat.revealedRole === null)).toBe(true)
      expect(view).not.toHaveProperty('roles')
      expect(player.views).toHaveLength(1)
    }
    const others = JSON.stringify(players.map((player) => player.views[0]))
    expect(others).not.toContain('pendingWinner')
    expect(narrator.views[0]).toMatchObject({ perspective: 'narrator', roles, pendingWinner: null })
    expect(Object.keys(roles).sort()).toEqual(players.map((player) => player.session.memberId).sort())
    expect(ROLE_IDS.filter((role) => Object.values(roles).includes(role))).toEqual(['werewolf', 'villager', 'seer'])
  })

  it('lets the wolves see each other and nobody else', async () => {
    const { players, holdersOf } = await seatedGame()
    const [luis, tato] = holdersOf('werewolf') as [Seated, Seated]
    expect((luis.views[0] as PlayerMatchView).you.packIds).toEqual([tato.session.memberId])
    expect((tato.views[0] as PlayerMatchView).you.packIds).toEqual([luis.session.memberId])
    for (const villager of players.filter((player) => !holdersOf('werewolf').includes(player))) {
      expect((villager.views[0] as PlayerMatchView).you.packIds).toEqual([])
    }
  })

  it('lets the narrator advance, kill and end the game', async () => {
    const { narrator, first, roles, holdersOf } = await seatedGame()
    unwrap(await narrator.client.emitWithAck('match:advance', {}))
    const dawn = await nextView(first.views, (view) => view.phase === 'dawn')
    expect(dawn.round).toBe(1)

    for (const wolf of holdersOf('werewolf')) {
      unwrap(await narrator.client.emitWithAck('match:setAlive', { memberId: wolf.session.memberId, alive: false }))
    }
    const asked = await nextView(narrator.views, (view) => view.perspective === 'narrator' && view.pendingWinner === 'village')
    expect(asked.players.filter((seat) => !seat.alive)).toHaveLength(2)

    unwrap(await narrator.client.emitWithAck('match:endGame', {}))
    const over = await nextView(first.views, (view) => view.outcome !== null)
    expect(over.outcome).toEqual({ winner: 'village' })
    expect(Object.fromEntries(over.players.map((seat) => [seat.id, seat.revealedRole]))).toEqual(roles)
    expect(await narrator.client.emitWithAck('match:advance', {})).toEqual({ ok: false, error: { code: 'match-over' } })
  })

  it('rejects a player advancing the phase and a socket without a session', async () => {
    const { first } = await seatedGame()
    expect(await first.client.emitWithAck('match:advance', {})).toEqual({ ok: false, error: { code: 'not-narrator' } })
    const stranger = await kit.newClient()
    expect(await stranger.emitWithAck('match:sync', {})).toEqual({ ok: false, error: { code: 'session-invalid' } })
  })

  it('adds time through the extend command', async () => {
    const { narrator, first } = await seatedGame()
    unwrap(await narrator.client.emitWithAck('match:extendTimer', {}))
    const extended = await nextView(first.views, (view) => view.phaseEndsAt === START_TIME + 90_000)
    expect(extended.phase).toBe('night')
  })

  it('returns the same role after a reload through resume and sync', async () => {
    const { narrator, caro, roles } = await seatedGame()
    unwrap(await narrator.client.emitWithAck('match:advance', {}))
    caro.client.disconnect()
    const reloaded = await kit.newClient()
    unwrap(await reloaded.emitWithAck('room:resume', { code: caro.session.code, token: caro.session.token }))
    const view = unwrap(await reloaded.emitWithAck('match:sync', {})) as PlayerMatchView
    expect(view.you.role).toBe(roles[caro.session.memberId])
    expect(view).toMatchObject({ phase: 'dawn', round: 1 })
  })

  it('keeps the seat of a player who tries to leave mid-game', async () => {
    const { first } = await seatedGame()
    expect(await first.client.emitWithAck('room:leave', {})).toEqual({
      ok: false,
      error: { code: 'game-already-started' }
    })
  })
})
