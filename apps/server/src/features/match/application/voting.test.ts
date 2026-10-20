import { describe, expect, it } from 'vitest'
import { asNarrator, asPlayer, createMatchKit, NARRATOR_ID, PLAYER_IDS, unwrap } from './matchUseCases.fixtures'
import type { MatchOpening } from './ports'

const SEVEN: readonly string[] = PLAYER_IDS.slice(0, 7)

const inSeatOrder = (memberIds: readonly string[]): string[] =>
  [...memberIds].sort((left, right) => SEVEN.indexOf(left) - SEVEN.indexOf(right))

const tallyOf = (entries: ReadonlyArray<{ targetId: string; voterIds: readonly string[] }>, anonymous = false) =>
  entries
    .map(({ targetId, voterIds }) => ({
      targetId,
      votes: voterIds.length,
      voterIds: anonymous ? null : inSeatOrder(voterIds)
    }))
    .sort((left, right) => right.votes - left.votes || SEVEN.indexOf(left.targetId) - SEVEN.indexOf(right.targetId))

const voteKit = async (overrides: Partial<MatchOpening> = {}) => {
  const kit = createMatchKit()
  const game = await kit.startMatch(overrides)
  const [luis, tato] = game.holdersOf('werewolf') as [string, string]
  const people = {
    luis,
    tato,
    marta: game.holderOf('seer'),
    doctor: game.holderOf('doctor'),
    witch: game.holderOf('witch'),
    sofi: game.holderOf('hunter'),
    fool: game.holderOf('fool')
  }
  const advance = async (times = 1) => {
    for (let step = 0; step < times; step += 1) unwrap(await kit.useCases.advancePhase.execute(kit.narrator))
  }
  const cast = async (voterId: string, targetId: string | null) =>
    kit.useCases.castVote.execute(kit.actorOf(voterId), targetId)
  const castAll = async (voterIds: readonly string[], targetId: string) => {
    for (const voterId of voterIds) unwrap(await cast(voterId, targetId))
  }
  const viewOf = (memberId: string) => asPlayer(kit.publisher.latestFor(memberId))
  const narratorView = () => asNarrator(kit.publisher.latestFor(NARRATOR_ID))
  const othersThan = (...excluded: string[]) => SEVEN.filter((memberId) => !excluded.includes(memberId))
  return { ...kit, ...game, people, advance, cast, castAll, viewOf, narratorView, othersThan }
}

const voteOpen = async (overrides: Partial<MatchOpening> = {}) => {
  const game = await voteKit(overrides)
  await game.advance(3)
  return game
}

describe('CastVote and LockVote', () => {
  it('records a first vote that the voter can still change', async () => {
    const { cast, people, viewOf } = await voteOpen()
    unwrap(await cast(people.marta, people.luis))
    expect(viewOf(people.marta).you.vote).toEqual({ targetId: people.luis, locked: false })
    unwrap(await cast(people.marta, people.tato))
    expect(viewOf(people.marta).you.vote).toEqual({ targetId: people.tato, locked: false })
    unwrap(await cast(people.marta, null))
    expect(viewOf(people.marta).you.vote).toEqual({ targetId: null, locked: false })
  })

  it('rejects voting during the night', async () => {
    const { cast, people } = await voteKit()
    expect(await cast(people.marta, people.luis)).toEqual({ ok: false, error: { code: 'not-vote' } })
  })

  it('rejects voting for yourself', async () => {
    const { cast, people } = await voteOpen()
    expect(await cast(people.marta, people.marta)).toEqual({ ok: false, error: { code: 'target-invalid' } })
  })

  it('rejects a dead voter, a dead target and the narrator', async () => {
    const { cast, people, useCases, narrator } = await voteOpen()
    unwrap(await useCases.setAlive.execute(narrator, { memberId: people.doctor, alive: false }))
    expect(await cast(people.doctor, people.luis)).toEqual({ ok: false, error: { code: 'player-dead' } })
    expect(await cast(people.marta, people.doctor)).toEqual({ ok: false, error: { code: 'target-invalid' } })
    expect(await cast(NARRATOR_ID, people.luis)).toEqual({ ok: false, error: { code: 'not-your-action' } })
  })

  it('locks a vote so that it cannot change', async () => {
    const { cast, people, useCases, actorOf, viewOf } = await voteOpen()
    unwrap(await cast(people.marta, people.luis))
    unwrap(await useCases.lockVote.execute(actorOf(people.marta)))
    expect(await cast(people.marta, people.tato)).toEqual({ ok: false, error: { code: 'vote-locked' } })
    expect(await cast(people.marta, null)).toEqual({ ok: false, error: { code: 'vote-locked' } })
    expect(viewOf(people.marta).you.vote).toEqual({ targetId: people.luis, locked: true })
  })

  it('rejects locking without a vote', async () => {
    const { people, useCases, actorOf } = await voteOpen()
    expect(await useCases.lockVote.execute(actorOf(people.marta))).toEqual({
      ok: false,
      error: { code: 'target-invalid' }
    })
  })

  it('rejects members who are not in the match', async () => {
    const { useCases, people } = await voteOpen()
    const stranger = { code: 'LUNA42', memberId: 'stranger' }
    const missing = { code: 'NOPE00', memberId: people.marta }
    expect(await useCases.castVote.execute(stranger, people.luis)).toEqual({ ok: false, error: { code: 'session-invalid' } })
    expect(await useCases.lockVote.execute(stranger)).toEqual({ ok: false, error: { code: 'session-invalid' } })
    expect(await useCases.castVote.execute(missing, people.luis)).toEqual({ ok: false, error: { code: 'match-not-found' } })
  })
})

