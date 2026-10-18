import { describe, expect, it } from 'vitest'
import { asNarrator, asPlayer, createMatchKit, NARRATOR_ID, PLAYER_IDS, START_TIME, unwrap } from './matchUseCases.fixtures'

const [JUAN, ANA, MARTA, TATO, LUIS, PIPE, CARO] = PLAYER_IDS

const ghostKit = async (ghostPowers = true) => {
  const kit = createMatchKit()
  await kit.startMatch({ ghostPowers })
  for (const memberId of [JUAN, ANA]) unwrap(await kit.useCases.setAlive.execute(kit.narrator, { memberId, alive: false }))
  const haunt = (memberId: string, input: unknown) => kit.useCases.haunt.execute(kit.actorOf(memberId), input)
  const everyone = [NARRATOR_ID, ...PLAYER_IDS.slice(0, 7)]
  return { ...kit, haunt, everyone }
}

describe('Lights out', () => {
  it('flickers for every member and names the ghost only to the narrator', async () => {
    const { haunt, publisher, everyone, clock } = await ghostKit()
    unwrap(await haunt(JUAN, { kind: 'flicker' }))
    const [{ code, deliveries }] = publisher.haunts as [(typeof publisher.haunts)[number]]
    expect(code).toBe('LUNA42')
    expect(deliveries.map((delivery) => delivery.memberId).sort()).toEqual([...everyone].sort())
    const plain = { id: 'id-001', kind: 'flicker', word: null, ghostId: null, targetId: null, sentAt: clock.now() }
    for (const { memberId, effect } of deliveries) {
      expect(effect).toEqual(memberId === NARRATOR_ID ? { ...plain, ghostId: JUAN } : plain)
    }
  })

  it('shares one effect id between the copies and a new id for the next haunt', async () => {
    const { haunt, publisher } = await ghostKit()
    unwrap(await haunt(JUAN, { kind: 'flicker' }))
    unwrap(await haunt(ANA, { kind: 'flicker' }))
    const [first, second] = publisher.haunts.map((batch) => new Set(batch.deliveries.map((delivery) => delivery.effect.id)))
    expect([...(first as Set<string>)]).toEqual(['id-001'])
    expect([...(second as Set<string>)]).toEqual(['id-002'])
  })
})

describe('A word from beyond', () => {
  it('reaches only the target and the narrator, naming the ghost only to the narrator', async () => {
    const { haunt, publisher } = await ghostKit()
    unwrap(await haunt(JUAN, { kind: 'whisper', targetId: MARTA, word: 'bakery' }))
    const [{ deliveries }] = publisher.haunts as [(typeof publisher.haunts)[number]]
    expect(deliveries.map((delivery) => delivery.memberId)).toEqual([MARTA, NARRATOR_ID])
    const [toMarta, toNarrator] = deliveries.map((delivery) => delivery.effect)
    expect(toMarta).toEqual({
      id: 'id-001',
      kind: 'whisper',
      word: 'bakery',
      ghostId: null,
      targetId: MARTA,
      sentAt: START_TIME
    })
    expect(toNarrator).toEqual({ ...toMarta, ghostId: JUAN })
  })
})

describe('Refreshing the ghost view', () => {
  it('publishes fresh views so the used haunt shows as spent', async () => {
    const { haunt, publisher } = await ghostKit()
    expect(asPlayer(publisher.latestFor(JUAN)).you.haunt).toEqual({ available: true })
    expect(asPlayer(publisher.latestFor(MARTA)).you.haunt).toBeNull()
    unwrap(await haunt(JUAN, { kind: 'flicker' }))
    expect(asPlayer(publisher.latestFor(JUAN)).you.haunt).toEqual({ available: false })
    expect(asPlayer(publisher.latestFor(ANA)).you.haunt).toEqual({ available: true })
    expect(asPlayer(publisher.latestFor(TATO)).you.haunt).toBeNull()
    expect(asNarrator(publisher.latestFor(NARRATOR_ID)).perspective).toBe('narrator')
  })

  it('shows no haunt to anyone when the house rule is off', async () => {
    const { publisher } = await ghostKit(false)
    for (const memberId of [JUAN, ANA, MARTA, TATO, LUIS, PIPE, CARO]) {
      expect(asPlayer(publisher.latestFor(memberId)).you.haunt).toBeNull()
    }
  })
})

describe('Rejected haunts deliver nothing', () => {
  it('reports the domain error and leaves the publisher silent', async () => {
    const { haunt, publisher } = await ghostKit()
    const batches = publisher.batches.length
    expect(await haunt(MARTA, { kind: 'flicker' })).toEqual({ ok: false, error: { code: 'not-a-ghost' } })
    expect(await haunt(JUAN, { kind: 'whisper', targetId: MARTA, word: 'it was Tato' })).toEqual({
      ok: false,
      error: { code: 'whisper-invalid' }
    })
    expect(await haunt(JUAN, { kind: 'whisper', targetId: ANA, word: 'bakery' })).toEqual({
      ok: false,
      error: { code: 'target-invalid' }
    })
    expect(publisher.haunts).toEqual([])
    expect(publisher.batches).toHaveLength(batches)
  })

  it('rejects a haunt with ghost powers off and a stranger or a missing match', async () => {
    const off = await ghostKit(false)
    expect(await off.haunt(JUAN, { kind: 'flicker' })).toEqual({ ok: false, error: { code: 'ghost-powers-off' } })
    const kit = await ghostKit()
    expect(await kit.haunt('stranger', { kind: 'flicker' })).toEqual({ ok: false, error: { code: 'session-invalid' } })
    expect(await kit.useCases.haunt.execute({ code: 'NOPE00', memberId: JUAN }, { kind: 'flicker' })).toEqual({
      ok: false,
      error: { code: 'match-not-found' }
    })
  })
})
