import type { Result } from '../result'
import type { RoomError } from './errors'
import type { RoomSession, RoomSettingsInput, RoomSnapshot, RoomSummary } from './views'
import type { AvatarId } from './vocabulary'

export type RoomAck<T> = (result: Result<T, RoomError>) => void

export interface CreateRoomInput {
  readonly roomName: string
  readonly narratorName: string
  readonly settings?: RoomSettingsInput
  readonly voiceCallUrl?: string | null
}

export interface RoomClientEvents {
  'room:create': (input: CreateRoomInput, ack: RoomAck<RoomSession>) => void
  'room:lookUp': (input: { readonly code: string }, ack: RoomAck<RoomSummary>) => void
  'room:join': (input: { readonly code: string; readonly name: string }, ack: RoomAck<RoomSession>) => void
  'room:resume': (input: { readonly code: string; readonly token: string }, ack: RoomAck<RoomSession>) => void
  'room:chooseAvatar': (input: { readonly avatar: AvatarId | null }, ack: RoomAck<void>) => void
  'room:setReady': (input: { readonly ready: boolean }, ack: RoomAck<void>) => void
  'room:updateSettings': (input: { readonly settings: RoomSettingsInput }, ack: RoomAck<void>) => void
  'room:kick': (input: { readonly memberId: string }, ack: RoomAck<void>) => void
  'room:leave': (input: Record<string, never>, ack: RoomAck<void>) => void
  'room:start': (input: Record<string, never>, ack: RoomAck<void>) => void
  'room:playAgain': (input: Record<string, never>, ack: RoomAck<void>) => void
  'room:setVoiceCall': (input: { readonly url: string | null }, ack: RoomAck<void>) => void
}

export interface RoomServerEvents {
  'room:snapshot': (snapshot: RoomSnapshot) => void
  'room:kicked': () => void
  'room:closed': () => void
}
