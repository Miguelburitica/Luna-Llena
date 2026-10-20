import { saveAndPublish, type MatchAccess } from './matchAccess'

export class RepublishMatch {
  constructor(private readonly access: MatchAccess) {}

  async execute(code: string): Promise<void> {
    const match = await this.access.matches.find(code)
    if (match !== undefined) await saveAndPublish(this.access, match)
  }
}
