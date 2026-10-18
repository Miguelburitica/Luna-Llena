import type {
  AvatarId,
  CreateRoomInput,
  Result,
  RoomError,
  RoomSession,
  RoomSettingsInput,
  RoomSnapshot,
  RoomSummary
} from '@luna/contracts'
import type { InjectionKey } from 'vue'

export type RoomFailure = RoomError | { readonly code: 'unreachable' }

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
  leave(): RoomResult<void>
  start(): RoomResult<void>
  onSnapshot(listener: (snapshot: RoomSnapshot) => void): void
  onKicked(listener: () => void): void
  onClosed(listener: () => void): void
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

export const ROOM_GATEWAY: InjectionKey<RoomGateway> = Symbol('RoomGateway')

export const SESSION_STORE: InjectionKey<SessionStore> = Symbol('SessionStore')
