import type { MatchClientEvents, MatchServerEvents } from './match/events'
import type { RoomClientEvents, RoomServerEvents } from './room/events'

export type ClientToServerEvents = RoomClientEvents & MatchClientEvents

export type ServerToClientEvents = RoomServerEvents & MatchServerEvents