describe('Secret while open', () => {
  it('tells every player how many voted and nothing about who voted for whom', async () => {
    const { castAll, cast, people, viewOf, publisher } = await voteOpen()
    const before = new Map(SEVEN.map((memberId) => [memberId, viewOf(memberId)]))
    await castAll([people.marta, people.doctor, people.witch, people.sofi], people.luis)
    unwrap(await cast(people.fool, people.tato))
    for (const memberId of SEVEN) {
      const view = viewOf(memberId)
      expect(view.voting).toEqual({ voters: 7, voted: 5, locked: 0 })
      expect(view).not.toHaveProperty('votes')
      const hidden = JSON.stringify({ ...view, voting: null, you: { ...view.you, vote: null } })
      const earlier = before.get(memberId)
      expect(hidden).toBe(JSON.stringify({ ...earlier, voting: null, you: { ...earlier?.you, vote: null } }))
    }
    for (const { memberId, view } of publisher.latest) {
      if (memberId !== NARRATOR_ID) expect(view).not.toHaveProperty('votes')
    }
    expect(viewOf(people.luis).you.vote).toEqual({ targetId: null, locked: false })
    expect(viewOf(people.fool).you.vote).toEqual({ targetId: people.tato, locked: false })
  })

  it('counts locks', async () => {
    const { cast, people, useCases, actorOf, viewOf } = await voteOpen()
    unwrap(await cast(people.marta, people.luis))
    unwrap(await useCases.lockVote.execute(actorOf(people.marta)))
    unwrap(await cast(people.doctor, people.luis))
    expect(viewOf(people.witch).voting).toEqual({ voters: 7, voted: 2, locked: 1 })
  })

  it('shows the narrator every vote and lock live', async () => {
    const { cast, people, useCases, actorOf, narratorView } = await voteOpen()
    unwrap(await cast(people.marta, people.tato))
    unwrap(await useCases.lockVote.execute(actorOf(people.marta)))
    unwrap(await cast(people.doctor, people.luis))
    const { votes, voting } = narratorView()
    expect(voting).toEqual({ voters: 7, voted: 2, locked: 1 })
    expect(votes?.[people.marta]).toEqual({ targetId: people.tato, locked: true })
    expect(votes?.[people.doctor]).toEqual({ targetId: people.luis, locked: false })
    expect(votes?.[people.witch]).toEqual({ targetId: null, locked: false })
    expect(Object.keys(votes ?? {})).toEqual(SEVEN)
  })

  it('shows no vote state outside the vote phase', async () => {
    const { people, viewOf, narratorView, advance, cast } = await voteKit()
    expect(viewOf(people.marta)).toMatchObject({ voting: null, verdict: null, revenge: null, soloWinnerIds: [] })
    expect(viewOf(people.marta).you.vote).toBeNull()
    expect(narratorView().votes).toBeNull()
    await advance(3)
    unwrap(await cast(people.marta, people.luis))
    await advance(1)
    expect(viewOf(people.marta).voting).toBeNull()
    expect(viewOf(people.marta).you.vote).toBeNull()
    expect(narratorView().votes).toBeNull()
  })

  it('shows a dead player no vote', async () => {
    const { people, useCases, narrator, viewOf } = await voteOpen()
    unwrap(await useCases.setAlive.execute(narrator, { memberId: people.marta, alive: false }))
    expect(viewOf(people.marta).you.vote).toBeNull()
    expect(viewOf(people.doctor).voting).toEqual({ voters: 6, voted: 0, locked: 0 })
  })
})

