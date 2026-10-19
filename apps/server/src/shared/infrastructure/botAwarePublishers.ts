import type { ChatMessage, CueEffect, RoomSnapshot } from '@luna/contracts'
import type { ChatPublisher } from '../../features/chat/application/ports'
import type { HauntDelivery, MatchPublisher, MemberMatchView } from '../../features/match/application/ports'
import type { RoomPublisher } from '../../features/room/application/ports'
import type { BotsUseCases } from '../../features/bots/application/botsUseCases'

export class BotAwareRoomPublisher implements RoomPublisher {
  constructor(
    private readonly inner: RoomPublisher,
    private readonly bots: () => BotsUseCases
  ) {}

  publish(snapshot: RoomSnapshot): void {
    this.inner.publish(snapshot)
    this.bots().observeRoomSnapshot.execute(snapshot)
  }

  notifyKicked(code: string, memberId: string): void {
    this.inner.notifyKicked(code, memberId)
  }

  notifyClosed(code: string): void {
    this.inner.notifyClosed(code)
    this.bots().forgetRoom.execute(code)
  }
}

export class BotAwareMatchPublisher implements MatchPublisher {
  constructor(
    private readonly inner: MatchPublisher,
    private readonly bots: () => BotsUseCases
  ) {}

  publish(code: string, views: readonly MemberMatchView[]): void {
    this.inner.publish(code, views)
    for (const { memberId, view } of views) this.bots().observeMatchView.execute(code, memberId, view)
  }

  haunt(code: string, deliveries: readonly HauntDelivery[]): void {
    this.inner.haunt(code, deliveries)
  }

  cue(code: string, memberIds: readonly string[], effect: CueEffect): void {
    this.inner.cue(code, memberIds, effect)
  }
}

export class BotAwareChatPublisher implements ChatPublisher {
  constructor(
    private readonly inner: ChatPublisher,
    private readonly bots: () => BotsUseCases
  ) {}

  deliver(message: ChatMessage, recipientIds: readonly string[]): void {
    this.inner.deliver(message, recipientIds)
    for (const recipientId of recipientIds) this.bots().observeChatMessage.execute(recipientId, message)
  }
}
