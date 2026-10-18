import { describe, expect, it } from 'vitest'
import { asNarrator, asPlayer, createMatchKit, deckOf, NARRATOR_ID, PLAYER_IDS, unwrap } from './matchUseCases.fixtures'

const EIGHT = { playerIds: PLAYER_IDS.slice(0, 8), deck: deckOf({ werewolf: 2, seer: 1, doctor: 1, witch: 1, drunk: 1, villager: 2 }) }

const nightKit = async () => {
  const kit = createMatchKit()
  const game = await kit.startMatch(EIGHT)
  const [luis, tato] = game.holdersOf('werewolf') as [string, string]
  const [ana, pipe] = game.holdersOf('villager') as [string, string]
  const people = {
    luis,
    tato,
    ana,
    pipe,
    marta: game.holderOf('seer'),
    doctor: game.holderOf('doctor'),
    witch: game.holderOf('witch'),
    caro: game.holderOf('drunk')
  }
  const act = async (memberId: string, input: unknown) => kit.useCases.actAtNight.execute(kit.actorOf(memberId), input)
  const viewOf = (memberId: string) => asPlayer(kit.publisher.latestFor(memberId))
  const narratorView = () => asNarrator(kit.publisher.latestFor(NARRATOR_ID))
  const advance = async (times = 1) => {
    for (let step = 0; step < times; step += 1) unwrap(await kit.useCases.advancePhase.execute(kit.narrator))
  }
  return { ...kit, ...game, people, act, viewOf, narratorView, advance }
}

