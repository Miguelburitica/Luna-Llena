import {
  AVATAR_IDS,
  BOT_CASTS,
  BOT_LIMITS,
  done,
  err,
  ok,
  roomError,
  ROOM_LIMITS,
  type AvatarId,
  type BotCastId,
  type BotProfile,
  type Result,
  type RoomError,
  type RoomStatus,
  type StartReadiness
} from '@luna/contracts'
import { alternativeNames } from './alternativeNames'
import { DisplayName } from './DisplayName'
import { Member, type MemberIdentity } from './Member'
import type { RoomCode } from './RoomCode'
import type { RoomName } from './RoomName'
import type { RoomSettings } from './RoomSettings'
import { evaluateStartReadiness } from './StartReadiness'
import { VoiceCallUrl } from './VoiceCallUrl'

export interface RoomOpening {
  readonly code: RoomCode
  readonly name: RoomName
  readonly settings: RoomSettings
  readonly narrator: MemberIdentity
  readonly voiceCall?: VoiceCallUrl | null
}

export type Departure = 'player-left' | 'room-closed'

export class Room {
  private readonly seats: Member[]
  private currentStatus: RoomStatus = 'lobby'
  private currentSettings: RoomSettings
  private currentVoiceCall: VoiceCallUrl | null
  private currentBotCast: BotCastId | null = null

  private constructor(
    readonly code: RoomCode,
    readonly name: RoomName,
    settings: RoomSettings,
    narrator: Member,
    voiceCall: VoiceCallUrl | null
  ) {
    this.currentSettings = settings
    this.currentVoiceCall = voiceCall
    this.seats = [narrator]
  }

  static open({ code, name, settings, narrator, voiceCall = null }: RoomOpening): Room {
    return new Room(code, name, settings, new Member(narrator, true), voiceCall)
  }

  get status(): RoomStatus {
    return this.currentStatus
  }

  get settings(): RoomSettings {
    return this.currentSettings
  }

  get voiceCall(): VoiceCallUrl | null {
    return this.currentVoiceCall
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

  get botCast(): BotCastId | null {
    return this.currentBotCast
  }

  get bots(): readonly Member[] {
    return this.seats.filter((member) => member.isBot)
  }

  get avatarsInUse(): AvatarId[] {
    return this.seats.flatMap((member) => (member.avatar === null ? [] : [member.avatar]))
  }

  get startReadiness(): StartReadiness {
    return evaluateStartReadiness(this.players, this.currentSettings)
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

  addBot(
    actorId: string,
    identity: Omit<MemberIdentity, 'name'>,
    profile: BotProfile,
    castWhenNone: BotCastId
  ): Result<Member, RoomError> {
    const authority = this.requireNarratorInLobby(actorId)
    if (!authority.ok) return authority
    if (this.players.length >= ROOM_LIMITS.maxPlayers) return err(roomError('room-full'))
    if (this.bots.length >= BOT_LIMITS.maxBots) return err(roomError('bot-limit'))
    const cast = this.currentBotCast ?? castWhenNone
    const name = BOT_CASTS[cast][this.currentSettings.botLanguage]
      .map((candidate) => DisplayName.create(candidate))
      .flatMap((candidate) => (candidate.ok ? [candidate.value] : []))
      .find((candidate) => !this.isNameTaken(candidate))
    if (name === undefined) return err(roomError('bot-limit'))
    const bot = new Member({ ...identity, name }, false, profile)
    bot.avatar = AVATAR_IDS.find((avatar) => !this.avatarsInUse.includes(avatar)) ?? null
    this.seats.push(bot)
    this.currentBotCast = cast
    return ok(bot)
  }

  removeBot(actorId: string, memberId: unknown): Result<Member, RoomError> {
    const authority = this.requireNarratorInLobby(actorId)
    if (!authority.ok) return authority
    const target = this.players.find((player) => player.id === memberId)
    if (target === undefined) return err(roomError('member-not-found'))
    if (!target.isBot) return err(roomError('not-a-bot'))
    this.removeSeat(target)
    return ok(target)
  }

  resume(token: unknown): Result<Member, RoomError> {
    const member = this.seats.find((seat) => seat.holdsToken(token))
    if (member === undefined) return err(roomError('session-invalid'))
    member.connected = true
    return ok(member)
  }

  disconnect(memberId: string): void {
    const member = this.memberWithId(memberId)
    if (member !== undefined && !member.isBot) member.connected = false
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

  setVoiceCall(actorId: string, url: unknown): Result<void, RoomError> {
    const member = this.requireMember(actorId)
    if (!member.ok) return member
    if (!member.value.isNarrator) return err(roomError('not-narrator'))
    const voiceCall = VoiceCallUrl.parse(url)
    if (!voiceCall.ok) return voiceCall
    this.currentVoiceCall = voiceCall.value
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
    const lobby = this.requireLobby()
    if (!lobby.ok) return lobby
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

  permitReplay(actorId: string): Result<void, RoomError> {
    const member = this.requireMember(actorId)
    if (!member.ok) return member
    if (!member.value.isNarrator) return err(roomError('not-narrator'))
    return this.currentStatus === 'in-game' ? done : err(roomError('game-not-over'))
  }

  reopen(): void {
    this.currentStatus = 'lobby'
    for (const player of this.players) player.ready = player.isBot
  }

  private isNameTaken(name: DisplayName): boolean {
    return this.seats.some((member) => member.name.sameAs(name))
  }

  private removeSeat(member: Member): void {
    this.seats.splice(this.seats.indexOf(member), 1)
    if (this.bots.length === 0) this.currentBotCast = null
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
