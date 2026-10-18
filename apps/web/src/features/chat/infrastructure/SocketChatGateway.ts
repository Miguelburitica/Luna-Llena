import type { ChatChannel, ChatMessage } from '@luna/contracts'
import { reachOrFail, type LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import type { ChatGateway } from '../application/ports'

export class SocketChatGateway implements ChatGateway {
  constructor(private readonly socket: LunaSocket) {}

  history() {
    return reachOrFail(() => this.socket.emitWithAck('chat:history', {}))
  }

  send(channel: ChatChannel, text: string) {
    return reachOrFail(() => this.socket.emitWithAck('chat:send', { channel, text }))
  }

  onMessage(listener: (message: ChatMessage) => void): void {
    this.socket.on('chat:message', listener)
  }

  onReconnected(listener: () => void): void {
    this.socket.io.on('reconnect', listener)
  }
}
