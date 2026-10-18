import type { MatchRepository } from '../application/ports'
import type { Match } from '../domain/Match'

export class InMemoryMatchRepository implements MatchRepository {
  private readonly matches = new Map<string, Match>()

  async find(code: string): Promise<Match | undefined> {
    return this.matches.get(code)
  }

  async save(match: Match): Promise<void> {
    this.matches.set(match.code, match)
  }
}
