import { describe, expect, it } from 'vitest'
import { createMatchKit, deckOf, NARRATOR_ID, PLAYER_IDS, unwrap } from './matchUseCases.fixtures'

const SIX = PLAYER_IDS.slice(0, 6)

const playedKit = async (anonymousVotes: boolean) => {
  const kit = createMatchKit()
  const game = await kit.startMatch({
    playerIds: SIX,
    deck: deckOf({ werewolf: 2, seer: 1, villager: 3 }),
    anonymousVotes
  })
  const [luis, tato] = game.holdersOf('werewolf') as [string, string]
  const villagers = game.holdersOf('villager')
  const advance = async (times = 1) => {
    for (let step = 0; step < times; step += 1) unwrap(await kit.useCases.advancePhase.execute(kit.narrator))
  }
  return { ...kit, ...game, luis, tato, villagers, advance }
}

describe('Secrets stay secret until the end', () => {
  it('sends no timeline to anyone while the game runs', async () => {
    const { publisher, advance, useCases, narrator, luis, tato, villagers, actorOf } = await playedKit(false)
    await advance(3)
    for (const voterId of villagers) unwrap(await useCases.castVote.execute(actorOf(voterId), luis))
    await advance()
    unwrap(await useCases.setAlive.execute(narrator, { memberId: tato, alive: false }))
    for (const { view } of publisher.latest) {
      expect(view.outcome).toBeNull()
      expect(JSON.stringify(view)).not.toContain('timeline')
      expect(JSON.stringify(view)).not.toContain('awards')
    }
  })

  it('sends the timeline and the awards to every member once the game is over', async () => {
    const { publisher, advance, useCases, narrator, luis, tato, villagers, actorOf } = await playedKit(false)
    await advance(3)
    for (const voterId of villagers) unwrap(await useCases.castVote.execute(actorOf(voterId), luis))
    await advance()
    unwrap(await useCases.setAlive.execute(narrator, { memberId: tato, alive: false }))
    unwrap(await useCases.endGame.execute(narrator))
    expect(publisher.latest.map((entry) => entry.memberId)).toContain(NARRATOR_ID)
    for (const { view } of publisher.latest) {
      expect(view.outcome?.winner).toBe('village')
      expect(view.outcome?.timeline.map((entry) => entry.kind)).toEqual(['night', 'vote', 'narrator'])
      expect(view.outcome?.awards.map((award) => award.award)).toEqual(['most-suspicious', 'worst-liar', 'silent-assassin'])
    }
  })
})

describe('Anonymous votes revealed at last', () => {
  it('keeps the live verdict anonymous and shows the voters in the final timeline', async () => {
    const { publisher, advance, useCases, narrator, luis, tato, villagers, actorOf } = await playedKit(true)
    await advance(3)
    for (const voterId of villagers) unwrap(await useCases.castVote.execute(actorOf(voterId), luis))
    await advance()
    expect(publisher.latestFor(villagers[0] as string).verdict?.tally).toEqual([
      { targetId: luis, votes: villagers.length, voterIds: null }
    ])
    unwrap(await useCases.setAlive.execute(narrator, { memberId: tato, alive: false }))
    unwrap(await useCases.endGame.execute(narrator))
    const voteEntry = publisher.latestFor(villagers[0] as string).outcome?.timeline.find((entry) => entry.kind === 'vote')
    expect(voteEntry).toMatchObject({
      verdict: { tally: [{ targetId: luis, votes: villagers.length, voterIds: expect.arrayContaining(villagers) }] }
    })
  })
})

describe('IsMatchOver', () => {
  it('is false while the game runs and for an unknown room, true after the end', async () => {
    const { useCases, narrator, luis, tato } = await playedKit(false)
    expect(await useCases.isMatchOver.execute('LUNA42')).toBe(false)
    expect(await useCases.isMatchOver.execute('NOPE00')).toBe(false)
    unwrap(await useCases.setAlive.execute(narrator, { memberId: luis, alive: false }))
    unwrap(await useCases.setAlive.execute(narrator, { memberId: tato, alive: false }))
    unwrap(await useCases.endGame.execute(narrator))
    expect(await useCases.isMatchOver.execute('LUNA42')).toBe(true)
  })
})

describe('DiscardMatch', () => {
  it('removes the match so that it can no longer be found', async () => {
    const { useCases, matches, narrator } = await playedKit(false)
    expect(await matches.find('LUNA42')).toBeDefined()
    await useCases.discardMatch.execute('LUNA42')
    expect(await matches.find('LUNA42')).toBeUndefined()
    expect(await useCases.syncMatch.execute(narrator)).toEqual({ ok: false, error: { code: 'match-not-found' } })
  })
})