describe('The verdict views', () => {
  it('reveals the tally and the executed role to every member', async () => {
    const { castAll, cast, people, advance, viewOf, narratorView, publisher } = await voteOpen()
    await castAll([people.marta, people.doctor, people.witch, people.sofi], people.luis)
    await castAll([people.fool], people.tato)
    unwrap(await cast(people.tato, people.marta))
    await advance()
    const expected = {
      round: 1,
      tally: tallyOf([
        { targetId: people.luis, voterIds: [people.marta, people.doctor, people.witch, people.sofi] },
        { targetId: people.tato, voterIds: [people.fool] },
        { targetId: people.marta, voterIds: [people.tato] }
      ]),
      executedId: people.luis,
      tie: false,
      foolWins: false
    }
    for (const { view } of publisher.latest) {
      expect(view.verdict).toEqual(expected)
      expect(view.players.find((player) => player.id === people.luis)).toEqual({
        id: people.luis,
        alive: false,
        revealedRole: 'werewolf'
      })
      expect(view.voting).toBeNull()
    }
    expect(viewOf(people.marta).you.vote).toBeNull()
    expect(narratorView().votes).toBeNull()
  })

  it('hides the executed role when the rule is off', async () => {
    const { castAll, people, advance, viewOf } = await voteOpen({ revealRoleOnDeath: false })
    await castAll([people.marta, people.doctor], people.sofi)
    await advance()
    expect(viewOf(people.witch).players.find((player) => player.id === people.sofi)).toMatchObject({
      alive: false,
      revealedRole: null
    })
  })

  it('shows a tie to everyone and executes nobody', async () => {
    const { castAll, people, advance, publisher } = await voteOpen()
    await castAll([people.marta, people.doctor, people.witch], people.luis)
    await castAll([people.sofi, people.fool, people.tato], people.marta)
    await advance()
    for (const { view } of publisher.latest) {
      expect(view.verdict).toMatchObject({ tie: true, executedId: null })
      expect(view.players.every((player) => player.alive)).toBe(true)
    }
  })

  it('executes nobody when nobody voted', async () => {
    const { advance, publisher } = await voteOpen()
    await advance()
    for (const { view } of publisher.latest) {
      expect(view.verdict).toMatchObject({ tally: [], tie: false, executedId: null })
      expect(view.players.every((player) => player.alive)).toBe(true)
    }
  })

  it('shows only the counts when votes are anonymous', async () => {
    const { castAll, people, advance, publisher } = await voteOpen({ anonymousVotes: true })
    await castAll([people.marta, people.doctor], people.luis)
    await castAll([people.witch], people.tato)
    await advance()
    for (const { view } of publisher.latest) {
      expect(view.verdict?.tally).toEqual(
        tallyOf(
          [
            { targetId: people.luis, voterIds: [people.marta, people.doctor] },
            { targetId: people.tato, voterIds: [people.witch] }
          ],
          true
        )
      )
    }
  })

  it('clears the verdict when the next night begins', async () => {
    const { castAll, people, advance, viewOf, narratorView } = await voteOpen()
    await castAll([people.marta], people.luis)
    await advance(2)
    expect(viewOf(people.doctor)).toMatchObject({ phase: 'night', verdict: null, dawn: null })
    expect(narratorView().verdict).toBeNull()
  })

  it('asks the narrator to end the game when the village executes the last werewolf', async () => {
    const { castAll, people, advance, useCases, narrator, narratorView } = await voteOpen()
    unwrap(await useCases.setAlive.execute(narrator, { memberId: people.tato, alive: false }))
    await castAll([people.marta, people.doctor, people.witch], people.luis)
    await advance()
    expect(narratorView().pendingWinner).toBe('village')
  })
})

