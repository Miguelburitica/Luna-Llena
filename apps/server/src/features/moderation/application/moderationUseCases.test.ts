import { MODERATION_LIMITS } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { ADMIN_TOKEN, createModerationKit, HOUR, MODERATION_START, TATO } from './moderationUseCases.fixtures'

describe('Content review', () => {
  it('blocks a word-list match without calling the model', async () => {
    const { useCases, classifier } = createModerationKit()
    expect(await useCases.reviewText.execute({ roomCode: 'LUNA42', text: 'put4', kind: 'message' })).toBe('blocked')
    expect(classifier.calls).toEqual([])
  })

  it('labels a profane name with the model within 3 seconds', async () => {
    const { useCases, classifier } = createModerationKit()
    classifier.label = 'profanity'
    expect(await useCases.reviewText.execute({ roomCode: 'LUNA42', text: 'Señor Grosero', kind: 'name' })).toBe('profanity')
    expect(classifier.calls[0]).toEqual({ text: 'Señor Grosero', kind: 'name', timeoutMs: 3000 })
  })

  it('labels a harassing room name', async () => {
    const { useCases, classifier } = createModerationKit()
    classifier.label = 'harassment'
    expect(await useCases.reviewText.execute({ roomCode: 'LUNA42', text: 'Sala de odio', kind: 'room-name' })).toBe('harassment')
  })

  it('gives no verdict when the model is down', async () => {
    const { useCases, classifier } = createModerationKit()
    classifier.failing = true
    expect(await useCases.reviewText.execute({ roomCode: 'LUNA42', text: 'hola', kind: 'message' })).toBeNull()
  })

  it('stops calling the model once the room spent its budget', async () => {
    const { useCases, classifier, clock } = createModerationKit()
    for (let review = 0; review < MODERATION_LIMITS.reviewsPerRoom; review += 1) {
      clock.advanceBy(3000)
      await useCases.reviewText.execute({ roomCode: 'LUNA42', text: `hola ${review}`, kind: 'message' })
    }
    clock.advanceBy(HOUR)
    expect(await useCases.reviewText.execute({ roomCode: 'LUNA42', text: 'otra', kind: 'message' })).toBeNull()
    expect(classifier.calls).toHaveLength(MODERATION_LIMITS.reviewsPerRoom)
  })
})

describe('Strikes and bans', () => {
  it('bans a device on the third strike for 24 hours', () => {
    const { useCases, clock } = createModerationKit()
    for (let strike = 0; strike < 3; strike += 1) {
      useCases.recordStrike.execute({ client: TATO, reason: 'kicked', roomCode: 'LUNA42', excerpt: null })
    }
    expect(useCases.checkBan.execute(TATO)).toBe(MODERATION_START + 24 * HOUR)
    clock.advanceBy(24 * HOUR)
    expect(useCases.checkBan.execute(TATO)).toBeNull()
  })

  it('records strikes with a capped excerpt', () => {
    const { useCases, records } = createModerationKit()
    useCases.recordStrike.execute({ client: TATO, reason: 'message-flagged', roomCode: 'LUNA42', excerpt: 'x'.repeat(300) })
    expect(records.strikes()[0]?.excerpt).toHaveLength(MODERATION_LIMITS.excerptLength)
  })
})

