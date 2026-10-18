import { describe, expect, it } from 'vitest'
import { asNarrator, asPlayer, createMatchKit, deckOf, NARRATOR_ID, openingOf, PLAYER_IDS, START_TIME, unwrap } from './matchUseCases.fixtures'

describe('StartMatch', () => {
  it('deals one card per player and publishes a view to every member at night 1', async () => {
    const { publisher, startMatch } = createMatchKit()
    const { roles } = await startMatch()
    expect(publisher.batches).toHaveLength(1)
    expect(publisher.latest.map((entry) => entry.memberId)).toEqual([NARRATOR_ID, ...PLAYER_IDS.slice(0, 7)])
    expect(Object.keys(roles)).toEqual(PLAYER_IDS.slice(0, 7))
    for (const { view } of publisher.latest) {
      expect(view).toMatchObject({ phase: 'night', round: 1, phaseEndsAt: START_TIME + 60_000, serverNow: START_TIME })
      expect(view.players.every((player) => player.alive)).toBe(true)
    }
  })

  it('gives the narrator no card', async () => {
    const { startMatch } = createMatchKit()
    const { roles } = await startMatch()
    expect(roles).not.toHaveProperty(NARRATOR_ID)
  })
})

describe('Role secrecy', () => {
  it('shows a villager only their own role', async () => {
    const { publisher, startMatch } = createMatchKit()
    const { holderOf } = await startMatch({
      playerIds: PLAYER_IDS.slice(0, 6),
      deck: deckOf({ werewolf: 1, villager: 5 })
    })
    const ana = holderOf('villager')
    const view = asPlayer(publisher.latestFor(ana))
    expect(view.you).toEqual({ role: 'villager', team: 'village', packIds: [] })
    expect(view.players.map((player) => player.revealedRole)).toEqual(Array(6).fill(null))
    expect(JSON.stringify(view)).not.toContain('"roles"')
  })

  it('lets the werewolves see each other and nobody else', async () => {
    const { publisher, startMatch } = createMatchKit()
    const { holdersOf, holderOf } = await startMatch()
    const [luis, tato] = holdersOf('werewolf') as [string, string]
    expect(asPlayer(publisher.latestFor(luis)).you).toEqual({ role: 'werewolf', team: 'wolves', packIds: [tato] })
    expect(asPlayer(publisher.latestFor(tato)).you).toEqual({ role: 'werewolf', team: 'wolves', packIds: [luis] })
    expect(asPlayer(publisher.latestFor(holderOf('seer'))).you.packIds).toEqual([])
  })

  it('never shows another player their role in any view field', async () => {
    const { publisher, startMatch } = createMatchKit()
    const { roles } = await startMatch()
    for (const [memberId, role] of Object.entries(roles)) {
      const view = asPlayer(publisher.latestFor(memberId))
      expect(view.you.role).toBe(role)
      expect(view.players.every((player) => player.revealedRole === null)).toBe(true)
    }
  })

  it('shows the narrator every true role and the pending winner', async () => {
    const { publisher, startMatch } = createMatchKit()
    const { roles } = await startMatch({ playerIds: PLAYER_IDS.slice(0, 8), deck: deckOf({ werewolf: 2, drunk: 1, seer: 1, villager: 4 }) })
    const view = asNarrator(publisher.latestFor(NARRATOR_ID))
    expect(view.roles).toEqual(roles)
    expect(Object.values(view.roles).filter((role) => role === 'drunk')).toHaveLength(1)
    expect(view.pendingWinner).toBeNull()
  })

  it('shows the Drunk the Seer card and the Seer team', async () => {
    const { publisher, startMatch } = createMatchKit()
    const { holderOf } = await startMatch({
      playerIds: PLAYER_IDS.slice(0, 6),
      deck: deckOf({ werewolf: 1, drunk: 1, villager: 4 })
    })
    const caro = holderOf('drunk')
    expect(asPlayer(publisher.latestFor(caro)).you).toEqual({ role: 'seer', team: 'village', packIds: [] })
  })
})

