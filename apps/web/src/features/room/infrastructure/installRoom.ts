import type { App } from 'vue'
import type { LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import { ROOM_GATEWAY, SESSION_STORE } from '../application/ports'
import { LocalSessionStore } from './LocalSessionStore'
import { SocketRoomGateway } from './SocketRoomGateway'

export const installRoom = (app: App, socket: LunaSocket): void => {
  app.provide(ROOM_GATEWAY, new SocketRoomGateway(socket))
  app.provide(SESSION_STORE, new LocalSessionStore())
}
