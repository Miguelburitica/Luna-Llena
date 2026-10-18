import { chatPermissionsOf, type ChatPermissions } from '../domain/chatPermissionsOf'
import type { MatchRepository } from './ports'

export interface ChatAudienceDescription {
  readonly narratorId: string
  readonly members: ReadonlyMap<string, ChatPermissions>
}

export class DescribeChatAudience {
  constructor(private readonly matches: MatchRepository) {}

  async execute(code: string, now: number): Promise<ChatAudienceDescription | undefined> {
    const match = await this.matches.find(code)
    if (match === undefined) return undefined
    const memberIds = [match.narratorId, ...match.seats.map((seat) => seat.memberId)]
    return {
      narratorId: match.narratorId,
      members: new Map(memberIds.map((memberId) => [memberId, chatPermissionsOf(match, memberId, now)]))
    }
  }
}
