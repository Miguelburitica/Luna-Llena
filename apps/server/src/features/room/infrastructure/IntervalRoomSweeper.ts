import { ROOM_CLEANUP } from '@luna/contracts'

export class IntervalRoomSweeper {
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly sweep: () => Promise<unknown>,
    private readonly intervalMs: number = ROOM_CLEANUP.sweepSeconds * 1000
  ) {}

  start(): void {
    if (this.timer !== null) return
    this.timer = setInterval(() => {
      this.sweep().catch((failure: unknown) => console.error('Room sweep failed', failure))
    }, this.intervalMs)
    this.timer.unref()
  }

  stop(): void {
    if (this.timer !== null) clearInterval(this.timer)
    this.timer = null
  }
}
