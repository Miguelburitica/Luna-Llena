import type { StartCondition } from './vocabulary'

export const ROOM_ERROR_CODES = [
  'room-name-invalid',
  'name-invalid',
  'name-taken',
  'room-not-found',
  'room-full',
  'game-already-started',
  'session-invalid',
  'avatar-taken',
  'not-narrator',
  'not-a-player',
  'member-not-found',
  'settings-invalid',
  'start-conditions-unmet',
  'game-not-over',
  'voice-call-invalid',
  'bot-limit',
  'not-a-bot'
] as const
export type RoomErrorCode = (typeof ROOM_ERROR_CODES)[number]

export type RoomError =
  | { readonly code: 'name-taken'; readonly suggestions: readonly string[] }
  | { readonly code: 'start-conditions-unmet'; readonly unmet: readonly StartCondition[] }
  | { readonly code: Exclude<RoomErrorCode, 'name-taken' | 'start-conditions-unmet'> }

export type SimpleRoomErrorCode = Exclude<RoomErrorCode, 'name-taken' | 'start-conditions-unmet'>

export const roomError = (code: SimpleRoomErrorCode): RoomError => ({ code })
