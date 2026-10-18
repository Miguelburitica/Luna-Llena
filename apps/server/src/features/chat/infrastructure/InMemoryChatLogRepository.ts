import type { ChatLogRepository } from '../application/ports'
import type { ChatLog } from '../domain/ChatLog'

export class InMemoryChatLogRepository implements ChatLogRepository {
  private readonly logs = new Map<string, ChatLog>()

  async find(code: string): Promise<ChatLog | undefined> {
    return this.logs.get(code)
  }

  async save(log: ChatLog): Promise<void> {
    this.logs.set(log.code, log)
  }
}
