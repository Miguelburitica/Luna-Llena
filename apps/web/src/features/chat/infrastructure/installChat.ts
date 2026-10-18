import type { App } from 'vue'
import type { LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import { CHAT_GATEWAY } from '../application/ports'
import { SocketChatGateway } from './SocketChatGateway'

export const installChat = (app: App, socket: LunaSocket): void => {
  app.provide(CHAT_GATEWAY, new SocketChatGateway(socket))
}
