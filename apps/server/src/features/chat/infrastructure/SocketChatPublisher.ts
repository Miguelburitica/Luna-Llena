import type { ChatMessage } from '@luna/contracts'
import { memberChannel } from '../../../shared/infrastructure/socketChannels'
import type { LunaServer } from '../../../shared/infrastructure/socketTypes'
import type { ChatPublisher } from '../application/ports'

export class SocketChatPublisher implements ChatPublisher {
  constructor(private readonly io: LunaServer) {}

  deliver(message: ChatMessage, recipientIds: readonly string[]): void {
    for (const recipientId of recipientIds) this.io.to(memberChannel(recipientId)).emit('chat:message', message)
  }
}