describe('Player night views', () => {
  it('asks a villager who they suspect', async () => {
    const { people, viewOf } = await nightKit()
    expect(viewOf(people.ana).you.night).toEqual({ action: 'suspect', targetId: null })
  })

  it('shows each role its own night view', async () => {
    const { people, viewOf } = await nightKit()
    expect(viewOf(people.luis).you.night).toEqual({ action: 'hunt', targetId: null, packPicks: {}, packVictimId: null })
    expect(viewOf(people.marta).you.night).toEqual({ action: 'inspect', targetId: null, vision: null })
    expect(viewOf(people.caro).you.night).toEqual({ action: 'inspect', targetId: null, vision: null })
    expect(viewOf(people.doctor).you.night).toEqual({ action: 'protect', targetId: null, blockedTargetId: null })
    expect(viewOf(people.witch).you.night).toEqual({
      action: 'potions',
      acted: false,
      victimId: null,
      heal: false,
      poisonTargetId: null,
      healAvailable: true,
      poisonAvailable: true
    })
  })

  it('shows a suspicion to its author and to the narrator', async () => {
    const { people, act, viewOf, narratorView } = await nightKit()
    unwrap(await act(people.ana, { kind: 'suspect', targetId: people.tato }))
    expect(viewOf(people.ana).you.night).toEqual({ action: 'suspect', targetId: people.tato })
    expect(narratorView().night?.actions[people.ana]).toMatchObject({ action: 'suspect', acted: true, targetId: people.tato })
    expect(viewOf(people.pipe).you.night).toEqual({ action: 'suspect', targetId: null })
  })

  it('shows the Seer a true vision that nobody else sees', async () => {
    const { people, act, viewOf, narratorView, publisher } = await nightKit()
    unwrap(await act(people.marta, { kind: 'inspect', targetId: people.luis }))
    expect(viewOf(people.marta).you.night).toEqual({
      action: 'inspect',
      targetId: people.luis,
      vision: { round: 1, targetId: people.luis, isWolf: true }
    })
    for (const { memberId, view } of publisher.latest) {
      if (memberId === people.marta || memberId === NARRATOR_ID) continue
      expect(JSON.stringify(view)).not.toContain('isWolf')
    }
    expect(narratorView().night?.actions[people.marta]).toMatchObject({ visionIsWolf: true, fromDrunk: false })
  })

  it('keeps past visions for the Seer on the next night', async () => {
    const { people, act, advance, viewOf } = await nightKit()
    unwrap(await act(people.marta, { kind: 'inspect', targetId: people.ana }))
    expect(viewOf(people.marta).you.visions).toEqual([])
    await advance(1)
    expect(viewOf(people.marta).you.visions).toEqual([{ round: 1, targetId: people.ana, isWolf: false }])
    expect(viewOf(people.marta).you.night).toBeNull()
    await advance(4)
    expect(viewOf(people.marta).you.visions).toEqual([{ round: 1, targetId: people.ana, isWolf: false }])
    expect(viewOf(people.marta).you.night).toEqual({ action: 'inspect', targetId: null, vision: null })
    expect(viewOf(people.ana).you.visions).toEqual([])
  })

  it('shows the Drunk a random vision and tells the narrator it came from the Drunk', async () => {
    const { people, act, viewOf, narratorView } = await nightKit()
    unwrap(await act(people.caro, { kind: 'inspect', targetId: people.ana }))
    const night = viewOf(people.caro).you.night
    expect(night).toMatchObject({ action: 'inspect', targetId: people.ana, vision: { targetId: people.ana } })
    const isWolf = night?.action === 'inspect' ? night.vision?.isWolf : undefined
    expect(typeof isWolf).toBe('boolean')
    expect(narratorView().night?.actions[people.caro]).toMatchObject({ fromDrunk: true, visionIsWolf: isWolf })
  })

  it('shows the Witch the wolves target and her potions', async () => {
    const { people, act, viewOf } = await nightKit()
    unwrap(await act(people.luis, { kind: 'hunt', targetId: people.ana }))
    expect(viewOf(people.witch).you.night).toMatchObject({ action: 'potions', victimId: people.ana })
    unwrap(await act(people.witch, { kind: 'potions', heal: true, poisonTargetId: people.pipe }))
    expect(viewOf(people.witch).you.night).toMatchObject({
      acted: true,
      heal: true,
      poisonTargetId: people.pipe,
      healAvailable: true,
      poisonAvailable: true
    })
  })

  it('shows the Doctor last night patient and spent potions after dawn', async () => {
    const { people, act, advance, viewOf } = await nightKit()
    unwrap(await act(people.luis, { kind: 'hunt', targetId: people.ana }))
    unwrap(await act(people.doctor, { kind: 'protect', targetId: people.pipe }))
    unwrap(await act(people.witch, { kind: 'potions', heal: true, poisonTargetId: people.pipe }))
    await advance(5)
    expect(viewOf(people.doctor).you.night).toEqual({ action: 'protect', targetId: null, blockedTargetId: people.pipe })
    expect(viewOf(people.witch).you.night).toMatchObject({ healAvailable: false, poisonAvailable: false, acted: false })
  })

  it('shows pack picks to wolves only', async () => {
    const { people, act, viewOf, publisher } = await nightKit()
    unwrap(await act(people.luis, { kind: 'hunt', targetId: people.ana }))
    unwrap(await act(people.tato, { kind: 'hunt', targetId: people.ana }))
    const packPicks = { [people.luis]: people.ana, [people.tato]: people.ana }
    for (const wolf of [people.luis, people.tato]) {
      expect(viewOf(wolf).you.night).toMatchObject({ packPicks, packVictimId: people.ana })
    }
    for (const { memberId, view } of publisher.latest) {
      if ([people.luis, people.tato, NARRATOR_ID].includes(memberId)) continue
      expect(JSON.stringify(view)).not.toContain('packPicks')
    }
  })

  it('gives nothing to the dead and nothing outside the night', async () => {
    const { people, useCases, narrator, viewOf, advance } = await nightKit()
    unwrap(await useCases.setAlive.execute(narrator, { memberId: people.doctor, alive: false }))
    expect(viewOf(people.doctor).you.night).toBeNull()
    await advance(1)
    expect(viewOf(people.ana).you.night).toBeNull()
  })
})

