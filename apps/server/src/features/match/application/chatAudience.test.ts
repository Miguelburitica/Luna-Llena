import { CHAT_LIMITS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { asPlayer, createMatchKit, deckOf, NARRATOR_ID, PLAYER_IDS, START_TIME, unwrap } from './matchUseCases.fixtures'

const WINDOW = CHAT_LIMITS.lastWordsSeconds * 1000

const dawnKit = async (lastWords: boolean) => {
  const kit = createMatchKit()
  const game = await kit.startMatch({
    playerIds: PLAYER_IDS.slice(0, 6),
    deck: deckOf({ werewolf: 2, seer: 1, villager: 3 }),
    lastWords
  })
  const [luis, tato] = game.holdersOf('werewolf') as [string, string]
  const [ana] = game.holdersOf('villager') as [string]
  for (const wolf of [luis, tato]) {
    unwrap(await kit.useCases.actAtNight.execute(kit.actorOf(wolf), { kind: 'hunt', targetId: ana }))
  }
  unwrap(await kit.useCases.advancePhase.execute(kit.narrator))
  return { ...kit, ...game, luis, ana }
}

describe('DescribeChatAudience', () => {
  it('describes the narrator and every seat', async () => {
    const { useCases, luis, ana } = await dawnKit(true)
    const audience = await useCases.describeChatAudience.execute('LUNA42', START_TIME)
    expect(audience?.narratorId).toBe(NARRATOR_ID)
    expect([...(audience?.members.keys() ?? [])]).toHaveLength(7)
    expect(audience?.members.get(luis)?.read).toEqual(['village', 'wolves'])
    expect(audience?.members.get(ana)).toMatchObject({ lastWordsUntil: START_TIME + WINDOW, write: ['village', 'ghosts'] })
    expect(audience?.members.get(NARRATOR_ID)?.write).toEqual(['village'])
  })

  it('finds nothing when there is no match', async () => {
    const { useCases } = createMatchKit()
    expect(await useCases.describeChatAudience.execute('NOPE00', START_TIME)).toBeUndefined()
  })
})

describe('CloseLastWords', () => {
  it('closes the window and republishes every view', async () => {
    const { useCases, publisher, actorOf, ana, luis } = await dawnKit(true)
    expect(asPlayer(publisher.latestFor(luis)).chat.villagePaused).toBe(true)
    unwrap(await useCases.closeLastWords.execute(actorOf(ana)))
    expect(asPlayer(publisher.latestFor(ana)).chat).toMatchObject({ lastWordsUntil: null, write: ['ghosts'] })
    expect(asPlayer(publisher.latestFor(luis)).chat).toMatchObject({ villagePaused: false, write: ['village'] })
  })

  it('rejects a stranger and an unknown room', async () => {
    const { useCases } = await dawnKit(true)
    expect(await useCases.closeLastWords.execute({ code: 'LUNA42', memberId: 'stranger' })).toEqual({
      ok: false,
      error: { code: 'session-invalid' }
    })
    expect(await useCases.closeLastWords.execute({ code: 'NOPE00', memberId: 'p1' })).toEqual({
      ok: false,
      error: { code: 'match-not-found' }
    })
  })

  it('gives no window with the house rule off', async () => {
    const { publisher, ana } = await dawnKit(false)
    expect(asPlayer(publisher.latestFor(ana)).chat.lastWordsUntil).toBeNull()
  })
})
