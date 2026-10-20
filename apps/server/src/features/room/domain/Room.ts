import {
  AVATAR_IDS,
  BOT_CASTS,
  BOT_LIMITS,
  done,
  err,
  ok,
  PUBLIC_LOBBY_LIMITS,
  ROOM_CLEANUP,
  roomError,
  ROOM_LIMITS,
  type AvatarId,
  type BotCastId,
  type BotProfile,
  type Result,
  type RoomError,
  type RoomStatus,
  type RoomVisibility,
  type SeatTakeover,
  type StartReadiness
} from '@luna/contracts'
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
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
  readonly visibility?: RoomVisibility
  readonly openedBy?: ClientIdentity | null
  readonly now?: number
}

export type Departure = 'player-left' | 'room-closed'

export type Abandonment = 'narrator-gone' | 'idle-lobby' | 'no-humans'

export interface BotReplacement {
  readonly token: string
  readonly profile: BotProfile
  readonly castWhenNone: BotCastId
}

export interface Kick {
  readonly member: Member
  readonly client: ClientIdentity | undefined
  readonly takeover: SeatTakeover | null
}

const MINUTE = 60_000

export class Room {
  private readonly seats: Member[]
  private currentStatus: RoomStatus = 'lobby'
  private currentSettings: RoomSettings
  private currentVoiceCall: VoiceCallUrl | null
  private currentBotCast: BotCastId | null = null
  private readonly reporters = new Set<string>()
  private readonly barredDevices = new Set<string>()
  private narratorAwaySince: number | null = null
  private humansAwaySince: number | null = null
  private lastChangedAt: number

  private constructor(
    readonly code: RoomCode,
    readonly name: RoomName,
    settings: RoomSettings,
    narrator: Member,
    voiceCall: VoiceCallUrl | null,
    readonly visibility: RoomVisibility,
    readonly openedBy: ClientIdentity | null,
    now: number
  ) {
    this.currentSettings = settings
    this.currentVoiceCall = voiceCall
    this.seats = [narrator]
    this.lastChangedAt = now
  }

  static open({
    code,
    name,
    settings,
    narrator,
    voiceCall = null,
    visibility = 'private',
    openedBy = null,
    now = 0
  }: RoomOpening): Room {
    return new Room(code, name, settings, new Member(narrator, true), voiceCall, visibility, openedBy, now)
  }

  get isPublic(): boolean {
    return this.visibility === 'public'
  }

  get isHidden(): boolean {
    return this.reporters.size >= PUBLIC_LOBBY_LIMITS.reportsToHide
  }

  get reportCount(): number {
    return this.reporters.size
  }

  get isListed(): boolean {
    return this.isPublic && this.narrator.connected && !this.isHidden
  }

  touch(now: number): void {
    this.lastChangedAt = now
  }

  abandonment(now: number): Abandonment | null {
    if (this.narratorAwaySince !== null && now - this.narratorAwaySince >= ROOM_CLEANUP.narratorAwayMinutes * MINUTE) {
      return 'narrator-gone'
    }
    if (this.humansAwaySince !== null && now - this.humansAwaySince >= ROOM_CLEANUP.noHumansMinutes * MINUTE) {
      return 'no-humans'
    }
    if (this.currentStatus === 'lobby' && now - this.lastChangedAt >= ROOM_CLEANUP.idleLobbyMinutes * MINUTE) {
      return 'idle-lobby'
    }
    return null
  }

  report(address: string): Result<boolean, RoomError> {
    if (!this.isPublic) return err(roomError('room-not-public'))
    const wasHidden = this.isHidden
    this.reporters.add(address)
    return ok(!wasHidden && this.isHidden)
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
    const device = identity.client?.device
    if (device !== undefined && this.barredDevices.has(device)) return err(roomError('kicked'))
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
    const name = this.freeBotName(cast)
    if (name === undefined) return err(roomError('bot-limit'))
    const bot = new Member({ ...identity, name }, false, profile)
    bot.avatar = AVATAR_IDS.find((avatar) => !this.avatarsInUse.includes(avatar)) ?? null
    this.seats.push(bot)
    this.currentBotCast = cast
    return ok(bot)
  }

  mute(actorId: string, targetId: unknown, muted: unknown): Result<Member, RoomError> {
    const member = this.requireMember(actorId)
    if (!member.ok) return member
    if (!member.value.isNarrator) return err(roomError('not-narrator'))
    const target = this.players.find((player) => player.id === targetId)
    if (target === undefined) return err(roomError('member-not-found'))
    target.muted = muted === true
    return ok(target)
  }

  isMuted(memberId: string): boolean {
    return this.memberWithId(memberId)?.muted ?? false
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
    if (member.isNarrator) this.narratorAwaySince = null
    this.humansAwaySince = null
    return ok(member)
  }

  disconnect(memberId: string, now = 0): void {
    const member = this.memberWithId(memberId)
    if (member === undefined || member.isBot) return
    member.connected = false
    if (member.isNarrator) this.narratorAwaySince ??= now
    const humansConnected = this.seats.some((seat) => !seat.isBot && seat.connected)
    if (!humansConnected) this.humansAwaySince ??= now
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

  kick(actorId: string, targetId: unknown, replacement: BotReplacement): Result<Kick, RoomError> {
    const member = this.requireMember(actorId)
    if (!member.ok) return member
    if (!member.value.isNarrator) return err(roomError('not-narrator'))
    const target = this.players.find((player) => player.id === targetId)
    if (target === undefined) return err(roomError('member-not-found'))
    const client = target.client
    if (this.currentStatus !== 'lobby' && target.isBot) return err(roomError('not-a-player'))
    if (this.isPublic && client !== undefined) this.barredDevices.add(client.device)
    if (this.currentStatus === 'lobby') {
      this.removeSeat(target)
      return ok({ member: target, client, takeover: null })
    }
    const cast = this.currentBotCast ?? replacement.castWhenNone
    const formerName = target.name.value
    const name = this.freeBotName(cast)
    if (name === undefined) return err(roomError('bot-limit'))
    target.becomeBot(name, replacement.token, replacement.profile)
    this.currentBotCast = cast
    return ok({ member: target, client, takeover: { formerName, botName: name.value } })
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

  private freeBotName(cast: BotCastId): DisplayName | undefined {
    return BOT_CASTS[cast][this.currentSettings.botLanguage]
      .map((candidate) => DisplayName.create(candidate))
      .flatMap((candidate) => (candidate.ok ? [candidate.value] : []))
      .find((candidate) => !this.isNameTaken(candidate))
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
