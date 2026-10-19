import type { BotContext } from './ports'

export class ForgetRoom {
  constructor(private readonly context: BotContext) {}

  execute(code: string): void {
    this.context.scheduler.cancelAll(code)
    this.context.tables.forget(code)
  }
}
