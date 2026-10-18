import type { MatchRepository } from './ports'

export class IsMatchOver {
  constructor(private readonly matches: MatchRepository) {}

  async execute(code: string): Promise<boolean> {
    const match = await this.matches.find(code)
    return match !== undefined && match.outcome !== null
  }
}
