import { CHAT_CHANNELS, CHAT_LIMITS, type ChatChannel, type ChatMessage } from '@luna/contracts'

export class ChatLog {
  private readonly messagesByChannel: Record<ChatChannel, ChatMessage[]> = {
    village: [],
    wolves: [],
    ghosts: []
  }

  private readonly sendTimes = new Map<string, number[]>()

  private constructor(readonly code: string) {}

  static open(code: string): ChatLog {
    return new ChatLog(code)
  }

  append(message: ChatMessage): void {
    const messages = this.messagesByChannel[message.channel]
    messages.push(message)
    if (messages.length > CHAT_LIMITS.historyPerChannel) messages.splice(0, messages.length - CHAT_LIMITS.historyPerChannel)
  }

  admits(memberId: string, now: number): boolean {
    const windowStart = now - CHAT_LIMITS.burstSeconds * 1000
    const recent = (this.sendTimes.get(memberId) ?? []).filter((sentAt) => sentAt > windowStart)
    this.sendTimes.set(memberId, recent)
    return recent.length < CHAT_LIMITS.burstMessages
  }

  recordSend(memberId: string, now: number): void {
    this.sendTimes.set(memberId, [...(this.sendTimes.get(memberId) ?? []), now])
  }

  remove(messageId: string): ChatMessage | undefined {
    for (const channel of CHAT_CHANNELS) {
      const messages = this.messagesByChannel[channel]
      const index = messages.findIndex((message) => message.id === messageId)
      if (index >= 0) return messages.splice(index, 1)[0]
    }
    return undefined
  }

  messagesIn(channel: ChatChannel): readonly ChatMessage[] {
    return this.messagesByChannel[channel]
  }

  messagesOf(channels: readonly ChatChannel[]): ChatMessage[] {
    return CHAT_CHANNELS.filter((channel) => channels.includes(channel)).flatMap((channel) => this.messagesIn(channel))
  }
}
