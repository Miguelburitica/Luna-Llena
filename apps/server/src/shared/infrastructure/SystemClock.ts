import type { Clock } from '../application/Clock'

export class SystemClock implements Clock {
  now(): number {
    return Date.now()
  }
}
