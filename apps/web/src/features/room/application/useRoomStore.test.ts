import { err, ok } from '@luna/contracts'
import { describe, expect, it } from 'vitest'
import { snapshotOf } from '../domain/snapshot.fixtures'
import { sessionFor } from './RoomGateway.fixtures'
import { createRoomTestApp } from './roomApp.fixtures'

const caroSeat = { code: 'LUNA42', memberId: 'id-Caro', token: 'token-id-Caro' }

describe('room store', () => {
  it('enters the room after creating it and remembers the seat', async () => {
    const { store, sessions } = createRoomTestApp()
    const result = await store.createRoom({ roomName: 'Los Primos', narratorName: 'Nico' })
    expect(result.ok).toBe(true)
    expect(store.isNarrator).toBe(true)
    expect(sessions.stored).toEqual({ code: 'LUNA42', memberId: 'id-Nico', token: 'token-id-Nico' })
  })

  it('normalizes the code before joining', async () => {
    const { store, gateway } = createRoomTestApp()
    await store.join(' luna42 ', 'Caro')
    expect(gateway.calls.at(-1)).toEqual({ command: 'join', input: { code: 'LUNA42', name: 'Caro' } })
    expect(store.me?.name).toBe('Caro')
  })

  it('keeps a name-taken failure for the view and stays outside the room', async () => {
    const { store, gateway } = createRoomTestApp()
    gateway.answer('join', err({ code: 'name-taken', suggestions: ['Ana 2'] }))
    expect(await store.join('LUNA42', 'Ana')).toEqual({ ok: false, error: { code: 'name-taken', suggestions: ['Ana 2'] } })
    expect(store.session).toBeNull()
  })

  it('resumes the seat stored on the device', async () => {
    const { store, gateway } = createRoomTestApp(caroSeat)
    gateway.answer('resume', ok(sessionFor('id-Caro')))
    expect((await store.resume('luna42')).ok).toBe(true)
    expect(gateway.calls.at(-1)).toEqual({ command: 'resume', input: { code: 'LUNA42', token: 'token-id-Caro' } })
    expect(store.me?.name).toBe('Caro')
  })

  it('forgets a stored seat the server no longer knows', async () => {
    const { store, sessions } = createRoomTestApp(caroSeat)
    expect(await store.resume('LUNA42')).toEqual({ ok: false, error: { code: 'session-invalid' } })
    expect(sessions.stored).toBeNull()
  })

  it('keeps the stored seat when the server is unreachable', async () => {
    const { store, gateway, sessions } = createRoomTestApp(caroSeat)
    gateway.answer('resume', err({ code: 'unreachable' }))
    await store.resume('LUNA42')
    expect(sessions.stored).toEqual(caroSeat)
  })

  it('does not resume a seat from another room', async () => {
    const { store, gateway } = createRoomTestApp(caroSeat)
    expect(await store.resume('NUBE77')).toEqual({ ok: false, error: { code: 'session-invalid' } })
    expect(gateway.commands()).not.toContain('resume')
  })

  it('applies live snapshots for its own room only', async () => {
    const { store, gateway } = createRoomTestApp()
    await store.join('LUNA42', 'Caro')
    gateway.pushSnapshot(snapshotOf({ name: 'Renamed' }))
    gateway.pushSnapshot(snapshotOf({ code: 'NUBE77', name: 'Other' }))
    expect(store.snapshot?.name).toBe('Renamed')
  })

  it('ends the visit when kicked or when the room closes', async () => {
    const { store, gateway, sessions } = createRoomTestApp()
    await store.join('LUNA42', 'Caro')
    gateway.pushKicked()
    expect(store.ending).toBe('kicked')
    expect(store.snapshot).toBeNull()
    expect(sessions.stored).toBeNull()
    await store.join('LUNA42', 'Caro')
    gateway.pushClosed()
    expect(store.ending).toBe('closed')
  })

  it('resumes automatically after the connection comes back', async () => {
    const { store, gateway } = createRoomTestApp()
    await store.join('LUNA42', 'Caro')
    gateway.answer('resume', ok(sessionFor('id-Caro')))
    gateway.pushReconnected()
    await Promise.resolve()
    expect(gateway.commands()).toContain('resume')
  })

  it('forgets the seat after leaving', async () => {
    const { store, sessions } = createRoomTestApp()
    await store.join('LUNA42', 'Caro')
    await store.leave()
    expect(store.session).toBeNull()
    expect(sessions.stored).toBeNull()
  })

  it('asks the gateway to play again and passes its answer through', async () => {
    const { store, gateway } = createRoomTestApp()
    await store.join('LUNA42', 'Nico')
    expect((await store.playAgain()).ok).toBe(true)
    gateway.answer('playAgain', err({ code: 'game-not-over' }))
    expect(await store.playAgain()).toEqual({ ok: false, error: { code: 'game-not-over' } })
    expect(gateway.commands().filter((command) => command === 'playAgain')).toHaveLength(2)
  })
})

describe('room store voice call', () => {
  it('sends the link to the gateway and keeps a failure for the caller', async () => {
    const { store, gateway } = createRoomTestApp()
    await store.join('LUNA42', 'Nico')
    expect((await store.setVoiceCall('https://discord.gg/abc123')).ok).toBe(true)
    expect(gateway.calls.at(-1)).toEqual({ command: 'setVoiceCall', input: 'https://discord.gg/abc123' })
    gateway.answer('setVoiceCall', err({ code: 'voice-call-invalid' }))
    const rejected = await store.setVoiceCall('http://nope')
    expect(rejected).toEqual(err({ code: 'voice-call-invalid' }))
  })

  it('removes the link with null and follows the snapshot the server pushes', async () => {
    const { store, gateway } = createRoomTestApp()
    await store.join('LUNA42', 'Nico')
    await store.setVoiceCall(null)
    expect(gateway.calls.at(-1)).toEqual({ command: 'setVoiceCall', input: null })
    gateway.pushSnapshot(snapshotOf({ voiceCallUrl: 'https://meet.jit.si/LunaLlena-LUNA42' }))
    expect(store.snapshot?.voiceCallUrl).toBe('https://meet.jit.si/LunaLlena-LUNA42')
  })
})
