import type { Clock } from '../../../shared/application/Clock'
import type { IdGenerator } from '../../../shared/application/IdGenerator'
import { ChatHistory } from './ChatHistory'
import { DiscardChat } from './DiscardChat'
import type { ChatAudience, ChatLogRepository, ChatModeration, ChatPublisher } from './ports'
import { SendMessage } from './SendMessage'
import { UNMODERATED_CHAT } from './unmoderatedChat'

export interface ChatDependencies {
  readonly logs: ChatLogRepository
  readonly publisher: ChatPublisher
  readonly audience: ChatAudience
  readonly clock: Clock
  readonly ids: IdGenerator
  readonly moderation?: ChatModeration
}

export const createChatUseCases = ({
  logs,
  publisher,
  audience,
  clock,
  ids,
  moderation = UNMODERATED_CHAT
}: ChatDependencies) => {
  const access = { logs, audience, clock }
  return {
    sendMessage: new SendMessage(access, publisher, ids, moderation),
    chatHistory: new ChatHistory(access),
    discardChat: new DiscardChat(logs)
  }
}

export type ChatUseCases = ReturnType<typeof createChatUseCases>
