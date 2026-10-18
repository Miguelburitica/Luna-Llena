import type { ChatClientEvents, ChatServerEvents } from './chat/events'
import type { MatchClientEvents, MatchServerEvents } from './match/events'
import type { RoomClientEvents, RoomServerEvents } from './room/events'

export type ClientToServerEvents = RoomClientEvents & MatchClientEvents & ChatClientEvents

export type ServerToClientEvents = RoomServerEvents & MatchServerEvents & ChatServerEvents
