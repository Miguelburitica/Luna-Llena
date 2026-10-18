import {
  chatError,
  CHAT_CHANNELS,
  err,
  ok,
  type ChatChannel,
  type ChatError,
  type ChatMessage,
  type MessageKind,
  type Result
} from '@luna/contracts'
import type { IdGenerator } from '../../../shared/application/IdGenerator'
import { ChatLog } from '../domain/ChatLog'
import { MessageText } from '../domain/MessageText'
import { describeAudienceOf, type ChatAccess } from './chatAccess'
import type { Actor, ChatPublisher, MemberChatPermissions } from './ports'

const isChannel = (value: unknown): value is ChatChannel => CHAT_CHANNELS.some((channel) => channel === value)

const requireWritable = (permissions: MemberChatPermissions, channel: unknown): Result<ChatChannel, ChatError> => {
  if (!isChannel(channel)) return err(chatError('chat-forbidden'))
  if (permissions.write.includes(channel)) return ok(channel)
  return err(chatError(permissions.closed.includes(channel) ? 'chat-closed' : 'chat-forbidden'))
}

const kindOf = (isNarrator: boolean, channel: ChatChannel, permissions: MemberChatPermissions): MessageKind => {
  if (isNarrator) return 'narrator'
  return channel === 'village' && permissions.lastWordsUntil !== null ? 'last-words' : 'player'
}

export class SendMessage {
  constructor(
    private readonly access: ChatAccess,
    private readonly publisher: ChatPublisher,
    private readonly ids: IdGenerator
  ) {}

  async execute(
    actor: Actor,
    input: { readonly channel?: unknown; readonly text?: unknown }
  ): Promise<Result<ChatMessage, ChatError>> {
    const { logs, audience, clock } = this.access
    const now = clock.now()
    const description = await describeAudienceOf(audience, actor, now)
    if (!description.ok) return description
    const text = MessageText.create(input.text)
    if (!text.ok) return text
    const permissions = description.value.members.get(actor.memberId) as MemberChatPermissions
    const channel = requireWritable(permissions, input.channel)
    if (!channel.ok) return channel
    const kind = kindOf(actor.memberId === description.value.narratorId, channel.value, permissions)
    const message: ChatMessage = {
      id: this.ids.next(),
      channel: channel.value,
      kind,
      authorId: actor.memberId,
      text: text.value.value,
      sentAt: now
    }
    const log = (await logs.find(actor.code)) ?? ChatLog.open(actor.code)
    log.append(message)
    await logs.save(log)
    const recipients = [...description.value.members]
      .filter(([, member]) => member.read.includes(message.channel))
      .map(([memberId]) => memberId)
    this.publisher.deliver(message, recipients)
    if (kind === 'last-words') await audience.lastWordsSpoken(actor.code, actor.memberId, now)
    return ok(message)
  }
}
