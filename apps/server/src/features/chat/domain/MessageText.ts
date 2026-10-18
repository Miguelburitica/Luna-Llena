import { chatError, CHAT_LIMITS, err, ok, type ChatError, type Result } from '@luna/contracts'

export class MessageText {
  private constructor(readonly value: string) {}

  static create(input: unknown): Result<MessageText, ChatError> {
    const text = typeof input === 'string' ? input.trim() : ''
    const valid = text.length >= 1 && text.length <= CHAT_LIMITS.maxMessageLength
    return valid ? ok(new MessageText(text)) : err(chatError('message-invalid'))
  }
}
