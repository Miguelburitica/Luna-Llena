import type { ChatChannel } from '@luna/contracts'

export const BOT_CHAT_LIMITS = {
  villageLinesPerDay: 4,
  wolfLinesPerNight: 2,
  ghostLines: 1,
  recentWindow: 10,
  botLinesInWindow: 4
} as const

export class ChatBudget {
  private readonly spent = new Map<string, number>()
  private readonly recent: boolean[] = []
  private readonly seen = new Set<string>()

  allows(botId: string, channel: ChatChannel, round: number, answering = false): boolean {
    if (channel === 'village') {
      const botLines = this.recent.filter(Boolean).length
      const withinShare = answering || botLines < BOT_CHAT_LIMITS.botLinesInWindow
      return this.count(botId, channel, round) < BOT_CHAT_LIMITS.villageLinesPerDay && withinShare
    }
    if (channel === 'wolves') return this.count(botId, channel, round) < BOT_CHAT_LIMITS.wolfLinesPerNight
    return this.count(botId, channel, 0) < BOT_CHAT_LIMITS.ghostLines
  }

  reserve(botId: string, channel: ChatChannel, round: number): void {
    const key = this.keyOf(botId, channel, channel === 'ghosts' ? 0 : round)
    this.spent.set(key, (this.spent.get(key) ?? 0) + 1)
    if (channel === 'village') this.remember(true)
  }

  heard(messageId: string, channel: ChatChannel, byBot: boolean): void {
    if (this.seen.has(messageId)) return
    this.seen.add(messageId)
    if (channel === 'village' && !byBot) this.remember(false)
  }

  villageLinesOf(botId: string, round: number): number {
    return this.count(botId, 'village', round)
  }

  private remember(byBot: boolean): void {
    this.recent.push(byBot)
    if (this.recent.length > BOT_CHAT_LIMITS.recentWindow) this.recent.shift()
  }

  private count(botId: string, channel: ChatChannel, round: number): number {
    return this.spent.get(this.keyOf(botId, channel, channel === 'ghosts' ? 0 : round)) ?? 0
  }

  private keyOf(botId: string, channel: ChatChannel, round: number): string {
    return `${botId}:${channel}:${round}`
  }
}