describe('Alive and dead', () => {
  it('shows every member that the narrator marked someone dead', async () => {
    const { useCases, publisher, narrator, startMatch } = createMatchKit()
    const { holderOf } = await startMatch()
    const juan = holderOf('fool')
    unwrap(await useCases.setAlive.execute(narrator, { memberId: juan, alive: false }))
    for (const { view } of publisher.latest) {
      expect(view.players.find((player) => player.id === juan)?.alive).toBe(false)
    }
  })

  it('reveals the true role of the dead when the house rule is on', async () => {
    const { useCases, publisher, narrator, startMatch } = createMatchKit()
    const { holderOf } = await startMatch({ revealRoleOnDeath: true })
    const juan = holderOf('doctor')
    unwrap(await useCases.setAlive.execute(narrator, { memberId: juan, alive: false }))
    for (const { view } of publisher.latest) {
      expect(view.players.find((player) => player.id === juan)?.revealedRole).toBe('doctor')
      expect(view.players.filter((player) => player.revealedRole !== null)).toHaveLength(1)
    }
  })

  it('reveals the Drunk as the Drunk when a dead Drunk is revealed', async () => {
    const { useCases, publisher, narrator, startMatch } = createMatchKit()
    const { holderOf } = await startMatch({
      playerIds: PLAYER_IDS.slice(0, 6),
      deck: deckOf({ werewolf: 1, drunk: 1, villager: 4 })
    })
    const caro = holderOf('drunk')
    unwrap(await useCases.setAlive.execute(narrator, { memberId: caro, alive: false }))
    expect(publisher.latestFor(holderOf('werewolf')).players.find((player) => player.id === caro)?.revealedRole).toBe('drunk')
  })

  it('keeps the role secret when the house rule is off', async () => {
    const { useCases, publisher, narrator, startMatch } = createMatchKit()
    const { holderOf } = await startMatch({ revealRoleOnDeath: false })
    const juan = holderOf('doctor')
    unwrap(await useCases.setAlive.execute(narrator, { memberId: juan, alive: false }))
    const others = publisher.latest.filter((entry) => entry.memberId !== NARRATOR_ID)
    for (const { view } of others) {
      const dead = view.players.find((player) => player.id === juan)
      expect(dead).toEqual({ id: juan, alive: false, revealedRole: null })
    }
  })

  it('rejects an unknown member and publishes nothing', async () => {
    const { useCases, publisher, narrator, startMatch } = createMatchKit()
    await startMatch()
    const published = publisher.batches.length
    expect(await useCases.setAlive.execute(narrator, { memberId: 'ghost', alive: false })).toEqual({
      ok: false,
      error: { code: 'member-not-found' }
    })
    expect(publisher.batches).toHaveLength(published)
  })
})

describe('Phases', () => {
  it('shows Night 2 to everyone after five advances and recomputes the countdown from the clock', async () => {
    const { useCases, publisher, narrator, clock, startMatch } = createMatchKit()
    await startMatch()
    for (let step = 0; step < 5; step += 1) {
      clock.advanceBy(1_000)
      unwrap(await useCases.advancePhase.execute(narrator))
    }
    for (const { view } of publisher.latest) {
      expect(view).toMatchObject({ phase: 'night', round: 2, phaseEndsAt: START_TIME + 5_000 + 60_000, serverNow: START_TIME + 5_000 })
    }
  })

  it('rejects a player advancing the phase', async () => {
    const { useCases, publisher, actorOf, startMatch } = createMatchKit()
    await startMatch()
    const published = publisher.batches.length
    expect(await useCases.advancePhase.execute(actorOf('p1'))).toEqual({ ok: false, error: { code: 'not-narrator' } })
    expect(publisher.batches).toHaveLength(published)
  })

  it('adds 30 seconds during a vote with 10 seconds left', async () => {
    const { useCases, publisher, narrator, clock, startMatch } = createMatchKit()
    await startMatch()
    for (let step = 0; step < 3; step += 1) unwrap(await useCases.advancePhase.execute(narrator))
    clock.advanceBy(50_000)
    unwrap(await useCases.extendTimer.execute(narrator))
    const view = publisher.latestFor('p1')
    expect(view.phase).toBe('vote')
    expect((view.phaseEndsAt ?? 0) - view.serverNow).toBe(40_000)
  })

  it('has no countdown on a manual day', async () => {
    const { useCases, publisher, narrator, startMatch } = createMatchKit()
    await startMatch({ timers: { night: 60, day: 0, vote: 60 } })
    unwrap(await useCases.advancePhase.execute(narrator))
    unwrap(await useCases.advancePhase.execute(narrator))
    expect(publisher.latestFor('p1')).toMatchObject({ phase: 'day', phaseEndsAt: null })
    expect(await useCases.extendTimer.execute(narrator)).toEqual({ ok: false, error: { code: 'timer-not-running' } })
  })
})

