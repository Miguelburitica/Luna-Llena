import { ok, type ChatError, type ChatMessage, type Result } from '@luna/contracts'
import { describeAudienceOf, type ChatAccess } from './chatAccess'
import type { Actor, MemberChatPermissions } from './ports'

const inSendingOrder = (first: ChatMessage, second: ChatMessage): number =>
  first.sentAt - second.sentAt || first.id.localeCompare(second.id)

export class ChatHistory {
  constructor(private readonly access: ChatAccess) {}

  async execute(actor: Actor): Promise<Result<ChatMessage[], ChatError>> {
    const { logs, audience, clock } = this.access
    const description = await describeAudienceOf(audience, actor, clock.now())
    if (!description.ok) return description
    const { read } = description.value.members.get(actor.memberId) as MemberChatPermissions
    const log = await logs.find(actor.code)
    return ok((log?.messagesOf(read) ?? []).sort(inSendingOrder))
  }
}
