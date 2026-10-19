import type { RandomSource } from '../application/ports'

export class MathRandomSource implements RandomSource {
  next(): number {
    return Math.random()
  }
}
