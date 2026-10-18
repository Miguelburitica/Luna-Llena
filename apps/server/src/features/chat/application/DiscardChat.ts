import type { ChatLogRepository } from './ports'

export class DiscardChat {
  constructor(private readonly logs: ChatLogRepository) {}

  execute(code: string): Promise<void> {
    return this.logs.remove(code)
  }
}
