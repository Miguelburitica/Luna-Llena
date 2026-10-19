import type { ChatMessage, MatchView, NarratorMatchView, RoomSession } from '@luna/contracts'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FixedClock, SeededRandom } from '../../../shared/application/clockAndRandom.fixtures'
import { createSocketKit, type Client } from '../../../shared/infrastructure/socketTestKit.fixtures'
import { START_TIME } from '@luna/rules/fixtures'
import { FRIENDS, unwrap } from '../../room/domain/Room.fixtures'

const kit = createSocketKit()
let clock: FixedClock
const tick = () => clock.advanceBy(1000)
const DECK = { werewolf: 2, seer: 1, villager: 3, doctor: 0, witch: 0, hunter: 0, fool: 0, drunk: 0 }
const WINDOW = 15_000

interface Seated {
  readonly client: Client
  readonly session: RoomSession
  readonly views: MatchView[]
  readonly messages: ChatMessage[]
}

const watch = (client: Client) => {
  const views: MatchView[] = []
  const messages: ChatMessage[] = []
  client.on('match:view', (view) => views.push(view))
  client.on('chat:message', (message) => messages.push(message))
  return { views, messages }
}

const eventually = async <T>(find: () => T | undefined): Promise<T> => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const found = find()
    if (found !== undefined) return found
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error('The expected event never arrived')
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

const seatedGame = async () => {
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
  unwrap(await narratorClient.emitWithAck('room:start', {}))
  for (const member of [narrator, ...players]) await eventually(() => member.views[0])
  const roles = (narrator.views[0] as NarratorMatchView).roles
  const holdersOf = (role: string) => players.filter((player) => roles[player.session.memberId] === role)
  return { narrator, players, everyone: [narrator, ...players], holdersOf }
}

const idOf = (member: Seated) => member.session.memberId
const viewWhere = (member: Seated, matches: (view: MatchView) => boolean) =>
  eventually(() => member.views.find(matches))

beforeEach(async () => {
  clock = new FixedClock(START_TIME)
  await kit.start({ clock, random: new SeededRandom(5) })
})

afterEach(async () => {
  await kit.stop()
})

