import { err, ok, type ChatAccess, type ChatChannel, type ChatMessage, type Result } from '@luna/contracts'
import type { ChatFailure, ChatGateway } from './ports'

export const accessOf = (overrides: Partial<ChatAccess> = {}): ChatAccess => ({
  read: ['village'],
  write: [],
  lastWordsUntil: null,
  villagePaused: false,
  ...overrides
})

let counter = 0

export const messageOf = (overrides: Partial<ChatMessage> = {}): ChatMessage => {
  counter += 1
  return {
    id: `message-${String(counter).padStart(3, '0')}`,
    channel: 'village',
    kind: 'player',
    authorId: 'id-Pipe',
    text: 'Sofi is being weird on purpose',
    sentAt: 1_000_000 + counter,
    ...overrides
  }
}

export class FakeChatGateway implements ChatGateway {
  readonly calls: Array<{ command: string; input: unknown }> = []
  historyResult: Result<readonly ChatMessage[], ChatFailure> = ok([])
  sendResult: Result<ChatMessage, ChatFailure> | null = null
  private readonly messageListeners: Array<(message: ChatMessage) => void> = []
  private readonly reconnectedListeners: Array<() => void> = []

  history() {
    this.calls.push({ command: 'history', input: undefined })
    return Promise.resolve(this.historyResult)
  }

  send(channel: ChatChannel, text: string) {
    this.calls.push({ command: 'send', input: { channel, text } })
    return Promise.resolve(this.sendResult ?? ok(messageOf({ channel, text, authorId: 'id-Ana' })))
  }

  onMessage(listener: (message: ChatMessage) => void) {
    this.messageListeners.push(listener)
  }

  onReconnected(listener: () => void) {
    this.reconnectedListeners.push(listener)
  }

  pushMessage(message: ChatMessage) {
    for (const listener of this.messageListeners) listener(message)
  }

  pushReconnected() {
    for (const listener of this.reconnectedListeners) listener()
  }

  withHistory(messages: readonly ChatMessage[]): this {
    this.historyResult = ok(messages)
    return this
  }

  failWith(code: ChatFailure['code']): this {
    this.sendResult = err({ code } as ChatFailure)
    return this
  }

  commands(): string[] {
    return this.calls.map((call) => call.command)
  }
}
