import type { BotScheduler } from '../application/ports'

export class TimerBotScheduler implements BotScheduler {
  private readonly timers = new Map<string, Set<ReturnType<typeof setTimeout>>>()

  after(code: string, delayMs: number, task: () => Promise<void>): void {
    const timers = this.timers.get(code) ?? new Set()
    this.timers.set(code, timers)
    const timer = setTimeout(() => {
      timers.delete(timer)
      task().catch((error: unknown) => console.error('Bot task failed', error))
    }, delayMs)
    timers.add(timer)
  }

  cancelAll(code: string): void {
    for (const timer of this.timers.get(code) ?? []) clearTimeout(timer)
    this.timers.delete(code)
  }
}