describe('Win detection and ending', () => {
  it('asks the narrator alone to end the game when the last werewolf falls', async () => {
    const { useCases, publisher, narrator, startMatch } = createMatchKit()
    const { holdersOf } = await startMatch()
    for (const wolf of holdersOf('werewolf')) unwrap(await useCases.setAlive.execute(narrator, { memberId: wolf, alive: false }))
    expect(asNarrator(publisher.latestFor(NARRATOR_ID)).pendingWinner).toBe('village')
    for (const { memberId, view } of publisher.latest) {
      if (memberId !== NARRATOR_ID) expect(view).not.toHaveProperty('pendingWinner')
    }
  })

  it('asks for a wolf win when the pack equals the rest', async () => {
    const { useCases, publisher, narrator, startMatch } = createMatchKit()
    const { roles, holdersOf } = await startMatch()
    const villagers = Object.keys(roles).filter((id) => !holdersOf('werewolf').includes(id))
    for (const id of villagers.slice(0, 3)) unwrap(await useCases.setAlive.execute(narrator, { memberId: id, alive: false }))
    expect(asNarrator(publisher.latestFor(NARRATOR_ID)).pendingWinner).toBe('wolves')
  })

  it('clears the question when the narrator keeps playing', async () => {
    const { useCases, publisher, narrator, startMatch } = createMatchKit()
    const { holdersOf } = await startMatch()
    for (const wolf of holdersOf('werewolf')) unwrap(await useCases.setAlive.execute(narrator, { memberId: wolf, alive: false }))
    unwrap(await useCases.keepPlaying.execute(narrator))
    expect(asNarrator(publisher.latestFor(NARRATOR_ID)).pendingWinner).toBeNull()
  })

  it('shows everyone the winner and all roles when the narrator ends the game', async () => {
    const { useCases, publisher, narrator, startMatch } = createMatchKit()
    const { roles, holdersOf } = await startMatch({
      playerIds: PLAYER_IDS.slice(0, 6),
      deck: deckOf({ werewolf: 1, drunk: 1, villager: 4 })
    })
    for (const wolf of holdersOf('werewolf')) unwrap(await useCases.setAlive.execute(narrator, { memberId: wolf, alive: false }))
    unwrap(await useCases.endGame.execute(narrator))
    for (const { memberId, view } of publisher.latest) {
      expect(view.outcome).toEqual({ winner: 'village' })
      if (memberId === NARRATOR_ID) continue
      expect(Object.fromEntries(view.players.map((player) => [player.id, player.revealedRole]))).toEqual(roles)
    }
    expect(Object.values(roles)).toContain('drunk')
  })

  it('rejects ending too early', async () => {
    const { useCases, narrator, startMatch } = createMatchKit()
    await startMatch()
    expect(await useCases.endGame.execute(narrator)).toEqual({ ok: false, error: { code: 'no-winner-yet' } })
  })

  it('rejects every narrator command once the match is over', async () => {
    const { useCases, narrator, startMatch } = createMatchKit()
    const { holdersOf } = await startMatch()
    for (const wolf of holdersOf('werewolf')) unwrap(await useCases.setAlive.execute(narrator, { memberId: wolf, alive: false }))
    unwrap(await useCases.endGame.execute(narrator))
    const over = { ok: false, error: { code: 'match-over' } }
    expect(await useCases.advancePhase.execute(narrator)).toEqual(over)
    expect(await useCases.extendTimer.execute(narrator)).toEqual(over)
    expect(await useCases.setAlive.execute(narrator, { memberId: 'p1', alive: true })).toEqual(over)
    expect(await useCases.keepPlaying.execute(narrator)).toEqual(over)
    expect(await useCases.endGame.execute(narrator)).toEqual(over)
  })
})

describe('Access', () => {
  it('answers match-not-found for an unknown match', async () => {
    const { useCases, narrator } = createMatchKit()
    expect(await useCases.syncMatch.execute(narrator)).toEqual({ ok: false, error: { code: 'match-not-found' } })
    expect(await useCases.advancePhase.execute(narrator)).toEqual({ ok: false, error: { code: 'match-not-found' } })
  })

  it('answers session-invalid for someone who is not in the match', async () => {
    const { useCases, actorOf, startMatch } = createMatchKit()
    await startMatch()
    expect(await useCases.syncMatch.execute(actorOf('stranger'))).toEqual({ ok: false, error: { code: 'session-invalid' } })
    expect(await useCases.advancePhase.execute(actorOf('stranger'))).toEqual({ ok: false, error: { code: 'session-invalid' } })
  })
})

describe('SyncMatch', () => {
  it('returns only the caller view and publishes nothing', async () => {
    const { useCases, publisher, actorOf, clock, startMatch } = createMatchKit()
    const { holderOf } = await startMatch()
    const published = publisher.batches.length
    clock.advanceBy(7_000)
    const marta = holderOf('seer')
    const view = unwrap(await useCases.syncMatch.execute(actorOf(marta)))
    expect(asPlayer(view).you.role).toBe('seer')
    expect(view.serverNow).toBe(START_TIME + 7_000)
    expect(publisher.batches).toHaveLength(published)
  })

  it('returns the narrator view with every role to the narrator', async () => {
    const { useCases, narrator, startMatch } = createMatchKit()
    const { roles } = await startMatch()
    expect(asNarrator(unwrap(await useCases.syncMatch.execute(narrator))).roles).toEqual(roles)
  })

  it('gives a reloading player the same role and the current phase', async () => {
    const { useCases, actorOf, narrator, startMatch } = createMatchKit()
    const { roles } = await startMatch()
    for (let step = 0; step < 6; step += 1) unwrap(await useCases.advancePhase.execute(narrator))
    const caro = Object.keys(roles)[5] as string
    const view = asPlayer(unwrap(await useCases.syncMatch.execute(actorOf(caro))))
    expect(view.you.role).toBe(roles[caro])
    expect([view.phase, view.round]).toEqual(['dawn', 2])
  })
})

describe('openingOf', () => {
  it('keeps the dealt cards equal to the deck', async () => {
    const { startMatch } = createMatchKit(99)
    const opening = openingOf()
    const { roles } = await startMatch()
    expect(Object.values(roles).sort()).toEqual(
      Object.entries(opening.deck).flatMap(([role, count]) => Array<string>(count).fill(role)).sort()
    )
  })
})
