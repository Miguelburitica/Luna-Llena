import type { MatchView, NightActionInput } from '@luna/contracts'
import { reachOrFail, type LunaSocket } from '@/shared/infrastructure/socket/lunaSocket'
import type { MatchGateway } from '../application/ports'

export class SocketMatchGateway implements MatchGateway {
  constructor(private readonly socket: LunaSocket) {}

  sync() {
    return reachOrFail(() => this.socket.emitWithAck('match:sync', {}))
  }

  advance() {
    return reachOrFail(() => this.socket.emitWithAck('match:advance', {}))
  }

  extendTimer() {
    return reachOrFail(() => this.socket.emitWithAck('match:extendTimer', {}))
  }

  setAlive(memberId: string, alive: boolean) {
    return reachOrFail(() => this.socket.emitWithAck('match:setAlive', { memberId, alive }))
  }

  endGame() {
    return reachOrFail(() => this.socket.emitWithAck('match:endGame', {}))
  }

  keepPlaying() {
    return reachOrFail(() => this.socket.emitWithAck('match:keepPlaying', {}))
  }

  act(input: NightActionInput) {
    return reachOrFail(() => this.socket.emitWithAck('match:act', input))
  }

  onView(listener: (view: MatchView) => void): void {
    this.socket.on('match:view', listener)
  }
}
