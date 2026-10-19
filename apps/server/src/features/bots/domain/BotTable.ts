import type { ChatChannel, ChatMessage } from '@luna/contracts'
import { BotMind } from './BotMind'
import { nameIn, type BotRoster } from './BotRoster'
import type { ChatLine } from './botPrompt'
import { ChatBudget } from './ChatBudget'

const CHAT_MEMORY = 8

export class BotTable {
  readonly minds = new Map<string, BotMind>()
  readonly usedScripts = new Set<string>()
  private readonly chats = new Map<ChatChannel, ChatLine[]>()
  budget = new ChatBudget()
  speechCalls = 0
  private readonly heardIds = new Set<string>()

  constructor(public roster: BotRoster) {
    this.sync(roster)
  }

  get code(): string {
    return this.roster.code
  }

  sync(roster: BotRoster): void {
    this.roster = roster
    for (const [memberId, profile] of roster.bots) {
      if (!this.minds.has(memberId)) this.minds.set(memberId, new BotMind(memberId, nameIn(roster, memberId), profile))
    }
    for (const memberId of [...this.minds.keys()]) if (!roster.bots.has(memberId)) this.minds.delete(memberId)
  }

  reset(): void {
    this.minds.clear()
    this.chats.clear()
    this.usedScripts.clear()
    this.heardIds.clear()
    this.budget = new ChatBudget()
    this.speechCalls = 0
    this.sync(this.roster)
  }

  isBot(memberId: string): boolean {
    return this.roster.bots.has(memberId)
  }

  hear(message: ChatMessage): void {
    if (this.heardIds.has(message.id)) return
    this.heardIds.add(message.id)
    this.budget.heard(message.id, message.channel, this.isBot(message.authorId))
    const lines = this.chats.get(message.channel) ?? []
    lines.push({ author: nameIn(this.roster, message.authorId) || '?', text: message.text })
    if (lines.length > CHAT_MEMORY) lines.shift()
    this.chats.set(message.channel, lines)
  }

  chatOf(channel: ChatChannel): readonly ChatLine[] {
    return this.chats.get(channel) ?? []
  }
}