describe('The Fool', () => {
  it('reveals the Fool to everyone, records the win and keeps playing', async () => {
    const { castAll, people, advance, publisher, othersThan } = await voteOpen({ revealRoleOnDeath: false })
    await castAll(othersThan(people.fool), people.fool)
    await advance()
    for (const { view } of publisher.latest) {
      expect(view.verdict).toMatchObject({ executedId: people.fool, foolWins: true })
      expect(view.soloWinnerIds).toEqual([people.fool])
      expect(view.players.find((player) => player.id === people.fool)).toEqual({
        id: people.fool,
        alive: false,
        revealedRole: 'fool'
      })
      expect(view.outcome).toBeNull()
    }
    const revealed = publisher.latestFor(people.marta).players.filter((player) => player.revealedRole !== null)
    expect(revealed.map((player) => player.id)).toEqual([people.fool])
    expect(asNarrator(publisher.latestFor(NARRATOR_ID)).pendingWinner).toBeNull()
  })

  it('does not let the Fool win when the wolves kill them at night', async () => {
    const { people, useCases, actorOf, advance, publisher } = await voteKit()
    for (const wolf of [people.luis, people.tato]) {
      unwrap(await useCases.actAtNight.execute(actorOf(wolf), { kind: 'hunt', targetId: people.fool }))
    }
    await advance()
    for (const { view } of publisher.latest) {
      expect(view.soloWinnerIds).toEqual([])
      expect(view.verdict).toBeNull()
    }
    expect(publisher.latestFor(people.marta).players.find((player) => player.id === people.fool)).toMatchObject({
      alive: false
    })
  })

  it('lists the Fool beside the winning team at the end', async () => {
    const { castAll, people, advance, useCases, narrator, publisher, roles, othersThan } = await voteOpen()
    await castAll(othersThan(people.fool), people.fool)
    await advance()
    for (const memberId of [people.marta, people.doctor]) {
      unwrap(await useCases.setAlive.execute(narrator, { memberId, alive: false }))
    }
    expect(asNarrator(publisher.latestFor(NARRATOR_ID)).pendingWinner).toBe('wolves')
    unwrap(await useCases.endGame.execute(narrator))
    for (const { view } of publisher.latest) {
      expect(view.outcome).toMatchObject({ winner: 'wolves' })
      expect(view.soloWinnerIds).toEqual([people.fool])
      expect(Object.fromEntries(view.players.map((player) => [player.id, player.revealedRole]))).toEqual(roles)
    }
  })
})

describe('DeclareFoolWin', () => {
  it('records the win of a Fool the narrator killed by hand, reveals the Fool to everyone and keeps playing', async () => {
    const { people, useCases, narrator, publisher, narratorView } = await voteOpen({ revealRoleOnDeath: false })
    unwrap(await useCases.setAlive.execute(narrator, { memberId: people.fool, alive: false }))
    expect(narratorView().foolClaimIds).toEqual([people.fool])
    unwrap(await useCases.declareFoolWin.execute(narrator, { memberId: people.fool }))
    for (const { view } of publisher.latest) {
      expect(view.soloWinnerIds).toEqual([people.fool])
      expect(view.players.find((player) => player.id === people.fool)).toMatchObject({ alive: false, revealedRole: 'fool' })
      expect(view.outcome).toBeNull()
    }
    expect(narratorView().foolClaimIds).toEqual([])
  })

  it('offers nothing for a Fool the wolves killed at night', async () => {
    const { people, useCases, actorOf, advance, narrator, narratorView } = await voteKit()
    for (const wolf of [people.luis, people.tato]) {
      unwrap(await useCases.actAtNight.execute(actorOf(wolf), { kind: 'hunt', targetId: people.fool }))
    }
    await advance()
    expect(narratorView().foolClaimIds).toEqual([])
    expect(await useCases.declareFoolWin.execute(narrator, { memberId: people.fool })).toEqual({
      ok: false,
      error: { code: 'no-fool-win' }
    })
  })

  it('rejects a player calling it', async () => {
    const { people, useCases, narrator, actorOf } = await voteOpen()
    unwrap(await useCases.setAlive.execute(narrator, { memberId: people.fool, alive: false }))
    expect(await useCases.declareFoolWin.execute(actorOf(people.marta), { memberId: people.fool })).toEqual({
      ok: false,
      error: { code: 'not-narrator' }
    })
  })
})

