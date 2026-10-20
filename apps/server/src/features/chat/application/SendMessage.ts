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
import type { ClientIdentity } from '../../../shared/domain/ClientIdentity'
import { ChatLog } from '../domain/ChatLog'
import { MessageText } from '../domain/MessageText'
import { describeAudienceOf, type ChatAccess } from './chatAccess'
import type { Actor, ChatModeration, ChatPublisher, MemberChatPermissions } from './ports'

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
  readonly reviews: Array<Promise<void>> = []

  constructor(
    private readonly access: ChatAccess,
    private readonly publisher: ChatPublisher,
    private readonly ids: IdGenerator,
    private readonly moderation: ChatModeration
  ) {}

  async execute(
    actor: Actor,
    input: { readonly channel?: unknown; readonly text?: unknown },
    client?: ClientIdentity
  ): Promise<Result<ChatMessage, ChatError>> {
    const { logs, audience, clock } = this.access
    const now = clock.now()
    const description = await describeAudienceOf(audience, actor, now)
    if (!description.ok) return description
    if (client !== undefined && (await this.moderation.bannedUntil(client, now)) !== null) return err(chatError('banned'))
    if (await this.moderation.isMuted(actor.code, actor.memberId)) return err(chatError('chat-muted'))
    const text = MessageText.create(input.text)
    if (!text.ok) return text
    const reviewed = client !== undefined && (await this.moderation.isPublic(actor.code))
    if (reviewed && this.moderation.blockedByWordList(text.value.value)) return err(chatError('message-blocked'))
    const permissions = description.value.members.get(actor.memberId) as MemberChatPermissions
    const channel = requireWritable(permissions, input.channel)
    if (!channel.ok) return channel
    const log = (await logs.find(actor.code)) ?? ChatLog.open(actor.code)
    if (!log.admits(actor.memberId, now)) return err(chatError('chat-too-fast'))
    const kind = kindOf(actor.memberId === description.value.narratorId, channel.value, permissions)
    const message: ChatMessage = {
      id: this.ids.next(),
      channel: channel.value,
      kind,
      authorId: actor.memberId,
      text: text.value.value,
      sentAt: now
    }
    log.recordSend(actor.memberId, now)
    log.append(message)
    await logs.save(log)
    const recipients = [...description.value.members]
      .filter(([, member]) => member.read.includes(message.channel))
      .map(([memberId]) => memberId)
    this.publisher.deliver(message, recipients)
    if (reviewed) this.reviews.push(this.reviewInBackground(actor.code, message, recipients, client))
    else this.publisher.cleared(message, recipients)
    if (kind === 'last-words') await audience.lastWordsSpoken(actor.code, actor.memberId, now)
    return ok(message)
  }

  private async reviewInBackground(
    code: string,
    message: ChatMessage,
    recipients: readonly string[],
    client: ClientIdentity
  ): Promise<void> {
    const label = await this.moderation.review(code, message.text).catch(() => null)
    if (label === null || label === 'ok') {
      this.publisher.cleared(message, recipients)
      return
    }
    if (label !== 'injection') {
      const log = await this.access.logs.find(code)
      if (log !== undefined && log.remove(message.id) !== undefined) await this.access.logs.save(log)
      this.publisher.removed(message.id, recipients)
    }
    await this.moderation.strike({ client, reason: 'message-flagged', roomCode: code, excerpt: message.text })
  }
}
