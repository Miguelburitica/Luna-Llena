import type { ChatMessage } from '@luna/contracts'
import { accuses, mentionsName, observeChat } from '../domain/suspicion'
import { planAnswer } from './botTurns'
import type { BotContext } from './ports'

export const BOT_REPLY_ODDS = { paranoid: 0.7, chaos: 0.6, detective: 0.5, follower: 0.3, quiet: 0.2 } as const

export class ObserveChatMessage {
  constructor(private readonly context: BotContext) {}

  execute(recipientId: string, message: ChatMessage): void {
    const table = this.context.tables.findByMember(recipientId)
    const mind = table?.minds.get(recipientId)
    if (table === undefined || mind === undefined) return
    table.hear(message)
    observeChat(mind, message, table.roster)
    if (message.channel !== 'village' || message.authorId === mind.memberId || !mind.isAlive) return
    if (!mentionsName(message.text, mind.name)) return
    const byHuman = !table.isBot(message.authorId)
    const answers = byHuman || (accuses(message.text) && this.context.random.next() < BOT_REPLY_ODDS[mind.profile.personality])
    if (answers && mind.markOnce(`answer:${message.id}`) && table.allowance.mayAnswer(mind.memberId, message.authorId, this.context.clock.now())) {
      planAnswer(this.context, table, mind, message.authorId, message.text, byHuman)
    }
  }
}
