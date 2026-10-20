import type { ChatClientEvents, ChatServerEvents } from './chat/events'
import type { MatchClientEvents, MatchServerEvents } from './match/events'
import type { AdminClientEvents } from './moderation/vocabulary'
import type { LobbyClientEvents, LobbyServerEvents, RoomClientEvents, RoomServerEvents } from './room/events'

export type ClientToServerEvents = RoomClientEvents &
  LobbyClientEvents &
  MatchClientEvents &
  ChatClientEvents &
  AdminClientEvents

export type ServerToClientEvents = RoomServerEvents & LobbyServerEvents & MatchServerEvents & ChatServerEvents