describe('Narrator night view', () => {
  it('lists the players who have not acted, in seat order', async () => {
    const { people, act, narratorView, roles } = await nightKit()
    const everyone = Object.keys(roles)
    const quiet = [people.marta, people.pipe]
    for (const memberId of everyone.filter((id) => !quiet.includes(id))) {
      const role = roles[memberId]
      const input =
        role === 'werewolf'
          ? { kind: 'hunt', targetId: people.ana }
          : role === 'witch'
            ? { kind: 'potions', heal: false, poisonTargetId: null }
            : { kind: role === 'seer' || role === 'drunk' ? 'inspect' : role === 'doctor' ? 'protect' : 'suspect', targetId: people.ana === memberId ? people.pipe : people.ana }
      unwrap(await act(memberId, input))
    }
    const expected = everyone.filter((id) => quiet.includes(id))
    expect(narratorView().night?.waitingOn).toEqual(expected)
    expect(Object.keys(narratorView().night?.actions ?? {})).toEqual(everyone)
  })

  it('previews who dies at dawn', async () => {
    const { people, act, narratorView } = await nightKit()
    unwrap(await act(people.luis, { kind: 'hunt', targetId: people.ana }))
    unwrap(await act(people.doctor, { kind: 'protect', targetId: people.pipe }))
    expect(narratorView().night?.preview).toEqual({
      victimId: people.ana,
      protectedId: people.pipe,
      healing: false,
      poisonTargetId: null,
      deaths: [people.ana]
    })
    unwrap(await act(people.doctor, { kind: 'protect', targetId: people.ana }))
    expect(narratorView().night?.preview.deaths).toEqual([])
  })

  it('has no night view outside the night', async () => {
    const { advance, narratorView } = await nightKit()
    await advance(1)
    expect(narratorView().night).toBeNull()
  })
})

describe('Dawn reports', () => {
  it('shows every member who died and clears the report at the next night', async () => {
    const { people, act, advance, publisher } = await nightKit()
    unwrap(await act(people.luis, { kind: 'hunt', targetId: people.ana }))
    unwrap(await act(people.witch, { kind: 'potions', heal: false, poisonTargetId: people.pipe }))
    await advance(1)
    for (const { view } of publisher.latest) expect(view.dawn).toEqual({ round: 1, deaths: [people.ana, people.pipe] })
    const revealed = publisher.latestFor(people.marta).players.filter((player) => !player.alive)
    expect(revealed.map((player) => [player.id, player.revealedRole])).toEqual([
      [people.ana, 'villager'],
      [people.pipe, 'villager']
    ])
    await advance(4)
    for (const { view } of publisher.latest) expect(view.dawn).toBeNull()
  })

  it('reports a quiet night to everyone', async () => {
    const { advance, publisher } = await nightKit()
    await advance(1)
    for (const { view } of publisher.latest) expect(view.dawn).toEqual({ round: 1, deaths: [] })
  })

  it('asks the narrator to end the game when dawn kills the last wolf', async () => {
    const kit = createMatchKit()
    const game = await kit.startMatch({ playerIds: PLAYER_IDS.slice(0, 5), deck: deckOf({ werewolf: 1, witch: 1, villager: 3 }) })
    const wolf = game.holderOf('werewolf')
    const witch = game.holderOf('witch')
    unwrap(await kit.useCases.actAtNight.execute(kit.actorOf(witch), { kind: 'potions', heal: false, poisonTargetId: wolf }))
    unwrap(await kit.useCases.advancePhase.execute(kit.narrator))
    expect(asNarrator(kit.publisher.latestFor(NARRATOR_ID)).pendingWinner).toBe('village')
  })
})

describe('ActAtNight', () => {
  it('rejects bad input without publishing', async () => {
    const { people, act, publisher } = await nightKit()
    const published = publisher.batches.length
    expect(await act(people.ana, { kind: 'inspect', targetId: people.luis })).toEqual({
      ok: false,
      error: { code: 'not-your-action' }
    })
    expect(await act(NARRATOR_ID, { kind: 'suspect', targetId: people.luis })).toEqual({
      ok: false,
      error: { code: 'not-your-action' }
    })
    expect(await act('stranger', { kind: 'suspect', targetId: people.luis })).toEqual({
      ok: false,
      error: { code: 'session-invalid' }
    })
    expect(publisher.batches).toHaveLength(published)
  })

  it('rejects acting in the day', async () => {
    const { people, act, advance } = await nightKit()
    await advance(2)
    expect(await act(people.luis, { kind: 'hunt', targetId: people.ana })).toEqual({
      ok: false,
      error: { code: 'not-night' }
    })
  })
})
