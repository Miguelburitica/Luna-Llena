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

const seatedGame = async (deck: Record<string, number> = DECK, names: readonly string[] = NAMES) => {
  const narratorClient = await kit.newClient()
  const narratorSession = unwrap(
    await narratorClient.emitWithAck('room:create', { roomName: 'Los Primos', narratorName: 'Nico' })
  )
  const narrator: Seated = { client: narratorClient, session: narratorSession, views: watchViews(narratorClient) }
  unwrap(await narratorClient.emitWithAck('room:updateSettings', { settings: { deck } }))
  const players: Seated[] = []
  for (const name of names) {
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
  const caro = players[names.length - 1] as Seated
  return { narrator, players, first, caro, roles, holdersOf }
}

beforeEach(async () => {
  await kit.start({ clock: new FixedClock(START_TIME), random: new SeededRandom(5) })
})

afterEach(async () => {
  await kit.stop()
})

const HUNTER_DECK = { werewolf: 2, seer: 0, villager: 3, doctor: 0, witch: 0, hunter: 1, fool: 0, drunk: 0 }

const NIGHT_DECK = { werewolf: 2, seer: 1, villager: 2, doctor: 1, witch: 1, hunter: 0, fool: 0, drunk: 0 }

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
    expect(over.outcome).toMatchObject({ winner: 'village' })
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

  it('plays a full night and tells every member the dawn result', async () => {
    const { narrator, players, holdersOf } = await seatedGame(NIGHT_DECK, FRIENDS.slice(0, 7))
    const [luis, tato] = holdersOf('werewolf') as [Seated, Seated]
    const [ana, pipe] = holdersOf('villager') as [Seated, Seated]
    const [marta] = holdersOf('seer') as [Seated]
    const [doctor] = holdersOf('doctor') as [Seated]
    const [witch] = holdersOf('witch') as [Seated]
    const idOf = (player: Seated) => player.session.memberId
    const act = (player: Seated, input: Parameters<Client['emitWithAck']>[1]) =>
      player.client.emitWithAck('match:act', input as never)

    unwrap(await act(luis, { kind: 'hunt', targetId: idOf(ana) }))
    unwrap(await act(tato, { kind: 'hunt', targetId: idOf(ana) }))
    unwrap(await act(doctor, { kind: 'protect', targetId: idOf(pipe) }))
    unwrap(await act(marta, { kind: 'inspect', targetId: idOf(luis) }))
    unwrap(await act(witch, { kind: 'potions', heal: false, poisonTargetId: idOf(pipe) }))
    unwrap(await act(ana, { kind: 'suspect', targetId: idOf(tato) }))
    unwrap(await act(pipe, { kind: 'suspect', targetId: idOf(ana) }))
    expect(await act(marta, { kind: 'inspect', targetId: idOf(tato) })).toEqual({
      ok: false,
      error: { code: 'already-inspected' }
    })
    expect(await act(ana, { kind: 'hunt', targetId: idOf(pipe) })).toEqual({
      ok: false,
      error: { code: 'not-your-action' }
    })

    const seerNight = await nextView(marta.views, (view) => JSON.stringify(view).includes('"isWolf":true'))
    expect((seerNight as PlayerMatchView).you.night).toMatchObject({ vision: { targetId: idOf(luis), isWolf: true } })
    const wolfNight = await nextView(luis.views, (view) => JSON.stringify(view).includes('"packVictimId":"'))
    expect((wolfNight as PlayerMatchView).you.night).toMatchObject({ packVictimId: idOf(ana) })
    const preview = await nextView(narrator.views, (view) => view.perspective === 'narrator' && view.night?.waitingOn.length === 0)
    expect((preview as NarratorMatchView).night?.preview.deaths).toEqual([idOf(ana), idOf(pipe)])

    const others = players.filter((player) => player !== marta)
    for (const player of others) {
      const views = JSON.stringify(player.views)
      expect(views).not.toContain('isWolf')
      if (player !== luis && player !== tato) expect(views).not.toContain('packPicks')
    }

    unwrap(await narrator.client.emitWithAck('match:advance', {}))
    for (const member of [narrator, ...players]) {
      const dawn = await nextView(member.views, (view) => view.phase === 'dawn')
      expect(dawn.dawn).toEqual({ round: 1, deaths: [idOf(ana), idOf(pipe)] })
      expect(dawn.players.filter((seat) => !seat.alive).map((seat) => seat.id)).toEqual([idOf(ana), idOf(pipe)])
    }
    const afterDawn = (await nextView(marta.views, (view) => view.phase === 'dawn')) as PlayerMatchView
    expect(afterDawn.you.night).toBeNull()
    expect(afterDawn.you.visions).toEqual([{ round: 1, targetId: idOf(luis), isWolf: true }])
  })

  it('plays a vote, an execution and the Hunter revenge, telling each member only what they may know', async () => {
    const { narrator, players, holdersOf } = await seatedGame(HUNTER_DECK)
    const [hunter] = holdersOf('hunter') as [Seated]
    const [luis] = holdersOf('werewolf') as [Seated]
    const idOf = (player: Seated) => player.session.memberId
    const everyone = [narrator, ...players]
    for (let step = 0; step < 3; step += 1) unwrap(await narrator.client.emitWithAck('match:advance', {}))
    await nextView(hunter.views, (view) => view.phase === 'vote')

    expect(await luis.client.emitWithAck('match:vote', { targetId: idOf(luis) })).toEqual({
      ok: false,
      error: { code: 'target-invalid' }
    })
    const voters = players.filter((player) => player !== hunter)
    for (const voter of voters) unwrap(await voter.client.emitWithAck('match:vote', { targetId: idOf(hunter) }))
    unwrap(await luis.client.emitWithAck('match:lockVote', {}))
    expect(await luis.client.emitWithAck('match:vote', { targetId: null })).toEqual({
      ok: false,
      error: { code: 'vote-locked' }
    })

    const progress = await nextView(hunter.views, (view) => view.voting?.locked === 1 && view.voting.voted === voters.length)
    expect(progress.voting).toEqual({ voters: 6, voted: 5, locked: 1 })
    for (const player of players) {
      const open = await nextView(player.views, (view) => view.voting?.locked === 1 && view.voting.voted === voters.length)
      expect(open).not.toHaveProperty('votes')
      expect((open as PlayerMatchView).you.vote).toEqual(
        player === hunter
          ? { targetId: null, locked: false }
          : { targetId: idOf(hunter), locked: player === luis }
      )
    }
    const watched = (await nextView(narrator.views, (view) => view.voting?.locked === 1 && view.voting.voted === voters.length)) as NarratorMatchView
    expect(watched.votes?.[idOf(luis)]).toEqual({ targetId: idOf(hunter), locked: true })

    unwrap(await narrator.client.emitWithAck('match:advance', {}))
    for (const member of everyone) {
      const executed = await nextView(member.views, (view) => view.phase === 'execution' && view.revenge !== null)
      expect(executed.verdict).toMatchObject({ executedId: idOf(hunter), tie: false, foolWins: false })
      expect(executed.verdict?.tally).toEqual([
        { targetId: idOf(hunter), votes: voters.length, voterIds: expect.arrayContaining(voters.map(idOf)) }
      ])
      expect(executed.revenge).toEqual({ hunterId: idOf(hunter), targetId: null, pending: true })
      expect(executed.voting).toBeNull()
      expect(executed.players.find((seat) => seat.id === idOf(hunter))).toEqual({
        id: idOf(hunter),
        alive: false,
        revealedRole: 'hunter'
      })
    }
    expect(await narrator.client.emitWithAck('match:advance', {})).toEqual({
      ok: false,
      error: { code: 'revenge-pending' }
    })
    expect(await luis.client.emitWithAck('match:avenge', { targetId: idOf(luis) })).toEqual({
      ok: false,
      error: { code: 'no-revenge' }
    })
    expect(await hunter.client.emitWithAck('match:avenge', { targetId: idOf(hunter) })).toEqual({
      ok: false,
      error: { code: 'target-invalid' }
    })

    unwrap(await hunter.client.emitWithAck('match:avenge', { targetId: idOf(luis) }))
    for (const member of everyone) {
      const avenged = await nextView(member.views, (view) => view.revenge?.pending === false)
      expect(avenged.revenge).toEqual({ hunterId: idOf(hunter), targetId: idOf(luis), pending: false })
      expect(avenged.players.find((seat) => seat.id === idOf(luis))).toMatchObject({ alive: false, revealedRole: 'werewolf' })
    }
    unwrap(await narrator.client.emitWithAck('match:advance', {}))
    const night = await nextView(narrator.views, (view) => view.phase === 'night' && view.round === 2)
    expect(night).toMatchObject({ verdict: null, revenge: null })
  })

  it('lets the narrator skip a pending shot', async () => {
    const { narrator, holdersOf } = await seatedGame(HUNTER_DECK)
    const [hunter] = holdersOf('hunter') as [Seated]
    unwrap(await narrator.client.emitWithAck('match:setAlive', { memberId: hunter.session.memberId, alive: false }))
    await nextView(narrator.views, (view) => view.revenge?.pending === true)
    unwrap(await narrator.client.emitWithAck('match:skipRevenge', {}))
    await nextView(narrator.views, (view) => view.revenge?.pending === false)
    unwrap(await narrator.client.emitWithAck('match:advance', {}))
    expect(await narrator.client.emitWithAck('match:skipRevenge', {})).toEqual({ ok: false, error: { code: 'no-revenge' } })
  })
})

