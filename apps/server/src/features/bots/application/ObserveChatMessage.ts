import type { ChatMessage } from '@luna/contracts'
import { mentionsName, observeChat } from '../domain/suspicion'
import { planAnswer } from './botTurns'
import type { BotContext } from './ports'

export class ObserveChatMessage {
  constructor(private readonly context: BotContext) {}

  execute(recipientId: string, message: ChatMessage): void {
    const table = this.context.tables.findByMember(recipientId)
    const mind = table?.minds.get(recipientId)
    if (table === undefined || mind === undefined) return
    table.hear(message)
    observeChat(mind, message, table.roster)
    const askedByHuman = !table.isBot(message.authorId) && message.authorId !== mind.memberId
    if (
      message.channel === 'village' &&
      askedByHuman &&
      mind.isAlive &&
      mentionsName(message.text, mind.name) &&
      mind.markOnce(`answer:${message.id}`)
    ) {
      planAnswer(this.context, table, mind, message.authorId, message.text)
    }
  }
}