describe('Operator screen', () => {
  it('rejects every request without a configured token', async () => {
    const { useCases } = createModerationKit({ token: '' })
    expect(useCases.signInAdmin.execute('anything', '1.1.1.1')).toEqual({ ok: false, error: { code: 'admin-disabled' } })
    expect(await useCases.moderationOverview.execute('session-1')).toEqual({ ok: false, error: { code: 'admin-disabled' } })
    expect(useCases.adminSessionOf.execute(undefined)).toEqual({ ok: false, error: { code: 'admin-disabled' } })
  })

  it('rejects requests without a live session', async () => {
    const { useCases } = createModerationKit()
    expect(await useCases.moderationOverview.execute(undefined)).toEqual({ ok: false, error: { code: 'admin-denied' } })
    expect(await useCases.moderationOverview.execute('forged')).toEqual({ ok: false, error: { code: 'admin-denied' } })
  })

  it('ends the session on sign-out and after 8 hours', async () => {
    const { useCases, clock, signIn } = createModerationKit()
    const first = signIn()
    expect((await useCases.moderationOverview.execute(first)).ok).toBe(true)
    useCases.signOutAdmin.execute(first)
    expect(await useCases.moderationOverview.execute(first)).toEqual({ ok: false, error: { code: 'admin-denied' } })
    const second = signIn()
    expect(useCases.adminSessionOf.execute(second)).toEqual({ ok: true, value: { signedIn: true, expiresAt: MODERATION_START + 8 * HOUR } })
    clock.advanceBy(8 * HOUR)
    expect(useCases.adminSessionOf.execute(second)).toEqual({ ok: true, value: { signedIn: false, expiresAt: null } })
  })

  it('locks an address after 5 wrong tokens, even for the right one', () => {
    const { useCases, clock } = createModerationKit()
    for (let attempt = 0; attempt < 5; attempt += 1) useCases.signInAdmin.execute('wrong', '6.6.6.6')
    expect(useCases.signInAdmin.execute(ADMIN_TOKEN, '6.6.6.6')).toEqual({ ok: false, error: { code: 'admin-denied' } })
    expect(useCases.signInAdmin.execute(ADMIN_TOKEN, '7.7.7.7').ok).toBe(true)
    clock.advanceBy(10 * 60_000)
    expect(useCases.signInAdmin.execute(ADMIN_TOKEN, '6.6.6.6').ok).toBe(true)
  })

  it('bans an address by hand for 48 hours and lifts a device ban', () => {
    const { useCases, signIn } = createModerationKit()
    const session = signIn()
    expect(useCases.banClient.execute(session, { kind: 'address', value: TATO.address, hours: 48 })).toEqual({ ok: true, value: undefined })
    expect(useCases.checkBan.execute({ address: TATO.address, device: 'another-device' })).toBe(MODERATION_START + 48 * HOUR)
    useCases.liftBan.execute(session, { kind: 'address', value: TATO.address })
    expect(useCases.checkBan.execute(TATO)).toBeNull()
  })

  it('lifts a strike ban at once', () => {
    const { useCases, signIn } = createModerationKit()
    for (let strike = 0; strike < 3; strike += 1) {
      useCases.recordStrike.execute({ client: TATO, reason: 'kicked', roomCode: null, excerpt: null })
    }
    useCases.liftBan.execute(signIn(), { kind: 'device', value: TATO.device })
    expect(useCases.checkBan.execute(TATO)).toBeNull()
  })

  it('rejects bad ban input', () => {
    const { useCases, signIn } = createModerationKit()
    const session = signIn()
    expect(useCases.banClient.execute(session, { kind: 'planet', value: 'x', hours: 1 })).toEqual({ ok: false, error: { code: 'ban-invalid' } })
    expect(useCases.banClient.execute(session, { kind: 'device', value: 'x', hours: 0 })).toEqual({ ok: false, error: { code: 'ban-invalid' } })
  })

  it('closes a room and lists the overview', async () => {
    const { useCases, directory, signIn } = createModerationKit()
    const session = signIn()
    const overview = await useCases.moderationOverview.execute(session)
    expect(overview.ok && overview.value.rooms.map((room) => room.code)).toEqual(['SPAM42'])
    expect((await useCases.closeRoomAsAdmin.execute(session, { code: 'SPAM42' })).ok).toBe(true)
    expect(directory.closed).toEqual(['SPAM42'])
    expect(await useCases.closeRoomAsAdmin.execute(session, { code: 'NOPE99' })).toEqual({ ok: false, error: { code: 'room-not-found' } })
  })
})
