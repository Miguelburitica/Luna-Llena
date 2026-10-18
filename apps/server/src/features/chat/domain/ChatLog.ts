import { CHAT_CHANNELS, CHAT_LIMITS, type ChatChannel, type ChatMessage } from '@luna/contracts'

export class ChatLog {
  private readonly messagesByChannel: Record<ChatChannel, ChatMessage[]> = {
    village: [],
    wolves: [],
    ghosts: []
  }

  private constructor(readonly code: string) {}

  static open(code: string): ChatLog {
    return new ChatLog(code)
  }

  append(message: ChatMessage): void {
    const messages = this.messagesByChannel[message.channel]
    messages.push(message)
    if (messages.length > CHAT_LIMITS.historyPerChannel) messages.splice(0, messages.length - CHAT_LIMITS.historyPerChannel)
  }

  messagesIn(channel: ChatChannel): readonly ChatMessage[] {
    return this.messagesByChannel[channel]
  }

  messagesOf(channels: readonly ChatChannel[]): ChatMessage[] {
    return CHAT_CHANNELS.filter((channel) => channels.includes(channel)).flatMap((channel) => this.messagesIn(channel))
  }
}
