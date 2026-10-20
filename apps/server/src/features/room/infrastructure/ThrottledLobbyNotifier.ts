import { PUBLIC_LOBBY_LIMITS, type PublicRoomCard } from '@luna/contracts'
import { LOBBY_CHANNEL } from '../../../shared/infrastructure/socketChannels'
import type { LunaServer } from '../../../shared/infrastructure/socketTypes'
import type { LobbyNotifier } from '../application/ports'

export class ThrottledLobbyNotifier implements LobbyNotifier {
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly io: LunaServer,
    private readonly listing: () => Promise<readonly PublicRoomCard[]>,
    private readonly throttleMs: number = PUBLIC_LOBBY_LIMITS.listingThrottleMs
  ) {}

  changed(): void {
    if (this.timer !== null) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.listing()
        .then((rooms) => this.io.to(LOBBY_CHANNEL).emit('lobby:rooms', rooms))
        .catch((failure: unknown) => console.error('Lobby broadcast failed', failure))
    }, this.throttleMs)
  }

  stop(): void {
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
  }
}
