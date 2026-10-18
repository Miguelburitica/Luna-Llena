import type { RandomSource } from '../application/RandomSource'

export class MathRandomSource implements RandomSource {
  next(): number {
    return Math.random()
  }
}
