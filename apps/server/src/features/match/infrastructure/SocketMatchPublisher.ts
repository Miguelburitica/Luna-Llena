import type { CueEffect } from '@luna/contracts'
import { memberChannel } from '../../../shared/infrastructure/socketChannels'
import type { LunaServer } from '../../../shared/infrastructure/socketTypes'
import type { HauntDelivery, MatchPublisher, MemberMatchView } from '../application/ports'

export class SocketMatchPublisher implements MatchPublisher {
  constructor(private readonly io: LunaServer) {}

  publish(_code: string, views: readonly MemberMatchView[]): void {
    for (const { memberId, view } of views) this.io.to(memberChannel(memberId)).emit('match:view', view)
  }

  haunt(_code: string, deliveries: readonly HauntDelivery[]): void {
    for (const { memberId, effect } of deliveries) this.io.to(memberChannel(memberId)).emit('match:haunted', effect)
  }

  cue(_code: string, memberIds: readonly string[], effect: CueEffect): void {
    for (const memberId of memberIds) this.io.to(memberChannel(memberId)).emit('match:cued', effect)
  }
}
