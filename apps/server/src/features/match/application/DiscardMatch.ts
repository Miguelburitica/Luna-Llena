import type { MatchRepository } from './ports'

export class DiscardMatch {
  constructor(private readonly matches: MatchRepository) {}

  execute(code: string): Promise<void> {
    return this.matches.remove(code)
  }
}
