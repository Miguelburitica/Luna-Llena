import type { MatchView, NarratorMatchView, RoomSession, RoomSnapshot } from '@luna/contracts'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FixedClock, SeededRandom } from '../application/clockAndRandom.fixtures'
import { START_TIME } from '../../features/match/domain/Match.fixtures'
import { FRIENDS, unwrap } from '../../features/room/domain/Room.fixtures'
import { createSocketKit, type Client } from './socketTestKit.fixtures'

const kit = createSocketKit()
const DECK = { werewolf: 2, seer: 1, villager: 3, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0 }

interface Seated {
  readonly client: Client
  readonly session: RoomSession
  readonly views: MatchView[]
  readonly snapshots: RoomSnapshot[]
}

const watch = (client: Client) => {
  const views: MatchView[] = []
  const snapshots: RoomSnapshot[] = []
  client.on('match:view', (view) => views.push(view))
  client.on('room:snapshot', (snapshot) => snapshots.push(snapshot))
  return { views, snapshots }
}

const eventually = async <T>(find: () => T | undefined): Promise<T> => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const found = find()
    if (found !== undefined) return found
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error('The expected event never arrived')
}

const lastLobby = (member: Seated) => {
  const latest = member.snapshots.at(-1)
  return latest?.status === 'lobby' ? latest : undefined
}

const seatedRoom = async () => {
  const narratorClient = await kit.newClient()
  const narratorSession = unwrap(
    await narratorClient.emitWithAck('room:create', { roomName: 'Los Primos', narratorName: 'Nico' })
  )
  const narrator: Seated = { client: narratorClient, session: narratorSession, ...watch(narratorClient) }
  unwrap(await narratorClient.emitWithAck('room:updateSettings', { settings: { deck: DECK } }))
  const players: Seated[] = []
  for (const name of FRIENDS.slice(0, 6)) {
    const client = await kit.newClient()
    const watched = watch(client)
    const session = unwrap(await client.emitWithAck('room:join', { code: narratorSession.code, name }))
    unwrap(await client.emitWithAck('room:setReady', { ready: true }))
    players.push({ client, session, ...watched })
  }
  return { narrator, players, everyone: [narrator, ...players] }
}

beforeEach(async () => {
  await kit.start({ clock: new FixedClock(START_TIME), random: new SeededRandom(5) })
})

afterEach(async () => {
  await kit.stop()
})

describe('end of game over sockets', () => {
  it('plays to the end, shares the story and awards, plays again and starts with a fresh chat', async () => {
    const { narrator, players, everyone } = await seatedRoom()
    unwrap(await narrator.client.emitWithAck('room:start', {}))
    for (const member of everyone) await eventually(() => member.views[0])
    const roles = (narrator.views[0] as NarratorMatchView).roles
    const idOf = (member: Seated) => member.session.memberId
    const wolves = players.filter((player) => roles[idOf(player)] === 'werewolf')
    const villagers = players.filter((player) => roles[idOf(player)] !== 'werewolf')
    const [caughtWolf, otherWolf] = wolves as [Seated, Seated]
    const advance = async () => unwrap(await narrator.client.emitWithAck('match:advance', {}))

    expect(await narrator.client.emitWithAck('room:playAgain', {})).toEqual({ ok: false, error: { code: 'game-not-over' } })
    expect(await players[0]?.client.emitWithAck('room:playAgain', {})).toEqual({ ok: false, error: { code: 'not-narrator' } })

    await advance()
    await advance()
    const spoken = unwrap(await (villagers[0] as Seated).client.emitWithAck('chat:send', { channel: 'village', text: 'Es Luis' }))
    expect(unwrap(await (villagers[1] as Seated).client.emitWithAck('chat:history', {}))).toEqual([spoken])
    await advance()
    for (const villager of villagers) {
      unwrap(await villager.client.emitWithAck('match:vote', { targetId: idOf(caughtWolf) }))
    }
    await advance()
    unwrap(await narrator.client.emitWithAck('match:setAlive', { memberId: idOf(otherWolf), alive: false }))
    unwrap(await narrator.client.emitWithAck('match:endGame', {}))

    for (const member of everyone) {
      const over = await eventually(() => member.views.find((view) => view.outcome !== null))
      expect(over.outcome?.winner).toBe('village')
      expect(over.outcome?.timeline.map((entry) => entry.kind)).toEqual(['night', 'vote', 'narrator'])
      expect(over.outcome?.timeline[1]).toMatchObject({
        verdict: { executedId: idOf(caughtWolf), tally: [{ voterIds: expect.arrayContaining(villagers.map(idOf)) }] }
      })
      expect(over.outcome?.awards).toEqual([
        { award: 'most-suspicious', memberId: idOf(caughtWolf), count: villagers.length },
        { award: 'worst-liar', memberId: idOf(caughtWolf), count: 1 },
        { award: 'silent-assassin', memberId: idOf(otherWolf), count: null }
      ])
    }

    expect(await players[0]?.client.emitWithAck('room:playAgain', {})).toEqual({ ok: false, error: { code: 'not-narrator' } })
    unwrap(await narrator.client.emitWithAck('room:playAgain', {}))
    for (const member of everyone) {
      const lobby = await eventually(() => lastLobby(member))
      expect(lobby.members.map((seat) => seat.name)).toEqual(['Nico', ...FRIENDS.slice(0, 6)])
      expect(lobby.members.every((seat) => !seat.ready)).toBe(true)
    }
    expect(await narrator.client.emitWithAck('match:sync', {})).toEqual({ ok: false, error: { code: 'match-not-found' } })

    const lateJoiner = await kit.newClient()
    expect(unwrap(await lateJoiner.emitWithAck('room:lookUp', { code: narrator.session.code }))).toMatchObject({
      playerCount: 6,
      acceptingPlayers: true
    })

    for (const player of players) unwrap(await player.client.emitWithAck('room:setReady', { ready: true }))
    const viewsBefore = players.map((player) => player.views.length)
    unwrap(await narrator.client.emitWithAck('room:start', {}))
    await Promise.all(players.map((player, index) => eventually(() => (player.views.length > (viewsBefore[index] ?? 0) ? true : undefined))))
    for (const player of players) {
      expect(unwrap(await player.client.emitWithAck('chat:history', {}))).toEqual([])
    }
    expect(unwrap(await narrator.client.emitWithAck('chat:history', {}))).toEqual([])
  })
})
