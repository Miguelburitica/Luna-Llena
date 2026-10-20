import type { App } from 'vue'
import type { LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import { PUBLIC_GAMES_GATEWAY, ROOM_GATEWAY, SESSION_STORE } from '../application/ports'
import { LocalSessionStore } from './LocalSessionStore'
import { SocketPublicGamesGateway } from './SocketPublicGamesGateway'
import { SocketRoomGateway } from './SocketRoomGateway'

export const installRoom = (app: App, socket: LunaSocket): void => {
  app.provide(ROOM_GATEWAY, new SocketRoomGateway(socket))
  app.provide(SESSION_STORE, new LocalSessionStore())
  app.provide(PUBLIC_GAMES_GATEWAY, new SocketPublicGamesGateway(socket))
}
