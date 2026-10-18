import {
  AVATAR_IDS,
  done,
  err,
  ok,
  roomError,
  ROOM_LIMITS,
  type AvatarId,
  type Result,
  type RoomError,
  type RoomStatus,
  type StartReadiness
} from '@luna/contracts'
import { alternativeNames } from './alternativeNames'
import type { DisplayName } from './DisplayName'
import { Member, type MemberIdentity } from './Member'
import type { RoomCode } from './RoomCode'
import type { RoomName } from './RoomName'
import type { RoomSettings } from './RoomSettings'
import { evaluateStartReadiness } from './StartReadiness'

export interface RoomOpening {
  readonly code: RoomCode
  readonly name: RoomName
  readonly settings: RoomSettings
  readonly narrator: MemberIdentity
}

export type Departure = 'player-left' | 'room-closed'

export class Room {
  private readonly seats: Member[]
  private currentStatus: RoomStatus = 'lobby'
  private currentSettings: RoomSettings

  private constructor(
    readonly code: RoomCode,
    readonly name: RoomName,
    settings: RoomSettings,
    narrator: Member
  ) {
    this.currentSettings = settings
    this.seats = [narrator]
  }

  static open({ code, name, settings, narrator }: RoomOpening): Room {
    return new Room(code, name, settings, new Member(narrator, true))
  }

  get status(): RoomStatus {
    return this.currentStatus
  }

  get settings(): RoomSettings {
    return this.currentSettings
  }

  get members(): readonly Member[] {
    return this.seats
  }

  get narrator(): Member {
    const narrator = this.seats.find((member) => member.isNarrator)
    if (narrator === undefined) throw new Error('A room always has a narrator')
    return narrator
  }

  get players(): readonly Member[] {
    return this.seats.filter((member) => !member.isNarrator)
  }

  get isAcceptingPlayers(): boolean {
    return this.currentStatus === 'lobby' && this.players.length < ROOM_LIMITS.maxPlayers
  }

  get avatarsInUse(): AvatarId[] {
    return this.seats.flatMap((member) => (member.avatar === null ? [] : [member.avatar]))
  }

  get startReadiness(): StartReadiness {
    return evaluateStartReadiness(this.players, this.currentSettings.deckSize)
  }

  memberWithId(memberId: string): Member | undefined {
    return this.seats.find((member) => member.id === memberId)
  }

  join(identity: MemberIdentity): Result<Member, RoomError> {
    const lobby = this.requireLobby()
    if (!lobby.ok) return lobby
    if (this.players.length >= ROOM_LIMITS.maxPlayers) return err(roomError('room-full'))
    if (this.isNameTaken(identity.name)) {
      return err({ code: 'name-taken', suggestions: alternativeNames(identity.name, (name) => this.isNameTaken(name)) })
    }
    const member = new Member(identity, false)
    this.seats.push(member)
    return ok(member)
  }

  resume(token: unknown): Result<Member, RoomError> {
    const member = this.seats.find((seat) => seat.holdsToken(token))
    if (member === undefined) return err(roomError('session-invalid'))
    member.connected = true
    return ok(member)
  }

  disconnect(memberId: string): void {
    const member = this.memberWithId(memberId)
    if (member !== undefined) member.connected = false
  }

  chooseAvatar(memberId: string, avatar: unknown): Result<void, RoomError> {
    const lobby = this.requireLobby()
    if (!lobby.ok) return lobby
    const member = this.requireMember(memberId)
    if (!member.ok) return member
    if (avatar !== null && !AVATAR_IDS.includes(avatar as AvatarId)) return err(roomError('avatar-taken'))
    const holder = this.seats.find((seat) => seat.avatar === avatar && seat !== member.value)
    if (avatar !== null && holder !== undefined) return err(roomError('avatar-taken'))
    member.value.avatar = avatar as AvatarId | null
    return done
  }

  setReady(memberId: string, ready: unknown): Result<void, RoomError> {
    const lobby = this.requireLobby()
    if (!lobby.ok) return lobby
    const player = this.requirePlayer(memberId)
    if (!player.ok) return player
    player.value.ready = ready === true
    return done
  }

  updateSettings(actorId: string, input: unknown): Result<void, RoomError> {
    const authority = this.requireNarratorInLobby(actorId)
    if (!authority.ok) return authority
    const settings = this.currentSettings.apply(input)
    if (!settings.ok) return settings
    this.currentSettings = settings.value
    return done
  }

  kick(actorId: string, targetId: unknown): Result<Member, RoomError> {
    const authority = this.requireNarratorInLobby(actorId)
    if (!authority.ok) return authority
    const target = this.players.find((player) => player.id === targetId)
    if (target === undefined) return err(roomError('member-not-found'))
    this.removeSeat(target)
    return ok(target)
  }

  leave(memberId: string): Result<Departure, RoomError> {
    const member = this.requireMember(memberId)
    if (!member.ok) return member
    if (member.value.isNarrator) return ok('room-closed')
    this.removeSeat(member.value)
    return ok('player-left')
  }

  start(actorId: string): Result<void, RoomError> {
    const authority = this.requireNarratorInLobby(actorId)
    if (!authority.ok) return authority
    const readiness = this.startReadiness
    if (!readiness.canStart) return err({ code: 'start-conditions-unmet', unmet: readiness.unmet })
    this.currentStatus = 'in-game'
    return done
  }

  private isNameTaken(name: DisplayName): boolean {
    return this.seats.some((member) => member.name.sameAs(name))
  }

  private removeSeat(member: Member): void {
    this.seats.splice(this.seats.indexOf(member), 1)
  }

  private requireLobby(): Result<void, RoomError> {
    return this.currentStatus === 'lobby' ? done : err(roomError('game-already-started'))
  }

  private requireMember(memberId: string): Result<Member, RoomError> {
    const member = this.memberWithId(memberId)
    return member === undefined ? err(roomError('session-invalid')) : ok(member)
  }

  private requirePlayer(memberId: string): Result<Member, RoomError> {
    const member = this.requireMember(memberId)
    if (!member.ok) return member
    return member.value.isNarrator ? err(roomError('not-a-player')) : member
  }

  private requireNarratorInLobby(actorId: string): Result<void, RoomError> {
    const member = this.requireMember(actorId)
    if (!member.ok) return member
    if (!member.value.isNarrator) return err(roomError('not-narrator'))
    return this.requireLobby()
  }
}
