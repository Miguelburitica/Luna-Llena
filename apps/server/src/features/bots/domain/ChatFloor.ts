import type { ChatChannel } from '@luna/contracts'

export class ChatFloor {
  private readonly held = new Set<ChatChannel>()
  private readonly dawnReactions = new Map<number, number>()

  isBusy(channel: ChatChannel): boolean {
    return this.held.has(channel)
  }

  hold(channel: ChatChannel): void {
    this.held.add(channel)
  }

  release(channel: ChatChannel): void {
    this.held.delete(channel)
  }

  dawnReactionsIn(round: number): number {
    return this.dawnReactions.get(round) ?? 0
  }

  countDawnReaction(round: number): void {
    this.dawnReactions.set(round, this.dawnReactionsIn(round) + 1)
  }
}