describe('Hunter revenge', () => {
  const hunterKilledAtDawn = async () => {
    const game = await voteKit()
    const { people, useCases, actorOf, advance } = game
    for (const wolf of [people.luis, people.tato]) {
      unwrap(await useCases.actAtNight.execute(actorOf(wolf), { kind: 'hunt', targetId: people.sofi }))
    }
    await advance()
    return game
  }

  it('shows everyone that the Hunter takes aim after a death at dawn', async () => {
    const { people, publisher } = await hunterKilledAtDawn()
    for (const { view } of publisher.latest) {
      expect(view.revenge).toEqual({ hunterId: people.sofi, targetId: null, pending: true })
    }
  })

  it('kills the pick at once and tells every member', async () => {
    const { people, useCases, actorOf, publisher } = await hunterKilledAtDawn()
    unwrap(await useCases.takeRevenge.execute(actorOf(people.sofi), people.marta))
    for (const { view } of publisher.latest) {
      expect(view.revenge).toEqual({ hunterId: people.sofi, targetId: people.marta, pending: false })
      expect(view.players.find((player) => player.id === people.marta)).toMatchObject({
        alive: false,
        revealedRole: 'seer'
      })
    }
  })

  it('opens a shot when the village executes the Hunter and lets the narrator skip it', async () => {
    const { castAll, people, advance, useCases, narrator, publisher, othersThan } = await voteOpen()
    await castAll(othersThan(people.sofi), people.sofi)
    await advance()
    expect(publisher.latestFor(people.doctor).revenge).toEqual({ hunterId: people.sofi, targetId: null, pending: true })
    expect(await useCases.advancePhase.execute(narrator)).toEqual({ ok: false, error: { code: 'revenge-pending' } })
    unwrap(await useCases.skipRevenge.execute(narrator))
    expect(publisher.latestFor(people.doctor).revenge).toEqual({ hunterId: people.sofi, targetId: null, pending: false })
    expect(publisher.latestFor(people.doctor).players.filter((player) => !player.alive)).toHaveLength(1)
    await advance()
    expect(publisher.latestFor(people.doctor)).toMatchObject({ phase: 'night', revenge: null })
  })

  it('opens a shot when the narrator kills the Hunter', async () => {
    const { people, useCases, narrator, publisher } = await voteKit()
    unwrap(await useCases.setAlive.execute(narrator, { memberId: people.sofi, alive: false }))
    expect(publisher.latestFor(people.marta).revenge).toMatchObject({ hunterId: people.sofi, pending: true })
  })

  it('rejects a pick by someone else, a bad target and a skip by a player', async () => {
    const { people, useCases, actorOf } = await hunterKilledAtDawn()
    expect(await useCases.takeRevenge.execute(actorOf(people.marta), people.luis)).toEqual({
      ok: false,
      error: { code: 'no-revenge' }
    })
    expect(await useCases.takeRevenge.execute(actorOf(people.sofi), people.sofi)).toEqual({
      ok: false,
      error: { code: 'target-invalid' }
    })
    expect(await useCases.skipRevenge.execute(actorOf(people.sofi))).toEqual({
      ok: false,
      error: { code: 'not-narrator' }
    })
  })

  it('rejects a skip when no shot is pending', async () => {
    const { useCases, narrator } = await voteKit()
    expect(await useCases.skipRevenge.execute(narrator)).toEqual({ ok: false, error: { code: 'no-revenge' } })
  })
})
