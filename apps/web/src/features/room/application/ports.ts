import type {
  AvatarId,
  BotDifficulty,
  BotPersonality,
  CreateRoomInput,
  PublicRoomCard,
  Result,
  RoomError,
  RoomSession,
  RoomSettingsInput,
  RoomSnapshot,
  RoomSummary,
  SeatTakeover
} from '@luna/contracts'
import type { InjectionKey } from 'vue'

export type RoomFailure = RoomError | { readonly code: 'unreachable' }

export interface BotChoice {
  readonly personality?: BotPersonality
  readonly difficulty?: BotDifficulty
}

export type RoomResult<T> = Promise<Result<T, RoomFailure>>

export interface RoomGateway {
  createRoom(input: CreateRoomInput): RoomResult<RoomSession>
  lookUp(code: string): RoomResult<RoomSummary>
  join(code: string, name: string): RoomResult<RoomSession>
  resume(code: string, token: string): RoomResult<RoomSession>
  chooseAvatar(avatar: AvatarId | null): RoomResult<void>
  setReady(ready: boolean): RoomResult<void>
  updateSettings(settings: RoomSettingsInput): RoomResult<void>
  kick(memberId: string): RoomResult<void>
  mute(memberId: string, muted: boolean): RoomResult<void>
  addBot(choice: BotChoice): RoomResult<void>
  removeBot(memberId: string): RoomResult<void>
  setVoiceCall(url: string | null): RoomResult<void>
  leave(): RoomResult<void>
  start(): RoomResult<void>
  playAgain(): RoomResult<void>
  onSnapshot(listener: (snapshot: RoomSnapshot) => void): void
  onKicked(listener: () => void): void
  onClosed(listener: () => void): void
  onSeatTakenOver(listener: (takeover: SeatTakeover) => void): void
  onReconnected(listener: () => void): void
}

export interface StoredSession {
  readonly code: string
  readonly memberId: string
  readonly token: string
}

export interface SessionStore {
  load(): StoredSession | null
  save(session: StoredSession): void
  clear(): void
}

export interface PublicGamesGateway {
  watch(): RoomResult<readonly PublicRoomCard[]>
  unwatch(): RoomResult<void>
  report(code: string): RoomResult<void>
  onRooms(listener: (rooms: readonly PublicRoomCard[]) => void): void
  onReconnected(listener: () => void): void
}

export const PUBLIC_GAMES_GATEWAY: InjectionKey<PublicGamesGateway> = Symbol('PublicGamesGateway')

export const ROOM_GATEWAY: InjectionKey<RoomGateway> = Symbol('RoomGateway')

export const SESSION_STORE: InjectionKey<SessionStore> = Symbol('SessionStore')
