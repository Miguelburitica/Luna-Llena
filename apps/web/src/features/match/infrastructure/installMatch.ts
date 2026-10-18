import type { App } from 'vue'
import type { LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import { MATCH_GATEWAY } from '../application/ports'
import { SocketMatchGateway } from './SocketMatchGateway'

export const installMatch = (app: App, socket: LunaSocket): void => {
  app.provide(MATCH_GATEWAY, new SocketMatchGateway(socket))
}
