import type { IdGenerator } from './IdGenerator'
import type { Clock } from './Clock'
import type { RandomSource } from './RandomSource'

export class FixedClock implements Clock {
  constructor(private current: number) {}

  now(): number {
    return this.current
  }

  advanceBy(milliseconds: number): void {
    this.current += milliseconds
  }
}

export class SeededRandom implements RandomSource {
  constructor(private state: number) {}

  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0
    let mixed = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

export class SequentialIds implements IdGenerator {
  private count = 0

  next(): string {
    this.count += 1
    return `id-${String(this.count).padStart(3, '0')}`
  }
}
