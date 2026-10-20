import { err, ok, type PublicRoomCard, type Result, type RoomSession, type RoomSnapshot, type RoomSummary, type SeatTakeover } from '@luna/contracts'
import { snapshotOf } from '../domain/snapshot.fixtures'
import type { PublicGamesGateway, RoomFailure, RoomGateway, SessionStore, StoredSession } from './ports'

type Listener<T extends unknown[] = []> = (...args: T) => void

export const sessionFor = (memberId: string, snapshot: RoomSnapshot = snapshotOf()): RoomSession => ({
  code: snapshot.code,
  memberId,
  token: `token-${memberId}`,
  snapshot
})

export const summaryOf = (overrides: Partial<RoomSummary> = {}): RoomSummary => ({
  code: 'LUNA42',
  name: 'Los Primos · Viernes',
  narratorName: 'Nico',
  theme: 'classic',
  playerCount: 5,
  capacity: 15,
  avatarsInUse: ['ana', 'juan'],
  acceptingPlayers: true,
  voiceCallUrl: null,
  ...overrides
})

export class FakeRoomGateway implements RoomGateway {
  readonly calls: Array<{ command: string; input: unknown }> = []
  responses: Partial<Record<string, Result<unknown, RoomFailure>>> = {}
  private readonly snapshotListeners: Array<Listener<[RoomSnapshot]>> = []
  private readonly kickedListeners: Listener[] = []
  private readonly closedListeners: Listener[] = []
  private readonly reconnectedListeners: Listener[] = []
  private readonly takeoverListeners: Array<Listener<[SeatTakeover]>> = []

  answer(command: string, result: Result<unknown, RoomFailure>): this {
    this.responses[command] = result
    return this
  }

  private respond<T>(command: string, input: unknown, fallback: Result<unknown, RoomFailure>) {
    this.calls.push({ command, input })
    return Promise.resolve((this.responses[command] ?? fallback) as Result<T, RoomFailure>)
  }

  createRoom(input: unknown) {
    return this.respond<RoomSession>('createRoom', input, ok(sessionFor('id-Nico')))
  }

  lookUp(code: string) {
    return this.respond<RoomSummary>('lookUp', code, ok(summaryOf({ code })))
  }

  join(code: string, name: string) {
    return this.respond<RoomSession>('join', { code, name }, ok(sessionFor(`id-${name}`)))
  }

  resume(code: string, token: string) {
    return this.respond<RoomSession>('resume', { code, token }, err({ code: 'session-invalid' }))
  }

  chooseAvatar(avatar: unknown) {
    return this.respond<undefined>('chooseAvatar', avatar, ok(undefined))
  }

  setReady(ready: boolean) {
    return this.respond<undefined>('setReady', ready, ok(undefined))
  }

  updateSettings(settings: unknown) {
    return this.respond<undefined>('updateSettings', settings, ok(undefined))
  }

  kick(memberId: string) {
    return this.respond<undefined>('kick', memberId, ok(undefined))
  }

  addBot(choice: unknown) {
    return this.respond<undefined>('addBot', choice, ok(undefined))
  }

  mute(memberId: string, muted: boolean) {
    return this.respond<undefined>('mute', { memberId, muted }, ok(undefined))
  }

  removeBot(memberId: string) {
    return this.respond<undefined>('removeBot', memberId, ok(undefined))
  }

  setVoiceCall(url: string | null) {
    return this.respond<undefined>('setVoiceCall', url, ok(undefined))
  }

  leave() {
    return this.respond<undefined>('leave', undefined, ok(undefined))
  }

  start() {
    return this.respond<undefined>('start', undefined, ok(undefined))
  }

  playAgain() {
    return this.respond<undefined>('playAgain', undefined, ok(undefined))
  }

  onSnapshot(listener: Listener<[RoomSnapshot]>) {
    this.snapshotListeners.push(listener)
  }

  onKicked(listener: Listener) {
    this.kickedListeners.push(listener)
  }

  onClosed(listener: Listener) {
    this.closedListeners.push(listener)
  }

  onSeatTakenOver(listener: Listener<[SeatTakeover]>) {
    this.takeoverListeners.push(listener)
  }

  pushSeatTakenOver(takeover: SeatTakeover) {
    for (const listener of this.takeoverListeners) listener(takeover)
  }

  onReconnected(listener: Listener) {
    this.reconnectedListeners.push(listener)
  }

  pushSnapshot(snapshot: RoomSnapshot) {
    for (const listener of this.snapshotListeners) listener(snapshot)
  }

  pushKicked() {
    for (const listener of this.kickedListeners) listener()
  }

  pushClosed() {
    for (const listener of this.closedListeners) listener()
  }

  pushReconnected() {
    for (const listener of this.reconnectedListeners) listener()
  }

  commands(): string[] {
    return this.calls.map((call) => call.command)
  }
}

export const publicCardOf = (overrides: Partial<PublicRoomCard> = {}): PublicRoomCard => ({
  code: 'LUNA42',
  name: 'Lobos de medianoche',
  narratorName: 'Nico',
  playerCount: 5,
  capacity: 15,
  botCount: 2,
  deckSize: 8,
  status: 'waiting',
  joinable: true,
  ...overrides
})

export class FakePublicGamesGateway implements PublicGamesGateway {
  readonly calls: string[] = []
  rooms: readonly PublicRoomCard[] = [publicCardOf()]
  reportResult: Result<void, RoomFailure> = ok(undefined)
  private readonly listeners: Array<Listener<[readonly PublicRoomCard[]]>> = []

  watch() {
    this.calls.push('watch')
    return Promise.resolve(ok(this.rooms) as Result<readonly PublicRoomCard[], RoomFailure>)
  }

  unwatch() {
    this.calls.push('unwatch')
    return Promise.resolve(ok(undefined) as Result<void, RoomFailure>)
  }

  report(code: string) {
    this.calls.push(`report:${code}`)
    return Promise.resolve(this.reportResult)
  }

  onRooms(listener: Listener<[readonly PublicRoomCard[]]>) {
    this.listeners.push(listener)
  }

  private readonly reconnectListeners: Listener[] = []

  onReconnected(listener: Listener) {
    this.reconnectListeners.push(listener)
  }

  pushReconnected() {
    for (const listener of this.reconnectListeners) listener()
  }

  pushRooms(rooms: readonly PublicRoomCard[]) {
    for (const listener of this.listeners) listener(rooms)
  }
}

export class MemorySessionStore implements SessionStore {
  constructor(public stored: StoredSession | null = null) {}

  load() {
    return this.stored
  }

  save(session: StoredSession) {
    this.stored = session
  }

  clear() {
    this.stored = null
  }
}
