import { chatError, err, ok, type ChatError, type Result } from '@luna/contracts'
import type { Clock } from '../../../shared/application/Clock'
import type { Actor, ChatAudience, ChatAudienceDescription, ChatLogRepository } from './ports'

export interface ChatAccess {
  readonly logs: ChatLogRepository
  readonly audience: ChatAudience
  readonly clock: Clock
}

export const describeAudienceOf = async (
  audience: ChatAudience,
  actor: Actor,
  now: number
): Promise<Result<ChatAudienceDescription, ChatError>> => {
  const description = await audience.membersOf(actor.code, now)
  if (description === undefined) return err(chatError('chat-not-open'))
  return description.members.has(actor.memberId) ? ok(description) : err(chatError('session-invalid'))
}
