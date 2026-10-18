import { memberChannel } from '../../../shared/infrastructure/socketChannels'
import type { LunaServer } from '../../../shared/infrastructure/socketTypes'
import type { MatchPublisher, MemberMatchView } from '../application/ports'

export class SocketMatchPublisher implements MatchPublisher {
  constructor(private readonly io: LunaServer) {}

  publish(_code: string, views: readonly MemberMatchView[]): void {
    for (const { memberId, view } of views) this.io.to(memberChannel(memberId)).emit('match:view', view)
  }
}
