import { describe, expect, it } from 'vitest'
import { createMatchKit, NARRATOR_ID, PLAYER_IDS, START_TIME, unwrap } from './matchUseCases.fixtures'

const [JUAN] = PLAYER_IDS
const EVERYONE = [NARRATOR_ID, ...PLAYER_IDS.slice(0, 7)]

const cueKit = async () => {
  const kit = await createMatchKit()
  const started = await kit.startMatch()
  const cue = (memberId: string, input: unknown) => kit.useCases.playCue.execute(kit.actorOf(memberId), input)
  return { ...kit, ...started, cue }
}

describe('Thunder on cue', () => {
  it('sends the sound to the narrator and every seat without touching the views', async () => {
    const { cue, publisher } = await cueKit()
    const batches = publisher.batches.length
    unwrap(await cue(NARRATOR_ID, { kind: 'sound', sound: 'thunder' }))
    expect(publisher.cues).toEqual([
      {
        code: 'LUNA42',
        memberIds: EVERYONE,
        effect: { id: 'id-001', kind: 'sound', sound: 'thunder', sentAt: START_TIME }
      }
    ])
    expect(publisher.batches).toHaveLength(batches)
  })

  it('works in any phase and gives every cue its own id', async () => {
    const { cue, publisher, useCases, narrator } = await cueKit()
    unwrap(await useCases.advancePhase.execute(narrator))
    unwrap(await cue(NARRATOR_ID, { kind: 'sound', sound: 'howl' }))
    unwrap(await cue(NARRATOR_ID, { kind: 'sound', sound: 'trombone' }))
    expect(publisher.cues.map((entry) => entry.effect.id)).toEqual(['id-001', 'id-002'])
  })
})

describe('Lightning', () => {
  it('sends the screen effect to every member', async () => {
    const { cue, publisher } = await cueKit()
    unwrap(await cue(NARRATOR_ID, { kind: 'effect', effect: 'lightning' }))
    expect(publisher.cues).toEqual([
      {
        code: 'LUNA42',
        memberIds: EVERYONE,
        effect: { id: 'id-001', kind: 'effect', effect: 'lightning', sentAt: START_TIME }
      }
    ])
  })
})

describe('A player tries the soundboard', () => {
  it('rejects the cue with not-narrator and delivers nothing', async () => {
    const { cue, publisher } = await cueKit()
    expect(await cue(JUAN, { kind: 'sound', sound: 'thunder' })).toEqual({ ok: false, error: { code: 'not-narrator' } })
    expect(publisher.cues).toEqual([])
  })
})

describe('Rejected cues', () => {
  it('rejects unknown sounds, effects, kinds and non-objects', async () => {
    const { cue, publisher } = await cueKit()
    const invalid = { ok: false, error: { code: 'cue-invalid' } }
    expect(await cue(NARRATOR_ID, { kind: 'sound', sound: 'kazoo' })).toEqual(invalid)
    expect(await cue(NARRATOR_ID, { kind: 'effect', effect: 'rain' })).toEqual(invalid)
    expect(await cue(NARRATOR_ID, { kind: 'effect', effect: 'thunder' })).toEqual(invalid)
    expect(await cue(NARRATOR_ID, { kind: 'smell', sound: 'howl' })).toEqual(invalid)
    expect(await cue(NARRATOR_ID, 'thunder')).toEqual(invalid)
    expect(await cue(NARRATOR_ID, null)).toEqual(invalid)
    expect(publisher.cues).toEqual([])
  })

  it('rejects a stranger and a missing match', async () => {
    const { cue, useCases } = await cueKit()
    expect(await cue('stranger', { kind: 'sound', sound: 'howl' })).toEqual({ ok: false, error: { code: 'session-invalid' } })
    expect(await useCases.playCue.execute({ code: 'NOPE00', memberId: NARRATOR_ID }, { kind: 'sound', sound: 'howl' })).toEqual({
      ok: false,
      error: { code: 'match-not-found' }
    })
  })

  it('rejects a cue after the game is over', async () => {
    const { cue, publisher, useCases, narrator, holdersOf } = await cueKit()
    for (const memberId of holdersOf('werewolf')) {
      unwrap(await useCases.setAlive.execute(narrator, { memberId, alive: false }))
    }
    unwrap(await useCases.endGame.execute(narrator))
    expect(await cue(NARRATOR_ID, { kind: 'sound', sound: 'howl' })).toEqual({ ok: false, error: { code: 'match-over' } })
    expect(publisher.cues).toEqual([])
  })
})