describe('chat socket handlers', () => {
  it('keeps the den secret at night and lets the narrator speak to everyone', async () => {
    const { narrator, players, everyone, holdersOf } = await seatedGame()
    const [luis, tato] = holdersOf('werewolf') as [Seated, Seated]
    const [caro] = holdersOf('villager') as [Seated]
    expect(((await viewWhere(luis, () => true)) as MatchView).chat).toEqual({
      read: ['village', 'wolves'],
      write: ['wolves'],
      lastWordsUntil: null,
      villagePaused: false
    })
    expect((await viewWhere(caro, () => true)).chat).toMatchObject({ read: ['village'], write: [] })
    const sent = unwrap(await luis.client.emitWithAck('chat:send', { channel: 'wolves', text: '  Take Caro tonight  ' }))
    expect(sent).toMatchObject({ channel: 'wolves', kind: 'player', authorId: idOf(luis), text: 'Take Caro tonight', sentAt: START_TIME })
    await eventually(() => tato.messages[0])
    await eventually(() => narrator.messages[0])
    await settle()
    for (const member of players.filter((player) => player !== luis && player !== tato)) {
      expect(member.messages).toEqual([])
    }
    expect(tato.messages).toEqual([sent])
    expect(narrator.messages).toEqual([sent])
    expect(await caro.client.emitWithAck('chat:send', { channel: 'village', text: 'Anyone awake?' })).toEqual({
      ok: false,
      error: { code: 'chat-closed' }
    })
    expect(await caro.client.emitWithAck('chat:send', { channel: 'wolves', text: 'Let me in' })).toEqual({
      ok: false,
      error: { code: 'chat-forbidden' }
    })
    expect(await luis.client.emitWithAck('chat:send', { channel: 'wolves', text: '   ' })).toEqual({
      ok: false,
      error: { code: 'message-invalid' }
    })
    const line = unwrap(
      await narrator.client.emitWithAck('chat:send', { channel: 'village', text: 'The fog is thick tonight. Lock your doors.' })
    )
    expect(line.kind).toBe('narrator')
    for (const member of everyone) await eventually(() => member.messages.find((message) => message.id === line.id))
    expect(luis.messages.map((message) => message.id)).toEqual([sent.id, line.id])
    expect(caro.messages.map((message) => message.id)).toEqual([line.id])
  })

  it('gives the dawn victim last words, pauses the village and restores history after a reload', async () => {
    const { narrator, players, everyone, holdersOf } = await seatedGame()
    const [luis, tato] = holdersOf('werewolf') as [Seated, Seated]
    const [ana, caro] = holdersOf('villager') as [Seated, Seated]
    unwrap(await luis.client.emitWithAck('match:act', { kind: 'hunt', targetId: idOf(ana) }))
    unwrap(await tato.client.emitWithAck('match:act', { kind: 'hunt', targetId: idOf(ana) }))
    const line = unwrap(await narrator.client.emitWithAck('chat:send', { channel: 'village', text: 'Night falls' }))
    tick()
    unwrap(await narrator.client.emitWithAck('match:advance', {}))
    const until = START_TIME + 1000 + WINDOW
    tick()
    const dying = await viewWhere(ana, (view) => view.phase === 'dawn')
    expect(dying.chat).toEqual({ read: ['village', 'ghosts'], write: ['village', 'ghosts'], lastWordsUntil: until, villagePaused: false })
    const waiting = await viewWhere(caro, (view) => view.phase === 'dawn')
    expect(waiting.chat).toEqual({ read: ['village'], write: [], lastWordsUntil: null, villagePaused: true })
    expect(await caro.client.emitWithAck('chat:send', { channel: 'village', text: 'What did he say?' })).toEqual({
      ok: false,
      error: { code: 'chat-closed' }
    })
    const spoken = unwrap(
      await ana.client.emitWithAck('chat:send', { channel: 'village', text: 'It was Tato. Avenge my hat.' })
    )
    expect(spoken).toMatchObject({ kind: 'last-words', authorId: idOf(ana), channel: 'village' })
    for (const member of everyone) await eventually(() => member.messages.find((message) => message.id === spoken.id))
    tick()
    expect(await ana.client.emitWithAck('chat:send', { channel: 'village', text: 'One more thing' })).toEqual({
      ok: false,
      error: { code: 'chat-forbidden' }
    })
    const resumed = await viewWhere(caro, (view) => view.chat.villagePaused === false && view.phase === 'dawn')
    expect(resumed.chat.write).toEqual(['village'])
    const afterLife = await viewWhere(ana, (view) => view.chat.lastWordsUntil === null && view.phase === 'dawn')
    expect(afterLife.chat.write).toEqual(['ghosts'])
    const ghostly = unwrap(await ana.client.emitWithAck('chat:send', { channel: 'ghosts', text: 'Boo' }))
    tick()
    const quiet = players.filter((player) => player !== ana && !holdersOf('werewolf').includes(player))
    await settle()
    for (const living of quiet) expect(living.messages.map((message) => message.id)).not.toContain(ghostly.id)
    unwrap(
      await caro.client.emitWithAck('chat:send', { channel: 'village', text: 'Sofi is being weird on purpose' })
    )
    caro.client.disconnect()
    const reloaded = await kit.newClient()
    unwrap(await reloaded.emitWithAck('room:resume', { code: caro.session.code, token: caro.session.token }))
    const history = unwrap(await reloaded.emitWithAck('chat:history', {}))
    expect(history.map((message) => message.text)).toEqual([
      'Night falls',
      'It was Tato. Avenge my hat.',
      'Sofi is being weird on purpose'
    ])
    expect(history[0]?.id).toBe(line.id)
    const ghostHistory = unwrap(await ana.client.emitWithAck('chat:history', {}))
    expect(ghostHistory.map((message) => message.text)).toEqual([
      'Night falls',
      'It was Tato. Avenge my hat.',
      'Boo',
      'Sofi is being weird on purpose'
    ])
  })

  it('rejects chat from a socket without a session', async () => {
    await seatedGame()
    const stranger = await kit.newClient()
    expect(await stranger.emitWithAck('chat:send', { channel: 'village', text: 'Hi' })).toEqual({
      ok: false,
      error: { code: 'session-invalid' }
    })
    expect(await stranger.emitWithAck('chat:history', {})).toEqual({ ok: false, error: { code: 'session-invalid' } })
  })

  it('rejects chat before a game exists', async () => {
    const client = await kit.newClient()
    unwrap(await client.emitWithAck('room:create', { roomName: 'Los Primos', narratorName: 'Nico' }))
    expect(await client.emitWithAck('chat:history', {})).toEqual({ ok: false, error: { code: 'chat-not-open' } })
    expect(await client.emitWithAck('chat:send', { channel: 'village', text: 'Hi' })).toEqual({
      ok: false,
      error: { code: 'chat-not-open' }
    })
  })
})
