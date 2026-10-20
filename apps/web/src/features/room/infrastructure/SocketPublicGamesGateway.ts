import type { PublicRoomCard } from '@luna/contracts'
import { reachOrFail, type LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import type { PublicGamesGateway } from '../application/ports'

export class SocketPublicGamesGateway implements PublicGamesGateway {
  constructor(private readonly socket: LunaSocket) {}

  watch() {
    return reachOrFail(() => this.socket.emitWithAck('lobby:watch', {}))
  }

  unwatch() {
    return reachOrFail(() => this.socket.emitWithAck('lobby:unwatch', {}))
  }

  report(code: string) {
    return reachOrFail(() => this.socket.emitWithAck('lobby:report', { code }))
  }

  onRooms(listener: (rooms: readonly PublicRoomCard[]) => void): void {
    this.socket.on('lobby:rooms', listener)
  }

  onReconnected(listener: () => void): void {
    this.socket.io.on('reconnect', listener)
  }
}
