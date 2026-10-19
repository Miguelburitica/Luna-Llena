export { SeededRandom } from '@luna/rules/fixtures'
import type { IdGenerator } from './IdGenerator'
import type { Clock } from './Clock'

export class FixedClock implements Clock {
  constructor(private current: number) {}

  now(): number {
    return this.current
  }

  advanceBy(milliseconds: number): void {
    this.current += milliseconds
  }
}

export class SequentialIds implements IdGenerator {
  private count = 0

  next(): string {
    this.count += 1
    return `id-${String(this.count).padStart(3, '0')}`
  }
}
